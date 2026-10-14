# Autenticación y roles de FloraGirardot

## Preparación local

1. Instala las dependencias desde la carpeta raíz con `npm install`.
2. Copia `.env.example` a un archivo llamado `.env`.
3. Completa `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME` y `DB_PORT` con los datos de tu PostgreSQL.
4. Cambia `SESSION_SECRET` por una cadena aleatoria y privada. No compartas el archivo `.env` ni lo subas a GitHub.
5. Inicia el backend con `npm start`.
6. Abre el frontend con una extensión de servidor local, por ejemplo Live Server. Configura `FRONTEND_URL` para que coincida con el origen y puerto utilizados.

## Roles

- **Visitante:** consulta especies, fichas y reportes verificados sin iniciar sesión.
- **ciudadano:** se registra públicamente e inicia sesión para enviar reportes y consultar el estado de sus propios aportes.
- **investigador:** cuenta autorizada para revisar reportes científicos y comunitarios.
- **admin:** cuenta autorizada para revisar reportes y representa el rol administrativo.

El formulario público de registro siempre asigna el rol `ciudadano`; no acepta roles enviados por el navegador. Los endpoints de revisión verifican el rol en el servidor.

## Crear la primera cuenta administrativa

1. Registra una cuenta desde `views/registro.html`.
2. En PostgreSQL, ejecuta una actualización para el correo de esa cuenta. Reemplaza el correo de ejemplo por el correo real que acabas de registrar:

```sql
UPDATE usuario
SET rol = 'admin'
WHERE correo = 'admin@ejemplo.com';
```

Solo una persona con acceso directo y autorizado a la base de datos debe realizar esta operación. No agregues un formulario público para cambiar roles.

Para crear una cuenta de revisor científico, utiliza `rol = 'investigador'` en lugar de `admin`.

## Estados de reportes

- `pendiente`: enviado y en espera de revisión.
- `verificado`: aprobado; aparece en la consulta pública.
- `rechazado`: no se aprueba para publicación.
- `requiere_correccion`: necesita información adicional.

La bandeja de revisión está en `views/revision.html`. La API también comprueba los permisos, por lo que ocultar la página o sus botones no es la medida de seguridad principal.

## Notas de seguridad y despliegue

- Las contraseñas nuevas se almacenan como hash con bcrypt, nunca como texto legible.
- Las credenciales de PostgreSQL deben estar en `.env`, excluido de Git.
- Las sesiones actuales utilizan el almacenamiento predeterminado en memoria de Express. Es suficiente para desarrollo local, pero antes de desplegar el sistema en producción debe configurarse un almacén de sesiones persistente y compartido.
- En producción, usa HTTPS, establece `NODE_ENV=production`, configura un secreto robusto y ajusta `FRONTEND_URL` al dominio real.
- Si ya existían cuentas con contraseñas guardadas en texto plano, no podrán iniciar sesión con la nueva comprobación bcrypt hasta que se establezca un proceso seguro de restablecimiento de contraseña.
- La validación del tipo MIME ayuda a limitar las imágenes, pero un despliegue público debería validar también el contenido real del archivo y aplicar límites de frecuencia a los endpoints de registro e inicio de sesión.
