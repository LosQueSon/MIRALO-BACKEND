import { AppError } from '../../shared/appError.js'
import screenService from './screenService.js'

type ScreenSocket = {
  readyState: number
  send: (data: string) => void
  close: () => void
  on(event: 'message', listener: (raw: unknown) => void | Promise<void>): void
  on(event: 'close', listener: () => void): void
}

type ScreenSocketEvent = {
  event: 'set_video' | 'play' | 'pause' | 'seek' | 'forward' | 'get_state'
  videoUrl?: string
  currentTime?: number
  seconds?: number
}

const SOCKET_OPEN_STATE = 1
const roomSockets = new Map<string, Set<ScreenSocket>>()
const roomTickers = new Map<string, ReturnType<typeof setInterval>>()

const parseSocketPayload = (raw: unknown): string => {
  if (typeof raw === 'string') {
    return raw
  }

  if (Buffer.isBuffer(raw)) {
    return raw.toString()
  }

  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw).toString()
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw.filter(Buffer.isBuffer)).toString()
  }

  throw new AppError(400, 'INVALID_PAYLOAD', 'Formato de mensaje no soportado')
}

export const emitScreenEvent = (roomId: string, payload: unknown): void => {
  const sockets = roomSockets.get(roomId)

  if (!sockets || sockets.size === 0) {
    return
  }

  const serialized = JSON.stringify(payload)
  for (const socket of sockets) {
    if (socket.readyState === SOCKET_OPEN_STATE) {
      socket.send(serialized)
    }
  }
}

const stopRoomTicker = (roomId: string): void => {
  const ticker = roomTickers.get(roomId)

  if (!ticker) {
    return
  }

  clearInterval(ticker)
  roomTickers.delete(roomId)
}

const startRoomTicker = (roomId: string, userId: string): void => {
  if (roomTickers.has(roomId)) {
    return
  }

  const ticker = setInterval(async () => {
    try {
      const state = await screenService.getState(roomId, userId)

      if (!state.isPlaying) {
        stopRoomTicker(roomId)
        return
      }

      emitScreenEvent(roomId, {
        event: 'screen_tick',
        data: state
      })
    } catch {
      stopRoomTicker(roomId)
    }
  }, 1000)

  roomTickers.set(roomId, ticker)
}

const sendError = (socket: ScreenSocket, error: unknown): void => {
  const appError = error instanceof AppError
    ? error
    : new AppError(500, 'INTERNAL_SERVER_ERROR', 'Error procesando evento del socket')

  socket.send(JSON.stringify({
    event: 'error',
    code: appError.code,
    message: appError.message
  }))
}

export const handleScreenWebSocket = (socket: ScreenSocket, roomId: string, userId: string): void => {
  const joinRoom = async (): Promise<void> => {
    try {
      const state = await screenService.getState(roomId, userId)
      const sockets = roomSockets.get(roomId) ?? new Set<ScreenSocket>()
      sockets.add(socket)
      roomSockets.set(roomId, sockets)

      socket.send(JSON.stringify({
        event: 'connected',
        roomId,
        userId,
        data: state
      }))

      if (state.isPlaying) {
        startRoomTicker(roomId, userId)
      }
    } catch (error) {
      sendError(socket, error)
      socket.close()
    }
  }

  socket.on('message', async (raw: unknown) => {
    try {
      const payload = JSON.parse(parseSocketPayload(raw)) as ScreenSocketEvent

      if (payload.event === 'get_state') {
        const state = await screenService.getState(roomId, userId)
        socket.send(JSON.stringify({ event: 'screen_state', data: state }))
        return
      }

      if (payload.event === 'set_video') {
        const result = await screenService.setVideo(roomId, userId, payload.videoUrl ?? '', payload.currentTime)
        emitScreenEvent(roomId, { event: 'screen_updated', action: result.action, data: result.state })
        stopRoomTicker(roomId)
        return
      }

      if (payload.event === 'play') {
        const result = await screenService.play(roomId, userId, payload.currentTime)
        emitScreenEvent(roomId, { event: 'screen_updated', action: result.action, data: result.state })
        startRoomTicker(roomId, userId)
        return
      }

      if (payload.event === 'pause') {
        const result = await screenService.pause(roomId, userId, payload.currentTime)
        emitScreenEvent(roomId, { event: 'screen_updated', action: result.action, data: result.state })
        stopRoomTicker(roomId)
        return
      }

      if (payload.event === 'seek') {
        const result = await screenService.seek(roomId, userId, payload.currentTime ?? NaN)
        emitScreenEvent(roomId, { event: 'screen_updated', action: result.action, data: result.state })
        return
      }

      if (payload.event === 'forward') {
        const result = await screenService.forward(roomId, userId, payload.seconds ?? NaN)
        emitScreenEvent(roomId, { event: 'screen_updated', action: result.action, data: result.state })
        return
      }

      socket.send(JSON.stringify({
        event: 'error',
        code: 'INVALID_EVENT',
        message: 'Evento no soportado'
      }))
    } catch (error) {
      sendError(socket, error)
    }
  })

  socket.on('close', () => {
    const sockets = roomSockets.get(roomId)

    if (!sockets) {
      return
    }

    sockets.delete(socket)

    if (sockets.size === 0) {
      roomSockets.delete(roomId)
      stopRoomTicker(roomId)
    }
  })

  void joinRoom()
}

