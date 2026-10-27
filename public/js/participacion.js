document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://' + (window.location.hostname || 'localhost') + ':3000';
    const formAporte = document.getElementById('form-aporte');
    const listaAportes = document.getElementById('lista-aportes');
    const mensajeFeedback = document.getElementById('mensaje-feedback');
    const formularioAporte = document.getElementById('formulario-aporte');
    const sesionInfo = document.getElementById('sesion-info');
    const dropArea = document.getElementById('drop-area');
    const inputImagen = document.getElementById('input-imagen');
    const imgPreview = document.getElementById('img-preview');
    const previewContainer = document.getElementById('preview-container');

    if (dropArea && inputImagen) {
        dropArea.addEventListener('click', () => inputImagen.click());
    }

    if (inputImagen) {
        inputImagen.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                inputImagen.value = '';
                if (mensajeFeedback) mensajeFeedback.textContent = 'Usa una imagen JPG, PNG o WEBP.';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                inputImagen.value = '';
                if (mensajeFeedback) mensajeFeedback.textContent = 'La imagen no puede superar los 5 MB.';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                if (mensajeFeedback) mensajeFeedback.textContent = '';
                // Si el archivo no se puede mostrar como imagen, se descarta antes de enviarlo.
                imgPreview.onerror = () => {
                    imgPreview.removeAttribute('src');
                    imgPreview.style.display = 'none';
                    previewContainer.style.display = 'flex';
                    inputImagen.value = '';
                    if (mensajeFeedback) mensajeFeedback.textContent = 'El archivo no parece ser una imagen válida.';
                };
                imgPreview.src = e.target.result;
                imgPreview.style.display = 'block';
                previewContainer.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    function mostrarEnlaceSesion(texto, href, etiqueta) {
        sesionInfo.textContent = texto + ' ';
        const link = document.createElement('a');
        link.href = href;
        link.textContent = etiqueta;
        sesionInfo.appendChild(link);
    }

    async function comprobarSesion() {
        try {
            const response = await fetch(API_BASE + '/api/auth/me', { credentials: 'include' });
            if (!response.ok) {
                formularioAporte.style.display = 'none';
                mostrarEnlaceSesion('Para enviar un reporte comunitario,', 'login.html', 'inicia sesión');
                const registro = document.createElement('a');
                registro.href = 'registro.html';
                registro.textContent = ' o crea una cuenta ciudadana.';
                sesionInfo.appendChild(registro);
                return null;
            }

            const data = await response.json();
            const usuario = data.usuario;
            document.getElementById('nav-login')?.remove();
            document.getElementById('nav-registro')?.remove();
            sesionInfo.textContent = 'Sesión iniciada como ' + usuario.nombre + ' (' + usuario.rol + '). ';
            const cerrar = document.createElement('button');
            cerrar.type = 'button';
            cerrar.textContent = 'Cerrar sesión';
            cerrar.addEventListener('click', async () => {
                try {
                    await fetch(API_BASE + '/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    window.location.reload();
                } catch (error) {
                    sesionInfo.textContent = 'No fue posible cerrar sesión. Inténtalo de nuevo.';
                }
            });
            sesionInfo.appendChild(cerrar);
            if (['admin', 'investigador'].includes(usuario.rol)) {
                const revision = document.createElement('a');
                revision.href = 'revision.html';
                revision.textContent = ' Abrir bandeja de revisión';
                sesionInfo.appendChild(revision);
            }
            formularioAporte.style.display = '';
            return usuario;
        } catch (error) {
            formularioAporte.style.display = 'none';
            sesionInfo.textContent = 'No se pudo comprobar la sesión. Verifica que el servidor esté iniciado.';
            return null;
        }
    }

    if (formAporte) {
        formAporte.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData();
            formData.append('planta', document.getElementById('input-planta').value.trim());
            formData.append('ubicacion', document.getElementById('input-ubicacion').value.trim());
            formData.append('notas', document.getElementById('input-notas').value.trim());
            if (inputImagen.files[0]) formData.append('imagen', inputImagen.files[0]);

            const boton = formAporte.querySelector('button[type="submit"]');
            boton.disabled = true;
            try {
                const response = await fetch(API_BASE + '/api/aportes', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    mensajeFeedback.style.color = '#00883d';
                    mensajeFeedback.textContent = data.mensaje || 'Reporte enviado para revisión.';
                    formAporte.reset();
                    imgPreview.style.display = 'none';
                    imgPreview.removeAttribute('src');
                    previewContainer.style.display = 'flex';
                    await cargarMisAportes();
                } else {
                    mensajeFeedback.style.color = 'red';
                    mensajeFeedback.textContent = data.error || 'Ocurrió un error al guardar el reporte.';
                }
            } catch (error) {
                console.error('Error al enviar aporte:', error);
                mensajeFeedback.textContent = 'No se pudo conectar con el servidor.';
            } finally {
                boton.disabled = false;
            }
        });
    }

    function agregarTexto(contenedor, etiqueta, texto) {
        const elemento = document.createElement(etiqueta);
        elemento.textContent = texto;
        contenedor.appendChild(elemento);
        return elemento;
    }


    function mostrarDetalleAporte(aporte, esPropio = false) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            z-index: 9999;
            overflow-y: auto;
        `;

        const contenido = document.createElement('section');
        contenido.setAttribute('role', 'dialog');
        contenido.setAttribute('aria-modal', 'true');
        contenido.setAttribute('aria-labelledby', 'titulo-detalle-aporte');
        contenido.style.cssText = `
            background: #F0F0ED;
            color: #1E3A2B;
            width: 100%;
            max-width: 650px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 25px;
            border-radius: 20px;
            position: relative;
        `;

        const cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.textContent = 'Cerrar ✕';
        cerrar.style.cssText = `
            display: block;
            margin-left: auto;
            padding: 8px 14px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
        `;
        cerrar.addEventListener('click', () => modal.remove());

        contenido.appendChild(cerrar);


        const nombrePlanta = aporte.planta || 'Planta sin identificar';
        const ubicacion = aporte.ubicacion || 'No especificado';
        const notas = aporte.notas || '';

        const titulo = agregarTexto(contenido, 'h2', nombrePlanta);
        titulo.id = 'titulo-detalle-aporte';
        titulo.style.margin = '15px 0';

        agregarTexto(contenido, 'p', 'Nombre de la planta: ' + nombrePlanta);
        agregarTexto(contenido, 'p', 'Sector o ubicación: ' + ubicacion);
        agregarTexto(contenido, 'p', 'Observaciones: ' + (notas || 'Sin observaciones'));


        if (aporte.autor) {
            agregarTexto(contenido, 'p', 'Compartido por: ' + aporte.autor);
        }

        if (aporte.fecha_envio) {
            const fecha = new Date(aporte.fecha_envio);
            agregarTexto(
                contenido,
                'p',
                'Fecha: ' + (
                    Number.isNaN(fecha.getTime())
                        ? aporte.fecha_envio
                        : fecha.toLocaleString('es-CO')
                )
            );
        }

        if (esPropio && aporte.estado) {
            const estados = {
                pendiente: 'Pendiente de revisión',
                verificado: 'Aprobado',
                rechazado: 'Rechazado',
                requiere_correccion: 'Requiere corrección'
            };

            agregarTexto(
                contenido,
                'p',
                'Estado: ' + (estados[aporte.estado] || aporte.estado)
            );
        }

        if (aporte.tiene_foto) {
            const imagen = document.createElement('img');
            imagen.src = API_BASE + '/api/aportes/' + aporte.id_aporte + '/foto';
            imagen.alt = 'Fotografía del aporte';
            imagen.style.cssText = `
                display: block;
                width: 100%;
                max-height: 400px;
                object-fit: contain;
                margin-top: 20px;
                border-radius: 12px;
                background: white;
            `;

            imagen.addEventListener('error', () => {
                imagen.alt = 'No se pudo cargar la fotografía.';
            });

            contenido.appendChild(imagen);
        }

        modal.appendChild(contenido);

        modal.addEventListener('click', event => {
            if (event.target === modal) modal.remove();
        });

        const cerrarConEscape = event => {
            if (event.key === 'Escape' && modal.isConnected) {
                modal.remove();
                document.removeEventListener('keydown', cerrarConEscape);
            }
        };

        document.addEventListener('keydown', cerrarConEscape);
        modal.addEventListener('remove', () => {
            document.removeEventListener('keydown', cerrarConEscape);
        });

        document.body.appendChild(modal);
        cerrar.focus();
    }


    async function cargarAportes() {
        if (!listaAportes) return;
        listaAportes.replaceChildren();
        try {
            const response = await fetch(API_BASE + '/api/aportes', { credentials: 'include' });
            if (!response.ok) throw new Error('Respuesta no válida');
            const aportes = await response.json();
            if (!aportes.length) {
                agregarTexto(listaAportes, 'p', 'Todavía no hay reportes aprobados para publicar.');
                return;
            }


            aportes.forEach(aporte => {
                const tarjeta = document.createElement('button');
                tarjeta.type = 'button';

                tarjeta.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 0;
                    overflow: hidden;
                    text-align: left;
                    cursor: pointer;
                    border: 1px solid #d1e7d5;
                    border-radius: 12px;
                    background: white;
                    color: #244b35;
                `;

                const nombrePlanta = aporte.planta || 'Planta sin identificar';

                const imagen = document.createElement('img');
                if (aporte.tiene_foto) {
                    imagen.src = `${API_BASE}/api/aportes/${aporte.id_aporte}/foto`;
                }

                imagen.alt = `Fotografía de ${nombrePlanta}`;

                imagen.style.cssText = `
                    display: block;
                    width: 100%;
                    height: 180px;
                    object-fit: cover;
                `;

                // Nombre de la planta
                const titulo = document.createElement('h3');
                titulo.textContent = nombrePlanta;

                titulo.style.cssText = `
                    margin: 12px 14px 5px;
                    font-size: 1.1rem;
                `;

                // Nombre del usuario
                const autor = document.createElement('p');
                autor.textContent = aporte.autor || 'Usuario';

                autor.style.cssText = `
                    margin: 0 14px 14px;
                    font-size: 0.9rem;
                    color: #587261;
                `;

                if (aporte.tiene_foto) tarjeta.appendChild(imagen);
                tarjeta.appendChild(titulo);
                tarjeta.appendChild(autor);

                // Al pulsar, se abre el detalle completo
                tarjeta.addEventListener('click', () => {
                    mostrarDetalleAporte(aporte);
                });

                listaAportes.appendChild(tarjeta);
            });


        } catch (error) {
            console.error('Error al cargar lista de aportes:', error);
            agregarTexto(listaAportes, 'p', 'No se pudieron cargar los reportes. Verifica que el servidor esté iniciado.');
        }
    }

    async function cargarMisAportes() {
        if (!formularioAporte) return;
        let seccion = document.getElementById('mis-aportes');
        if (!seccion) {
            seccion = document.createElement('section');
            seccion.id = 'mis-aportes';
            seccion.style.marginTop = '1.5rem';
            formularioAporte.appendChild(seccion);
        }
        seccion.replaceChildren();
        agregarTexto(seccion, 'h3', 'Estado de mis reportes');
        try {
            const response = await fetch(API_BASE + '/api/mis-aportes', { credentials: 'include' });
            if (!response.ok) return;
            const aportes = await response.json();
            if (!aportes.length) {
                agregarTexto(seccion, 'p', 'Aún no has enviado reportes.');
                return;
            }

            aportes.forEach(aporte => {
                const estados = {
                    verificado: 'Aprobado',
                    rechazado: 'Rechazado',
                    requiere_correccion: 'Requiere corrección',
                    pendiente: 'Pendiente de revisión'
                };

                const boton = document.createElement('button');
                boton.type = 'button';
                boton.textContent =
                    (aporte.planta || 'Reporte') + (aporte.ubicacion ? ' (' + aporte.ubicacion + ')' : '') + ' — ' +
                    (estados[aporte.estado] || aporte.estado) +
                    ' · Ver detalle';

                boton.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 12px;
                    margin: 8px 0;
                    text-align: left;
                    background: white;
                    color: #1E3A2B;
                    border: 1px solid #c5c5c5;
                    border-radius: 10px;
                    cursor: pointer;
                `;

                boton.addEventListener('click', () => {
                    mostrarDetalleAporte(aporte, true);
                });

                seccion.appendChild(boton);
            });

        } catch (error) {
            console.error('Error al consultar mis reportes:', error);
        }
    }

    await comprobarSesion();
    await cargarAportes();
    if (formularioAporte && formularioAporte.style.display !== 'none') {
        await cargarMisAportes();
    }
});