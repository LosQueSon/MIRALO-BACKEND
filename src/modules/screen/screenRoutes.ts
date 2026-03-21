import type { FastifyInstance } from 'fastify'
import { AppError } from '../../shared/appError.js'
import ScreenController from './screenController.js'
import screenService from './screenService.js'
import { emitScreenEvent, handleScreenWebSocket } from './screen.ws-handler.js'

export default async function screenRoutes(fastify: FastifyInstance) {
  const screenController = new ScreenController(screenService, emitScreenEvent)
  const objectIdRegex = /^[a-fA-F0-9]{24}$/

  // --- Rutas HTTP ---
  fastify.get('/rooms/:roomId/screen/state', screenController.getState)
  fastify.post('/rooms/:roomId/screen/video', screenController.setVideo)
  fastify.post('/rooms/:roomId/screen/play', screenController.play)
  fastify.post('/rooms/:roomId/screen/pause', screenController.pause)
  fastify.post('/rooms/:roomId/screen/seek', screenController.seek)
  fastify.post('/rooms/:roomId/screen/forward', screenController.forward)

  // --- WebSocket ---
  fastify.get<{ Params: { roomId: string }; Querystring: { userId?: string } }>('/ws/rooms/:roomId/screen', { websocket: true }, (socket, request) => {
    try {
      const roomId = request.params.roomId
      const userId = request.query?.userId?.trim()

      if (!userId || !objectIdRegex.test(userId)) {
        throw new AppError(
          400,
          'INVALID_USER_ID',
          'Debe enviar un userId valido (ObjectId) por query (?userId=...)'
        )
      }

      handleScreenWebSocket(socket, roomId, userId)
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError(500, 'INTERNAL_SERVER_ERROR', 'Error al conectar al WebSocket de screen')

      socket.send(JSON.stringify({
        event: 'error',
        code: appError.code,
        message: appError.message
      }))

      socket.close()
    }
  })
}
