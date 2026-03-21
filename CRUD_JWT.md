# CRUD de Usuarios con JWT Google

## Cambios principales

El CRUD ahora está integrado con JWT de Google. Los usuarios se crean a partir del token JWT que reciben del frontend.

### Endpoints

#### GET /users
Obtiene la lista de todos los usuarios registrados.

```bash
curl http://localhost:5000/users
```

#### GET /users/:id
Obtiene un usuario específico por ID.

```bash
curl http://localhost:5000/users/1
```

#### POST /users
Crea un nuevo usuario decodificando el JWT del frontend. 

**Body (JSON):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

El token debe contener el payload con estructura Google:
```json
{
  "sub": "google_id_123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "provider": "google"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "googleId": "google_id_123",
  "name": "John Doe",
  "email": "user@example.com",
  "picture": "https://...",
  "provider": "google",
  "createdAt": "2025-03-18T...",
  "updatedAt": "2025-03-18T..."
}
```

**Nota:** Si el email ya existe, retorna el usuario existente (permite re-autenticarse).

#### PUT /users/:id
Actualiza un usuario existente (name y/o email).

```bash
curl -X PUT http://localhost:5000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'
```

#### DELETE /users/:id
Elimina un usuario.

```bash
curl -X DELETE http://localhost:5000/users/1
```

## Estructura de capas

- **models/**: Tipos e interfaces (User, CreateUserInput, UpdateUserInput, GoogleJwtPayload, AppError)
- **repositories/**: Acceso a datos (en memoria con Map actualmente)
- **services/**: Lógica de negocio (UserService, JwtService)
- **controllers/**: Manejo HTTP y decodificación de JWT (UserController)
- **routes/**: Rutas y wiring de dependencias (userRoutes)

## Validaciones

- **Token**: Requerido en POST /users
- **Email**: Formato válido y único en el sistema
- **Nombre**: Mínimo 2 caracteres
- **ID**: Entero positivo

## Variables de entorno

```
JWT_SECRET=super_secreto_largo
```

Por defecto usa ese valor si no está en .env, pero respeta la variable de entorno.
