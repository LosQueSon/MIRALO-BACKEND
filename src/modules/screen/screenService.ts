import { AppError } from '../../shared/appError.js'
import chatService from '../chats/chatService.js'
import type { ScreenCommandResult, ScreenState } from './screen.js'
import screenRepository from './screenRepository.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/
const DEFAULT_VIDEO_URL = ''

const ensureObjectId = (value: string | undefined, code: string, message: string): void => {
  if (!value || !OBJECT_ID_REGEX.test(value)) {
    throw new AppError(400, code, message)
  }
}

const ensureNonNegativeTime = (value: number, code: string, message: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new AppError(400, code, message)
  }
}

const getOrCreateState = async (roomId: string, userId: string): Promise<ScreenState> => {
  const existing = await screenRepository.findByRoomId(roomId)

  if (existing) {
    return existing
  }

  return screenRepository.upsertByRoomId({
    roomId,
    isPlaying: false,
    currentTime: 0,
    videoUrl: DEFAULT_VIDEO_URL,
    updatedBy: userId
  })
}

const screenService = {
  async getState(roomId: string, userId: string): Promise<ScreenState> {
    ensureObjectId(roomId, 'INVALID_ROOM_ID', 'El roomId debe ser un ObjectId valido')
    ensureObjectId(userId, 'INVALID_USER_ID', 'El userId debe ser un ObjectId valido')

    await chatService.ensureChatAccess(roomId, userId)
    return getOrCreateState(roomId, userId)
  },

  async setVideo(roomId: string, userId: string, videoUrl: string, startAt = 0): Promise<ScreenCommandResult> {
    ensureObjectId(roomId, 'INVALID_ROOM_ID', 'El roomId debe ser un ObjectId valido')
    ensureObjectId(userId, 'INVALID_USER_ID', 'El userId debe ser un ObjectId valido')

    const normalizedUrl = videoUrl?.trim()
    if (!normalizedUrl) {
      throw new AppError(400, 'VIDEO_URL_REQUIRED', 'La URL del video es obligatoria')
    }

    ensureNonNegativeTime(startAt, 'INVALID_CURRENT_TIME', 'currentTime debe ser mayor o igual a 0')

    await chatService.ensureChatAccess(roomId, userId)

    const state = await screenRepository.upsertByRoomId({
      roomId,
      isPlaying: false,
      currentTime: startAt,
      videoUrl: normalizedUrl,
      updatedBy: userId
    })

    return { action: 'set_video', state }
  },

  async play(roomId: string, userId: string, currentTime?: number): Promise<ScreenCommandResult> {
    ensureObjectId(roomId, 'INVALID_ROOM_ID', 'El roomId debe ser un ObjectId valido')
    ensureObjectId(userId, 'INVALID_USER_ID', 'El userId debe ser un ObjectId valido')
    await chatService.ensureChatAccess(roomId, userId)

    const currentState = await getOrCreateState(roomId, userId)
    const nextTime = currentTime ?? currentState.currentTime
    ensureNonNegativeTime(nextTime, 'INVALID_CURRENT_TIME', 'currentTime debe ser mayor o igual a 0')

    const state = await screenRepository.upsertByRoomId({
      roomId,
      isPlaying: true,
      currentTime: nextTime,
      videoUrl: currentState.videoUrl,
      updatedBy: userId
    })

    return { action: 'play', state }
  },

  async pause(roomId: string, userId: string, currentTime?: number): Promise<ScreenCommandResult> {
    ensureObjectId(roomId, 'INVALID_ROOM_ID', 'El roomId debe ser un ObjectId valido')
    ensureObjectId(userId, 'INVALID_USER_ID', 'El userId debe ser un ObjectId valido')
    await chatService.ensureChatAccess(roomId, userId)

    const currentState = await getOrCreateState(roomId, userId)
    const nextTime = currentTime ?? currentState.currentTime
    ensureNonNegativeTime(nextTime, 'INVALID_CURRENT_TIME', 'currentTime debe ser mayor o igual a 0')

    const state = await screenRepository.upsertByRoomId({
      roomId,
      isPlaying: false,
      currentTime: nextTime,
      videoUrl: currentState.videoUrl,
      updatedBy: userId
    })

    return { action: 'pause', state }
  },

  async seek(roomId: string, userId: string, currentTime: number): Promise<ScreenCommandResult> {
    ensureObjectId(roomId, 'INVALID_ROOM_ID', 'El roomId debe ser un ObjectId valido')
    ensureObjectId(userId, 'INVALID_USER_ID', 'El userId debe ser un ObjectId valido')
    ensureNonNegativeTime(currentTime, 'INVALID_CURRENT_TIME', 'currentTime debe ser mayor o igual a 0')
    await chatService.ensureChatAccess(roomId, userId)

    const currentState = await getOrCreateState(roomId, userId)
    const state = await screenRepository.upsertByRoomId({
      roomId,
      isPlaying: currentState.isPlaying,
      currentTime,
      videoUrl: currentState.videoUrl,
      updatedBy: userId
    })

    return { action: 'seek', state }
  },

  async forward(roomId: string, userId: string, seconds: number): Promise<ScreenCommandResult> {
    ensureObjectId(roomId, 'INVALID_ROOM_ID', 'El roomId debe ser un ObjectId valido')
    ensureObjectId(userId, 'INVALID_USER_ID', 'El userId debe ser un ObjectId valido')

    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new AppError(400, 'INVALID_FORWARD_SECONDS', 'seconds debe ser mayor a 0')
    }

    await chatService.ensureChatAccess(roomId, userId)

    const currentState = await getOrCreateState(roomId, userId)
    const state = await screenRepository.upsertByRoomId({
      roomId,
      isPlaying: currentState.isPlaying,
      currentTime: currentState.currentTime + seconds,
      videoUrl: currentState.videoUrl,
      updatedBy: userId
    })

    return { action: 'forward', state }
  }
}

export default screenService