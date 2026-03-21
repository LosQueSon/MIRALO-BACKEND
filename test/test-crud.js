import jwt from 'jsonwebtoken'

const JWT_SECRET = 'super_secreto_largo'

// Generar un token JWT simulando Google
const generateTestToken = (userData = {}) => {
  const payload = {
    sub: userData.sub || '123456789',
    email: userData.email || 'john@example.com',
    name: userData.name || 'John Doe',
    picture: userData.picture || 'https://example.com/photo.jpg',
    provider: 'google'
  }

  return jwt.sign(payload, JWT_SECRET)
}

// Función para hacer requests HTTP
const makeRequest = async (method, url, body = null, token = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, options)
  const data = await response.json()

  return { status: response.status, data }
}

const testCRUD = async () => {
  const baseUrl = 'http://localhost:5000'

  console.log('\n=== Testing User CRUD with JWT ===\n')

  try {
    // 1. GET /users - lista vacía al inicio
    console.log('1. GET /users (lista vacía)')
    let result = await makeRequest('GET', `${baseUrl}/users`)
    console.log('Response:', result)

    // 2. POST /users - crear usuario con token JWT
    console.log('\n2. POST /users (crear usuario con JWT)')
    const token1 = generateTestToken({
      sub: 'google_123',
      email: 'john@example.com',
      name: 'John Doe',
      picture: 'https://example.com/john.jpg'
    })
    console.log('Token:', token1)
    result = await makeRequest('POST', `${baseUrl}/users`, { token: token1 })
    console.log('Response:', result)
    const userId1 = result.data.id

    // 3. POST /users - crear otro usuario
    console.log('\n3. POST /users (crear otro usuario)')
    const token2 = generateTestToken({
      sub: 'google_456',
      email: 'jane@example.com',
      name: 'Jane Doe',
      picture: 'https://example.com/jane.jpg'
    })
    result = await makeRequest('POST', `${baseUrl}/users`, { token: token2 })
    console.log('Response:', result)
    const userId2 = result.data.id

    // 4. GET /users - listar todos
    console.log('\n4. GET /users (listar todos)')
    result = await makeRequest('GET', `${baseUrl}/users`)
    console.log('Response:', result)

    // 5. GET /users/:id - obtener un usuario específico
    console.log(`\n5. GET /users/${userId1}`)
    result = await makeRequest('GET', `${baseUrl}/users/${userId1}`)
    console.log('Response:', result)

    // 6. PUT /users/:id - actualizar usuario
    console.log(`\n6. PUT /users/${userId1} (actualizar nombre)`)
    result = await makeRequest('PUT', `${baseUrl}/users/${userId1}`, {
      name: 'John Updated'
    })
    console.log('Response:', result)

    // 7. DELETE /users/:id - eliminar usuario
    console.log(`\n7. DELETE /users/${userId2}`)
    result = await makeRequest('DELETE', `${baseUrl}/users/${userId2}`)
    console.log('Response:', result)

    // 8. POST /users - intentar crear con mismo email (debe retornar el usuario existente)
    console.log('\n8. POST /users (mismo email del usuario 1)')
    const tokenSameEmail = generateTestToken({
      sub: 'google_999',
      email: 'john@example.com',
      name: 'John Different ID',
      picture: 'https://example.com/other.jpg'
    })
    result = await makeRequest('POST', `${baseUrl}/users`, { token: tokenSameEmail })
    console.log('Response (debe ser el usuario existente):', result)

    console.log('\n=== Tests completed ===\n')
  } catch (error) {
    console.error('Error:', error)
  }
}

testCRUD()
