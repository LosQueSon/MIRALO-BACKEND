import 'dotenv/config'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import { connectMongo } from './config/mongo.js'
import corsPlugin from './plugins/cors.js'
import userRoutes from './modules/users/userRoutes.js'
import roomRoutes from './modules/rooms/roomRoutes.js'
import chatRoutes from './modules/chats/chatRoutes.js'

const app = Fastify({ logger: true })

app.register(websocket)
app.register(corsPlugin)
app.register(userRoutes)
app.register(roomRoutes)
app.register(chatRoutes)


const start = async (): Promise<void> => {
  try {
    await connectMongo()
    await app.listen({ port: 5000 })
    console.log('Servidor corriendo en http://localhost:5000')
  } catch (err) {
    console.error('Error iniciando la aplicación:', err)
    app.log.error(err)
    process.exit(1)
  }
}

start()