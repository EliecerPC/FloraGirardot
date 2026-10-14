document.addEventListener('DOMContentLoaded', async () => {
    const mensaje = document.getElementById('mensaje-revision');
    const lista = document.getElementById('lista-revision');

    function agregarTexto(parent, tag, text) {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.appendChild(node);
        return node;
    }

    async function cambiarEstado(id, estado) {
        try {
            const response = await fetch('http://localhost:3000/api/admin/aportes/' + encodeURIComponent(id) + '/estado', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado })
            });
            const data = await response.json();
            if (!response.ok) {
                mensaje.textContent = data.error || 'No se pudo actualizar el reporte.';
                return;
            }
            mensaje.textContent = 'Estado actualizado correctamente.';
            await cargarReportes();
        } catch (error) {
            console.error('Error al actualizar el reporte:', error);
            mensaje.textContent = 'No se pudo conectar con el servidor.';
        }
    }

    async function cargarReportes() {
        lista.replaceChildren();
        try {
            const response = await fetch('http://localhost:3000/api/admin/aportes', { credentials: 'include' });
            const data = await response.json();
            if (!response.ok) {
                mensaje.textContent = data.error || 'No tienes permiso para consultar esta sección.';
                return;
            }
            if (!data.length) {
                mensaje.textContent = 'No hay reportes registrados.';
                return;
            }
            mensaje.textContent = 'Reportes encontrados: ' + data.length;
            data.forEach(aporte => {
                const card = document.createElement('article');
                card.className = 'filters-sidebar';
                card.style.cssText = 'padding:1.25rem;border-radius:16px';
                agregarTexto(card, 'h2', (aporte.descripcion || 'Reporte sin descripción') + ' — ' + aporte.estado);
                agregarTexto(card, 'p', 'Enviado por: ' + (aporte.autor || 'Usuario') + ' (' + (aporte.correo_autor || 'sin correo') + ')');
                agregarTexto(card, 'p', 'Fecha: ' + new Date(aporte.fecha_envio).toLocaleString('es-CO'));
                agregarTexto(card, 'p', 'Observaciones: ' + (aporte.observaciones || 'Sin observaciones'));

                const actions = document.createElement('div');
                actions.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem';
                [
                    ['Aprobar y publicar', 'verificado'],
                    ['Rechazar', 'rechazado'],
                    ['Solicitar corrección', 'requiere_correccion']
                ].forEach(([label, estado]) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.textContent = label;
                    button.addEventListener('click', () => cambiarEstado(aporte.id_aporte, estado));
                    actions.appendChild(button);
                });
                card.appendChild(actions);
                lista.appendChild(card);
            });
        } catch (error) {
            console.error('Error al cargar reportes para revisión:', error);
            mensaje.textContent = 'No se pudo conectar con el servidor.';
        }
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
        if (!response.ok) {
            mensaje.textContent = 'Inicia sesión con una cuenta autorizada para acceder a esta sección.';
            return;
        }
        const data = await response.json();
        if (!['admin', 'investigador'].includes(data.usuario.rol)) {
            mensaje.textContent = 'Tu cuenta no tiene permisos de revisión.';
            return;
        }
        await cargarReportes();
    } catch (error) {
        mensaje.textContent = 'No se pudo comprobar la sesión. Verifica que el servidor esté iniciado.';
    }
});