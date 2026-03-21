export const errorSchema = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    message: { type: 'string' }
  },
  required: ['code', 'message']
} as const

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    googleId: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    picture: { type: 'string' },
    provider: { type: 'string', enum: ['google'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'googleId', 'name', 'email', 'provider', 'createdAt', 'updatedAt']
} as const

export const roomSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    isPrivate: { type: 'boolean' },
    accessCode: { type: 'string' },
    maxUsers: { type: 'integer' },
    userIds: {
      type: 'array',
      items: { type: 'string' }
    },
    chatId: { type: 'string' },
    state: { type: 'string', enum: ['waiting', 'active', 'finished'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'name', 'isPrivate', 'accessCode', 'maxUsers', 'userIds', 'chatId', 'state', 'createdAt', 'updatedAt']
} as const

export const chatMessageSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    content: { type: 'string' },
    type: { type: 'string', enum: ['text', 'system', 'reaction'] },
    timestamp: { type: 'string', format: 'date-time' },
    isPinned: { type: 'boolean' }
  },
  required: ['id', 'userId', 'content', 'type', 'timestamp', 'isPinned']
} as const

export const chatSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    roomId: { type: 'string' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    pinnedMessageId: { type: 'string' },
    messages: {
      type: 'array',
      items: chatMessageSchema
    }
  },
  required: ['id', 'roomId', 'isActive', 'createdAt', 'updatedAt', 'messages']
} as const

export const joinRoomResultSchema = {
  type: 'object',
  properties: {
    room: roomSchema,
    chat: chatSchema
  },
  required: ['room', 'chat']
} as const

