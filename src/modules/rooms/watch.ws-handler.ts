import { AppError } from '../../shared/appError.js'
import roomService from './roomService.js'

type WatchSocket = {
  readyState: number
  send: (data: string) => void
  close: () => void
  on(event: 'message', listener: (raw: unknown) => void | Promise<void>): void
  on(event: 'close', listener: () => void): void
}

type WatchEvent = 'play' | 'pause' | 'seek' | 'get_state'

const SOCKET_OPEN_STATE = 1
const roomWatchSockets = new Map<string, Set<WatchSocket>>()

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

const broadcastToRoom = (roomId: string, payload: unknown): void => {
  const sockets = roomWatchSockets.get(roomId)

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

const sendError = (socket: WatchSocket, error: unknown): void => {
  const appError = error instanceof AppError
    ? error
    : new AppError(500, 'INTERNAL_SERVER_ERROR', 'Error procesando evento del socket')

  socket.send(JSON.stringify({
    event: 'error',
    code: appError.code,
    message: appError.message
  }))
}

export const handleWatchWebSocket = (socket: WatchSocket, roomId: string, userId: string): void => {
  const joinRoom = async (): Promise<void> => {
    try {
      await roomService.ensureUserInRoom(roomId, userId)
      const playback = await roomService.getWatchState(roomId)

      const sockets = roomWatchSockets.get(roomId) ?? new Set<WatchSocket>()
      sockets.add(socket)
      roomWatchSockets.set(roomId, sockets)

      socket.send(JSON.stringify({
        event: 'connected',
        roomId,
        userId,
        data: playback
      }))
    } catch (error) {
      sendError(socket, error)
      socket.close()
    }
  }

  socket.on('message', async (raw: unknown) => {
    try {
      const payload = JSON.parse(parseSocketPayload(raw)) as {
        event: WatchEvent
        positionMs?: number
      }

      if (payload.event === 'get_state') {
        const playback = await roomService.getWatchState(roomId)
        socket.send(JSON.stringify({
          event: 'watch_state',
          data: playback
        }))
        return
      }

      if (payload.event === 'play' || payload.event === 'pause' || payload.event === 'seek') {
        const playback = await roomService.updateWatchState(roomId, userId, {
          action: payload.event,
          positionMs: Number(payload.positionMs ?? 0)
        })

        broadcastToRoom(roomId, {
          event: 'watch_state',
          data: playback
        })
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
    const sockets = roomWatchSockets.get(roomId)
    if (!sockets) {
      return
    }

    sockets.delete(socket)
    if (sockets.size === 0) {
      roomWatchSockets.delete(roomId)
    }
  })

  void joinRoom()
}

