# FloraGirardot

Proyecto de impacto ecológico y social: catálogo digital de la flora de Girardot (Cundinamarca) con fichas técnicas de cada especie, mapa de ubicaciones y un espacio para que la comunidad reporte avistamientos, que son revisados por investigadores antes de publicarse.

## Funcionalidades

- **Catálogo de especies** con búsqueda y filtros por tipo de planta, origen y hábitat.
- **Ficha técnica** de cada especie, con fotografía y mapa (Leaflet / OpenStreetMap).
- **Cuentas de usuario:** registro, inicio de sesión y menú de usuario en el encabezado con un resumen de la cuenta y de los reportes.
- **Perfil editable:** foto de perfil, cambio de nombre y de contraseña.
- **Reportes ciudadanos:** se elige la especie del catálogo (o "otra planta"), se indica la ubicación y se adjunta una foto opcional. Quedan *pendientes* hasta que se revisan.
- **Bandeja de revisión** para investigadores y administradores: aprobar, rechazar o pedir corrección.
- **Diseño adaptable** a computador, tableta y celular.

## Tecnologías

- Node.js y Express 5
- PostgreSQL (`pg`) y sesiones guardadas en la base (`express-session` + `connect-pg-simple`)
- Contraseñas con `bcryptjs`, subida de imágenes con `multer`
- Seguridad: `helmet` y `express-rate-limit`
- Frontend en HTML, CSS y JavaScript sin frameworks

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- [PostgreSQL](https://www.postgresql.org/) 14 o superior

## Instalación

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone https://github.com/EliecerPC/FloraGirardot.git
   cd FloraGirardot
   npm install
   ```

2. Crea el archivo de configuración: copia `.env.example` como `.env` y completa los valores (contraseña de la base de datos y `SESSION_SECRET`). Para generar una clave de sesión:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Crea la base de datos `flora_girardot` y ejecuta el esquema:

   ```bash
   psql -U postgres -c "CREATE DATABASE flora_girardot;"
   psql -U postgres -d flora_girardot -f database/schema.sql
   ```

   Si no tienes `psql` en el PATH (por ejemplo en Windows), crea la base desde pgAdmin y ejecuta el contenido de `database/schema.sql` en su editor de consultas (*Query Tool*).

4. Opcional, para cargar 5 especies de ejemplo:

   ```bash
   npm run db:seed
   ```

   Los textos y las coordenadas de `database/seed.sql` son de prueba: reemplázalos por información verificada antes de publicar.

5. Inicia la API:

   ```bash
   npm start
   ```

   Queda en `http://localhost:3000`. Para desarrollo, `npm run dev` la reinicia sola al guardar cambios.

6. En otra terminal, abre el sitio:

   ```bash
   npm run web
   ```

   Se abre en `http://127.0.0.1:5500/views/index.html`. Si usas otro servidor estático u otro puerto, sirve la carpeta raíz del proyecto y agrega ese origen a `FRONTEND_URL` en el `.env`.

### Bases de datos existentes

El archivo `database/schema.sql` crea todo desde cero. Si ya tenías una base creada con una versión anterior, aplica los cambios pendientes con:

```bash
npm run db:migrar
```

Las migraciones están en `database/migrations/` y se pueden ejecutar varias veces sin problema.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT` | Conexión a PostgreSQL |
| `PORT` | Puerto de la API (por defecto `3000`) |
| `NODE_ENV` | `development` o `production` (activa cookies seguras) |
| `SESSION_SECRET` | Clave para firmar las sesiones. En producción es obligatoria |
| `FRONTEND_URL` | Orígenes del frontend permitidos por CORS, separados por coma |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Inicia la API |
| `npm run dev` | Inicia la API y la reinicia al guardar cambios |
| `npm run web` | Sirve las páginas en el puerto 5500 |
| `npm run db:seed` | Carga las especies de ejemplo |
| `npm run db:migrar` | Aplica las migraciones y muestra las restricciones e índices |
| `node scripts/set-rol.js correo rol` | Cambia el rol de un usuario (ver más abajo) |

## Roles de usuario

| Rol | Cómo se obtiene | Permisos |
|---|---|---|
| `ciudadano` | Registro público | Enviar reportes, ver el estado de los propios y editar su perfil |
| `investigador` | Asignado manualmente | Lo anterior, y revisar reportes |
| `admin` | Asignado manualmente | Lo mismo que un investigador |

El registro público solo crea ciudadanos. Para dar permisos de revisión, crea primero la cuenta desde la web y luego ejecuta:

```bash
node scripts/set-rol.js correo@ejemplo.com admin
```

Los roles válidos son `admin`, `investigador` y `ciudadano`.

## Estados de un reporte

`pendiente` → `verificado` (se publica) · `rechazado` · `requiere_correccion`

Las fotos de un reporte solo son públicas cuando el reporte está `verificado`; antes, solo las ven su autor y los revisores.

## API

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /api/especies` | Público | Catálogo de especies activas |
| `GET /api/especies/:id` | Público | Ficha técnica y ubicaciones |
| `GET /api/aportes` | Público | Reportes aprobados |
| `GET /api/aportes/:id/foto` | Público si está aprobado; si no, autor o revisor | Foto de un reporte |
| `POST /api/auth/registro` | Público | Crea una cuenta de ciudadano |
| `POST /api/auth/login` | Público | Inicia sesión |
| `GET /api/auth/me` | Sesión | Datos de la cuenta actual |
| `POST /api/auth/logout` | Sesión | Cierra la sesión |
| `PATCH /api/cuenta/nombre` | Sesión | Cambia el nombre |
| `POST /api/cuenta/contrasena` | Sesión | Cambia la contraseña (exige la actual) |
| `GET`, `POST`, `DELETE /api/cuenta/foto` | Sesión | Foto de perfil (solo visible para su dueño) |
| `GET /api/mis-aportes` | Sesión | Reportes del usuario |
| `POST /api/aportes` | Sesión | Envía un reporte, con foto opcional |
| `GET /api/admin/aportes` | Revisor | Bandeja de revisión |
| `PATCH /api/admin/aportes/:id/estado` | Revisor | Aprueba, rechaza o pide corrección |

## Estructura del proyecto

```
database/     Esquema (schema.sql), datos de ejemplo (seed.sql) y migraciones
public/       CSS, JavaScript del frontend e imágenes del sitio
scripts/      Utilidades: seed.js, migrar.js y set-rol.js
server/       API Express (index.js) y conexión a la base (db.js)
uploads/      Fotos de reportes y de perfil (privadas, no se versionan)
views/        Páginas HTML
```

## Seguridad

- Nunca subas el archivo `.env` al repositorio.
- Las fotos de reportes y de perfil no son públicas: se entregan por la API, que comprueba quién las pide.
- Se valida el contenido real de cada imagen subida, no solo su extensión.
- Inicio de sesión, registro, envío de reportes y cambio de contraseña tienen límite de intentos por IP.
- Al cambiar la contraseña se cierran las demás sesiones del usuario.
- Las sesiones se guardan en PostgreSQL y las cabeceras de seguridad las aplica `helmet`.
- En producción define un `SESSION_SECRET` propio y usa `NODE_ENV=production`. Si el sitio queda detrás de un proxy, agrega `app.set('trust proxy', 1);` en `server/index.js`.

## Limitaciones conocidas

- El correo de una cuenta no se puede cambiar, y no hay recuperación de contraseña ni verificación de correo, porque todavía no se envían correos.
- Las páginas y la API se sirven por separado (puertos 5500 y 3000). Para publicar el sitio conviene que un único servidor entregue ambas.
- No hay pruebas automáticas.

## Licencia

Pendiente de definir.