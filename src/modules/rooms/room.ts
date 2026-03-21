export interface Room {
  id: string
  name: string
  isPrivate: boolean
  accessCode: string
  maxUsers: number
  userIds: string[]
  chatId:string
  state: 'waiting' | 'active' | 'finished'
  createdAt: Date
  updatedAt: Date
}

