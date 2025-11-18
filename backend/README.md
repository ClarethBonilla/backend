# Backend MiSonrisa - API REST

Backend completo para la aplicación de gestión de pacientes dentales **MiSonrisa**.

## Características

- ✓ Autenticación con JWT
- ✓ CRUD de pacientes y actividades clínicas
- ✓ Validación de datos con Mongoose
- ✓ Manejo robusto de errores
- ✓ Base de datos MongoDB
- ✓ CORS habilitado para frontend

## Requisitos

- Node.js v16+
- MongoDB instalado localmente o URL de conexión
- npm o yarn

## Instalación

1. Clonar o descargar el proyecto:
```bash
cd d:\Proyecto\ de\ grado\backend
npm install
```

2. Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

3. Configurar variables en `.env`:
```env
MONGO_URI=mongodb://localhost:27017/misonrisa
JWT_SECRET=tu_clave_super_segura_aqui
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## Ejecutar el servidor

**Desarrollo (con nodemon):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:5000`

## Endpoints API

### Autenticación (`/api/auth`)
- `POST /registro` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión
- `GET /perfil` - Obtener perfil (requiere token)

### Pacientes (`/api/pacientes`)
- `GET /` - Listar todos los pacientes
- `GET /:id` - Obtener un paciente
- `POST /` - Crear nuevo paciente
- `PUT /:id` - Actualizar paciente
- `DELETE /:id` - Eliminar paciente
- `POST /:id/actividades` - Agregar actividad al paciente
- `PUT /:id/actividades/:actId` - Actualizar actividad
- `DELETE /:id/actividades/:actId` - Eliminar actividad

**Todos los endpoints de pacientes requieren token JWT en header:**
```
Authorization: Bearer <token>
```

## Estructura del Proyecto

```
backend/
├── config/
│   └── db.js              # Configuración MongoDB
├── middleware/
│   ├── auth.js            # Autenticación y autorización
│   └── errores.js         # Manejo de errores
├── models/
│   ├── Usuario.js         # Schema Usuario
│   └── Paciente.js        # Schema Paciente
├── routes/
│   ├── auth.js            # Rutas de autenticación
│   └── pacientes.js       # Rutas de pacientes
├── .env.example           # Variables de ejemplo
├── .gitignore             # Archivos a ignorar
├── package.json           # Dependencias
└── server.js              # Servidor principal
```

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `MONGO_URI` | URL de conexión MongoDB | `mongodb://localhost:27017/misonrisa` |
| `JWT_SECRET` | Clave para firmar tokens | Requerida |
| `JWT_EXPIRE` | Expiración del token | `7d` |
| `PORT` | Puerto del servidor | `5000` |
| `NODE_ENV` | Entorno (development/production) | `development` |
| `CLIENT_URL` | URL del cliente frontend | `http://localhost:5173` |

## Ejemplos de Uso

### Registro
```bash
curl -X POST http://localhost:5000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Dr. Juan",
    "email": "juan@misonrisa.com",
    "contraseña": "segura123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@misonrisa.com",
    "contraseña": "segura123"
  }'
```

### Crear Paciente
```bash
curl -X POST http://localhost:5000/api/pacientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nombre": "Carlos Pérez",
    "historia": "Antecedentes: Alergia a la penicilina"
  }'
```

## Errores Comunes

### "Connect ECONNREFUSED 127.0.0.1:27017"
- MongoDB no está corriendo. Inicia el servicio:
  ```bash
  mongod  # En Windows, ejecutar desde Command Prompt o PowerShell con admin
  ```

### "Token inválido o expirado"
- Verifica que el token se envía correctamente en el header `Authorization`.
- Genera un nuevo token con login.

### "Email ya existe"
- El email ya está registrado. Usa otro o haz login.

## Notas de Desarrollo

- Los tokens JWT expiran después de 7 días.
- Las contraseñas se encriptan con bcrypt (salt: 10).
- MongoDB valida automáticamente los esquemas.
- CORS está habilitado para `http://localhost:5173` (frontend local).

## Próximos Pasos

1. Conectar frontend a los endpoints del backend.
2. Agregar autenticación en el frontend (guardar token en localStorage/cookie).
3. Tests unitarios e integración.
4. Deployar en plataforma (Heroku, Railway, Vercel, AWS, etc.).

---

**Versión:** 1.0.0  
**Licencia:** ISC
