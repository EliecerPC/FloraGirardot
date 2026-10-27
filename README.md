# FloraGirardot

Proyecto de impacto ecológico y social: catálogo digital de la flora de Girardot (Cundinamarca) con fichas técnicas de cada especie, mapa de ubicaciones y un espacio para que la comunidad reporte avistamientos, que son revisados por investigadores antes de publicarse.

## Funcionalidades

- **Catálogo de especies** con búsqueda y filtros por tipo de planta, origen y hábitat.
- **Ficha técnica** de cada especie, con fotografía y mapa (Leaflet / OpenStreetMap).
- **Registro e inicio de sesión** de ciudadanos.
- **Reportes ciudadanos** con fotografía opcional. Quedan en estado *pendiente* hasta que se revisan.
- **Bandeja de revisión** para investigadores y administradores: aprobar, rechazar o pedir corrección.

## Tecnologías

- Node.js y Express 5
- PostgreSQL (`pg`)
- Sesiones con `express-session` y contraseñas con `bcryptjs`
- Subida de imágenes con `multer`
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

2. Crea la base de datos `flora_girardot` (con pgAdmin o con `psql`) y ejecuta el esquema:

   ```bash
   psql -U postgres -c "CREATE DATABASE flora_girardot;"
   psql -U postgres -d flora_girardot -f database/schema.sql
   ```
   Opcional, para cargar 5 especies de ejemplo:

   ```bash
   npm run db:seed
   ```

3. Copia `.env.example` como `.env` y completa los valores (contraseña de la base de datos y `SESSION_SECRET`).

4. Inicia el servidor:

   ```bash
   npm start
   ```

   La API queda en `http://localhost:3000`.

5. Abre `views/index.html` con un servidor estático (por ejemplo la extensión *Live Server*, en el puerto 5500). Si usas otro puerto u origen, agrégalo a `FRONTEND_URL` en el `.env`.

## Roles de usuario

| Rol | Cómo se obtiene | Permisos |
|---|---|---|
| `ciudadano` | Registro público | Enviar reportes y ver los propios |
| `investigador` | Asignado manualmente | Revisar reportes |
| `admin` | Asignado manualmente | Revisar reportes |

El registro público solo crea ciudadanos. Para dar permisos de revisión, primero crea la cuenta desde la web y luego ejecuta en la base de datos:

```sql
UPDATE usuario SET rol = 'admin' WHERE correo = 'correo@ejemplo.com';
```

## Estados de un reporte

`pendiente` → `verificado` (se publica) · `rechazado` · `requiere_correccion`

## Estructura del proyecto

```
database/     Esquema SQL, datos de ejemplo (seed.sql) y migraciones
public/       CSS, JavaScript del frontend e imágenes del sitio
scripts/      Utilidades: seed.js, migrar.js y set-rol.js
server/       API Express (index.js) y conexión a la base (db.js)
uploads/      Fotos de los reportes (privadas, no se versionan)
views/        Páginas HTML
```

Si ya tenías una base creada con una versión anterior del esquema, aplica las migraciones con `npm run db:migrar`.

## Seguridad

- Nunca subas el archivo `.env` al repositorio.
- Las fotos de los reportes no son públicas: solo se muestran si el reporte está aprobado, o a su autor y a los revisores.
- Inicio de sesión, registro y envío de reportes tienen límite de intentos por IP.
- Las sesiones se guardan en PostgreSQL.
- En producción define un `SESSION_SECRET` propio y usa `NODE_ENV=production` (activa cookies seguras). Si el sitio queda detrás de un proxy, agrega `app.set('trust proxy', 1);` en `server/index.js`.

## Licencia

Pendiente de definir.