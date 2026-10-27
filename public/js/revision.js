
document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://' + (window.location.hostname || 'localhost') + ':3000';
    const mensaje = document.getElementById('mensaje-revision');
    const lista = document.getElementById('lista-revision');

    function agregarTexto(parent, tag, text, className = '') {
        const node = document.createElement(tag);
        node.textContent = text;

        if (className) {
            node.className = className;
        }

        parent.appendChild(node);
        return node;
    }

    function obtenerEtiquetaEstado(estado) {
        const etiquetas = {
            pendiente: 'Pendiente',
            verificado: 'Aprobado y publicado',
            rechazado: 'Rechazado',
            requiere_correccion: 'Requiere corrección'
        };

        return etiquetas[estado] || estado || 'Sin estado';
    }


    // Ventana para consultar un aporte completo.
    const dialogo = document.createElement('dialog');
    dialogo.className = 'review-dialog';
    dialogo.setAttribute('aria-labelledby', 'review-dialog-title');

    const dialogoContenido = document.createElement('div');
    dialogoContenido.className = 'review-dialog-content';

    const botonCerrar = document.createElement('button');
    botonCerrar.type = 'button';
    botonCerrar.className = 'review-dialog-close';
    botonCerrar.textContent = 'Cerrar';
    botonCerrar.setAttribute('aria-label', 'Cerrar detalle del aporte');
    botonCerrar.addEventListener('click', () => dialogo.close());

    dialogo.appendChild(dialogoContenido);
    dialogo.appendChild(botonCerrar);
    document.body.appendChild(dialogo);

    // Cerrar al pulsar fuera del contenido.
    dialogo.addEventListener('click', event => {
        if (event.target === dialogo) {
            dialogo.close();
        }
    });

    function mostrarDetalle(aporte) {
        dialogoContenido.replaceChildren();

        agregarTexto(
            dialogoContenido,
            'span',
            'Detalle del aporte comunitario',
            'review-eyebrow'
        );

        agregarTexto(
            dialogoContenido,
            'h2',
            aporte.planta || 'Reporte sin identificar',
            'review-dialog-title'
        );

        const estado = document.createElement('span');
        estado.className = 'review-badge';

        const clasesEstado = {
            pendiente: 'review-badge-pending',
            verificado: 'review-badge-approved',
            rechazado: 'review-badge-rejected',
            requiere_correccion: 'review-badge-correction'
        };

        estado.classList.add(
            clasesEstado[aporte.estado] || 'review-badge-neutral'
        );
        estado.textContent = obtenerEtiquetaEstado(aporte.estado);
        dialogoContenido.appendChild(estado);

        agregarTexto(
            dialogoContenido,
            'h3',
            'Información del reporte',
            'review-dialog-subtitle'
        );

        agregarTexto(
            dialogoContenido,
            'p',
            'Enviado por: ' + (aporte.autor || 'Usuario'),
            'review-detail'
        );

        agregarTexto(
            dialogoContenido,
            'p',
            'Correo: ' + (aporte.correo_autor || 'Sin correo'),
            'review-detail'
        );

        const fecha = aporte.fecha_envio
            ? new Date(aporte.fecha_envio).toLocaleString('es-CO')
            : 'Fecha no disponible';

        agregarTexto(
            dialogoContenido,
            'p',
            'Fecha de envío: ' + fecha,
            'review-detail'
        );

        agregarTexto(
            dialogoContenido,
            'h3',
            'Ubicación reportada',
            'review-dialog-subtitle'
        );

        agregarTexto(
            dialogoContenido,
            'p',
            aporte.ubicacion || 'No se indicó ubicación.',
            'review-dialog-text'
        );

        if (aporte.especie_catalogo) {
            agregarTexto(
                dialogoContenido,
                'p',
                'Especie del catálogo: ' + aporte.especie_catalogo,
                'review-detail'
            );
        }

        agregarTexto(
            dialogoContenido,
            'h3',
            'Observaciones del ciudadano',
            'review-dialog-subtitle'
        );

        agregarTexto(
            dialogoContenido,
            'p',
            aporte.notas || 'No se registraron observaciones adicionales.',
            'review-dialog-text'
        );

        if (aporte.tiene_foto) {
            agregarTexto(
                dialogoContenido,
                'h3',
                'Fotografía de evidencia',
                'review-dialog-subtitle'
            );

            const imagen = document.createElement('img');
            imagen.className = 'review-dialog-image';
            imagen.src = API_BASE + '/api/aportes/' + aporte.id_aporte + '/foto';
            imagen.alt = 'Fotografía adjunta al aporte';

            imagen.addEventListener('error', () => {
                imagen.remove();

                agregarTexto(
                    dialogoContenido,
                    'p',
                    'No se pudo cargar la fotografía.',
                    'review-detail'
                );
            }, { once: true });

            dialogoContenido.appendChild(imagen);
        }

        dialogo.showModal();
    }


    async function cambiarEstado(id, estado) {
        try {
            const response = await fetch(
                API_BASE + '/api/admin/aportes/' + encodeURIComponent(id) + '/estado',
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                mensaje.textContent =
                    data.error || 'No se pudo actualizar el reporte.';
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
            const response = await fetch(
                API_BASE + '/api/admin/aportes',
                { credentials: 'include' }
            );

            const data = await response.json();

            if (!response.ok) {
                mensaje.textContent =
                    data.error || 'No tienes permiso para consultar esta sección.';
                return;
            }

            if (!data.length) {
                mensaje.textContent = 'No hay reportes registrados.';
                return;
            }

            mensaje.textContent = 'Reportes encontrados: ' + data.length;

            data.forEach(aporte => {
                const card = document.createElement('article');
                card.className = 'review-card';

                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', 'Ver detalle del aporte');

                card.addEventListener('click', () => {
                    mostrarDetalle(aporte);
                });

                card.addEventListener('keydown', event => {
                    if (event.target !== card) return;

                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        mostrarDetalle(aporte);
                    }
                });

                const header = document.createElement('div');
                header.className = 'review-card-header';

                agregarTexto(
                    header,
                    'h2',
                    aporte.planta || 'Reporte sin identificar',
                    'review-card-title'
                );

                const estado = document.createElement('span');
                estado.className = 'review-badge';

                const clasesEstado = {
                    pendiente: 'review-badge-pending',
                    verificado: 'review-badge-approved',
                    rechazado: 'review-badge-rejected',
                    requiere_correccion: 'review-badge-correction'
                };

                estado.classList.add(
                    clasesEstado[aporte.estado] || 'review-badge-neutral'
                );

                estado.textContent = obtenerEtiquetaEstado(aporte.estado);
                header.appendChild(estado);
                card.appendChild(header);

                const details = document.createElement('div');
                details.className = 'review-card-details';

                agregarTexto(
                    details,
                    'p',
                    'Enviado por: ' + (aporte.autor || 'Usuario'),
                    'review-detail'
                );

                agregarTexto(
                    details,
                    'p',
                    'Correo: ' + (aporte.correo_autor || 'Sin correo'),
                    'review-detail'
                );

                const fecha = aporte.fecha_envio
                    ? new Date(aporte.fecha_envio).toLocaleString('es-CO')
                    : 'Fecha no disponible';

                agregarTexto(
                    details,
                    'p',
                    'Fecha de envío: ' + fecha,
                    'review-detail'
                );

                agregarTexto(
                    details,
                    'p',
                    'Ubicación: ' + (aporte.ubicacion || 'No especificada'),
                    'review-detail'
                );

                agregarTexto(
                    details,
                    'p',
                    'Observaciones: ' + (aporte.notas || 'Sin observaciones'),
                    'review-observations'
                );

                card.appendChild(details);

                const actions = document.createElement('div');
                actions.className = 'review-actions';

                const botones = [
                    {
                        label: 'Aprobar y publicar',
                        estado: 'verificado',
                        clase: 'review-button-approve'
                    },
                    {
                        label: 'Rechazar',
                        estado: 'rechazado',
                        clase: 'review-button-reject'
                    },
                    {
                        label: 'Solicitar corrección',
                        estado: 'requiere_correccion',
                        clase: 'review-button-correction'
                    }
                ];

                botones.forEach(({ label, estado, clase }) => {
                    const button = document.createElement('button');

                    button.type = 'button';
                    button.textContent = label;
                    button.className = 'review-button ' + clase;

                    button.addEventListener('click', event => {
                        event.stopPropagation();
                        cambiarEstado(aporte.id_aporte, estado);
                    });

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
        const response = await fetch(
            API_BASE + '/api/auth/me',
            { credentials: 'include' }
        );

        if (!response.ok) {
            mensaje.textContent =
                'Inicia sesión con una cuenta autorizada para acceder a esta sección.';
            return;
        }

        const data = await response.json();

        if (!['admin', 'investigador'].includes(data.usuario.rol)) {
            mensaje.textContent = 'Tu cuenta no tiene permisos de revisión.';
            return;
        }

        await cargarReportes();

    } catch (error) {
        console.error('Error al comprobar la sesión:', error);
        mensaje.textContent =
            'No se pudo comprobar la sesión. Verifica que el servidor esté iniciado.';
    }
});
