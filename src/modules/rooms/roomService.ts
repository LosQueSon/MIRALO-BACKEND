import roomRepository, { CreateRoomInput } from './roomRepository.js'
import type { Room } from './room.js'
import { AppError } from '../../shared/appError.js'
import chatService from '../chats/chatService.js'

const roomService = {
    getRooms: (): Promise<Room[]> =>
        roomRepository.findAll(),

    getRoomById: async (id: string): Promise<Room> => {
        const room = await roomRepository.findById(id)
        if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada')
        return room
    },

    createRoom: async (data: CreateRoomInput): Promise<Room> => {
        if (data.isPrivate && !data.accessCode?.trim()) {
            throw new AppError(400, 'ROOM_ACCESS_CODE_REQUIRED', 'Las salas privadas requieren un codigo de acceso')
        }
        if (data.maxUsers < 2 || data.maxUsers > 100) {
            throw new AppError(400, 'ROOM_INVALID_MAX_USERS', 'maxUsers debe estar entre 2 y 100')
        }

        const room = await roomRepository.create(data)

        try {
            const chat = await chatService.getOrCreateChat(room.id)
            const linkedRoom = await roomRepository.update(room.id, { chatId: chat.id })

            if (!linkedRoom) {
                throw new AppError(500, 'ROOM_CHAT_LINK_FAILED', 'No se pudo enlazar la sala con su chat')
            }

            return linkedRoom
        } catch (error) {
            // Evita dejar rooms huérfanas sin chat si falla la creación del chat.
            await roomRepository.delete(room.id)
            throw error
        }
    },

    validateJoinEligibility: async (roomId: string, accessCode?: string): Promise<Room> => {
        const room = await roomRepository.findById(roomId)
        if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada')
        if (room.state === 'finished') throw new AppError(400, 'ROOM_FINISHED', 'La sala ya termino')
        if (room.userIds.length >= room.maxUsers) throw new AppError(400, 'ROOM_FULL', 'Sala llena')
        if (room.isPrivate && room.accessCode !== accessCode) {
            throw new AppError(403, 'ROOM_INVALID_ACCESS_CODE', 'Codigo de acceso incorrecto')
        }

        return room
    },

    addUser: async (roomId: string, userId: string): Promise<Room> => {
        const room = await roomRepository.findById(roomId)
        if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada')

        const updatedRoom = await roomRepository.addUser(roomId, userId)
        if (!updatedRoom) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada')
        return updatedRoom
    },

    removeUser: async (roomId: string, userId: string): Promise<Room> => {
        const room = await roomRepository.findById(roomId)
        if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada')

        const updatedRoom = await roomRepository.removeUser(roomId, userId)
        if (!updatedRoom) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada')
        return updatedRoom
    },

    deleteRoom: async (id: string): Promise<void> => {
        const room = await roomRepository.findById(id)
        if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada')
        await roomRepository.delete(id)
    },
}

export default roomService