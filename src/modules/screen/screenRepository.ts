import type { Collection, ObjectId, WithId } from 'mongodb'
import { getScreensCollection } from '../../config/mongo.js'
import type { ScreenState } from './screen.js'
import { AppError } from '../../shared/appError.js'

export interface ScreenDocument {
  _id?: ObjectId
  roomId: string
  isPlaying: boolean
  currentTime: number
  videoUrl: string
  playbackStartedAt?: Date | null
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

type UpsertScreenInput = {
  roomId: string
  isPlaying: boolean
  currentTime: number
  videoUrl: string
  playbackStartedAt: Date | null
  updatedBy: string
}

let collection: Collection<ScreenDocument> | null = null

const resolveCollection = async (): Promise<Collection<ScreenDocument>> => {
  if (collection) {
    return collection
  }

  collection = await getScreensCollection()
  return collection
}

const toScreenState = (document: WithId<ScreenDocument>): ScreenState => ({
  roomId: document.roomId,
  isPlaying: document.isPlaying,
  currentTime: document.currentTime,
  videoUrl: document.videoUrl,
  playbackStartedAt: document.playbackStartedAt ?? null,
  updatedBy: document.updatedBy,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
})

const screenRepository = {
  async findByRoomId(roomId: string): Promise<ScreenState | null> {
    const screensCollection = await resolveCollection()
    const document = await screensCollection.findOne({ roomId })
    return document ? toScreenState(document) : null
  },

  async upsertByRoomId(input: UpsertScreenInput): Promise<ScreenState> {
    const screensCollection = await resolveCollection()
    const now = new Date()

    const document = await screensCollection.findOneAndUpdate(
      { roomId: input.roomId },
      {
        $set: {
          isPlaying: input.isPlaying,
          currentTime: input.currentTime,
          videoUrl: input.videoUrl,
          playbackStartedAt: input.playbackStartedAt,
          updatedBy: input.updatedBy,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    if (!document) {
      throw new AppError(500, 'SCREEN_UPSERT_FAILED', 'No se pudo actualizar el estado de pantalla')
    }

    return toScreenState(document)
  }
}

export default screenRepository