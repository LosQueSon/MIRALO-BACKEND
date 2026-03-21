import type { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../../shared/appError.js'
import roomServiceModule from './roomService.js'


export default class RoomController {
    constructor(private readonly roomService: typeof roomServiceModule) {}

    getRooms = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            const rooms = await this.roomService.getRooms()
            reply.code(200).send(rooms)
        } catch (error) {
            this.handleError(error, reply)
        }
    }

    createRoom = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            const body = request.body as {
                name: string
                isPrivate: boolean
                accessCode?: string
                maxUsers: number
            }

            const room = await this.roomService.createRoom({
                ...body,
                accessCode: body.accessCode ?? ''
            })
            reply.code(201).send(room)
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
