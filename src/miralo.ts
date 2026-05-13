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
  // Usa PORT de Azure y fallback local para desarrollo.
  const port = Number(process.env.PORT ?? 5000)
  const host = '0.0.0.0'

  try {
    await connectMongo()
    await app.listen({ port, host })
    console.log(`Servidor corriendo en http://${host}:${port}`)
  } catch (err) {
    console.error('Error iniciando la aplicación:', err)
    app.log.error(err)
    process.exit(1)
  }
}

start()
