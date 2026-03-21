import type { FastifyInstance } from 'fastify'
import RoomController from './roomController.js'
import roomService from './roomService.js'

export default async function roomRoutes(fastify: FastifyInstance) {
    const controller = new RoomController(roomService)

    fastify.get('/rooms', controller.getRooms)
    fastify.post('/rooms/create', controller.createRoom)

}