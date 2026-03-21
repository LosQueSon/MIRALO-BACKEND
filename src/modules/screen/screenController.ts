import type { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../../shared/appError.js'
import type { ScreenCommandResult, ScreenSnapshot } from './screen.js'

type RoomParams = {
  roomId: string
}

type UserQuery = {
  userId?: string
}

type SetVideoBody = {
  userId: string
  videoUrl: string
  currentTime?: number
}

type PlaybackBody = {
  userId: string
  currentTime?: number
}

type SeekBody = {
  userId: string
  currentTime: number
}

type ForwardBody = {
  userId: string
  seconds: number
}

type ScreenServiceLike = {
  getState: (roomId: string, userId: string) => Promise<ScreenSnapshot>
  setVideo: (roomId: string, userId: string, videoUrl: string, startAt?: number) => Promise<ScreenCommandResult>
  play: (roomId: string, userId: string, currentTime?: number) => Promise<ScreenCommandResult>
  pause: (roomId: string, userId: string, currentTime?: number) => Promise<ScreenCommandResult>
  seek: (roomId: string, userId: string, currentTime: number) => Promise<ScreenCommandResult>
  forward: (roomId: string, userId: string, seconds: number) => Promise<ScreenCommandResult>
}

type EmitScreenEvent = (roomId: string, payload: unknown) => void

export default class ScreenController {
  constructor(
    private readonly screenService: ScreenServiceLike,
    private readonly emitScreenEvent: EmitScreenEvent
  ) {}

  getState = async (
    request: FastifyRequest<{ Params: RoomParams; Querystring: UserQuery }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const userId = request.query.userId?.trim() ?? ''
      const state = await this.screenService.getState(request.params.roomId, userId)
      reply.code(200).send(state)
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  setVideo = async (
    request: FastifyRequest<{ Params: RoomParams; Body: SetVideoBody }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const result = await this.screenService.setVideo(
        request.params.roomId,
        request.body.userId,
        request.body.videoUrl,
        request.body.currentTime
      )

      this.emitScreenEvent(request.params.roomId, {
        event: 'screen_updated',
        action: result.action,
        data: result.state
      })

      reply.code(200).send(result)
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  play = async (
    request: FastifyRequest<{ Params: RoomParams; Body: PlaybackBody }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const result = await this.screenService.play(
        request.params.roomId,
        request.body.userId,
        request.body.currentTime
      )

      this.emitScreenEvent(request.params.roomId, {
        event: 'screen_updated',
        action: result.action,
        data: result.state
      })

      reply.code(200).send(result)
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  pause = async (
    request: FastifyRequest<{ Params: RoomParams; Body: PlaybackBody }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const result = await this.screenService.pause(
        request.params.roomId,
        request.body.userId,
        request.body.currentTime
      )

      this.emitScreenEvent(request.params.roomId, {
        event: 'screen_updated',
        action: result.action,
        data: result.state
      })

      reply.code(200).send(result)
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  seek = async (
    request: FastifyRequest<{ Params: RoomParams; Body: SeekBody }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const result = await this.screenService.seek(
        request.params.roomId,
        request.body.userId,
        request.body.currentTime
      )

      this.emitScreenEvent(request.params.roomId, {
        event: 'screen_updated',
        action: result.action,
        data: result.state
      })

      reply.code(200).send(result)
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  forward = async (
    request: FastifyRequest<{ Params: RoomParams; Body: ForwardBody }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const result = await this.screenService.forward(
        request.params.roomId,
        request.body.userId,
        request.body.seconds
      )

      this.emitScreenEvent(request.params.roomId, {
        event: 'screen_updated',
        action: result.action,
        data: result.state
      })

      reply.code(200).send(result)
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        code: error.code,
        message: error.message
      })
      return
    }

    reply.code(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrio un error inesperado'
    })
  }
}

