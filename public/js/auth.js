document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-auth');
    const mensaje = document.getElementById('auth-mensaje');
    if (!form || !mensaje) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const mode = form.dataset.mode;
        const datos = {
            correo: document.getElementById('correo').value.trim(),
            contrasena: document.getElementById('contrasena').value
        };
        if (mode === 'registro') datos.nombre = document.getElementById('nombre').value.trim();

        const boton = form.querySelector('button[type="submit"]');
        boton.disabled = true;
        mensaje.textContent = 'Procesando…';

        try {
            const response = await fetch('http://localhost:3000/api/auth/' + (mode === 'registro' ? 'registro' : 'login'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const data = await response.json();
            if (!response.ok) {
                mensaje.textContent = data.error || 'No fue posible completar la solicitud.';
                return;
            }
            mensaje.textContent = data.mensaje || 'Acceso correcto.';
            window.location.href = 'participacion.html';
        } catch (error) {
            console.error('Error de autenticación:', error);
            mensaje.textContent = 'No se pudo conectar con el servidor. Verifica que esté iniciado.';
        } finally {
            boton.disabled = false;
        }
    });
});