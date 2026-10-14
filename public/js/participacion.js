document.addEventListener('DOMContentLoaded', async () => {
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
            const response = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
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
            sesionInfo.textContent = 'Sesión iniciada como ' + usuario.nombre + ' (' + usuario.rol + '). ';
            const cerrar = document.createElement('button');
            cerrar.type = 'button';
            cerrar.textContent = 'Cerrar sesión';
            cerrar.addEventListener('click', async () => {
                try {
                    await fetch('http://localhost:3000/api/auth/logout', {
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
                const response = await fetch('http://localhost:3000/api/aportes', {
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

    async function cargarAportes() {
        if (!listaAportes) return;
        listaAportes.replaceChildren();
        try {
            const response = await fetch('http://localhost:3000/api/aportes', { credentials: 'include' });
            if (!response.ok) throw new Error('Respuesta no válida');
            const aportes = await response.json();
            if (!aportes.length) {
                agregarTexto(listaAportes, 'p', 'Todavía no hay reportes aprobados para publicar.');
                return;
            }

            aportes.forEach(aporte => {
                const tarjeta = document.createElement('article');
                tarjeta.className = 'species-card-horizontal';
                tarjeta.style.cssText = 'background:#00b04f;border-radius:15px;padding:.8rem;min-height:90px;display:flex;align-items:center;gap:1rem';

                const imagen = document.createElement('img');
                imagen.src = '../public/assets/img/acacia-card.jpg';
                imagen.alt = 'Ilustración de planta';
                imagen.style.cssText = 'width:70px;height:70px;object-fit:cover;border-radius:10px;flex-shrink:0';
                tarjeta.appendChild(imagen);

                const texto = document.createElement('div');
                texto.style.cssText = 'color:white;flex:1;min-width:0';
                const titulo = (aporte.descripcion || 'Reporte de planta').split('|')[0].trim();
                agregarTexto(texto, 'h3', titulo).style.cssText = 'color:white;font-size:1rem;margin:0';
                agregarTexto(texto, 'p', (aporte.observaciones || 'Sin observaciones').slice(0, 160)).style.cssText = 'color:rgba(255,255,255,.9);font-size:.8rem;margin:.4rem 0';
                agregarTexto(texto, 'small', 'Compartido por ' + (aporte.autor || 'Ciudadano')).style.color = 'white';
                tarjeta.appendChild(texto);
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
            const response = await fetch('http://localhost:3000/api/mis-aportes', { credentials: 'include' });
            if (!response.ok) return;
            const aportes = await response.json();
            if (!aportes.length) {
                agregarTexto(seccion, 'p', 'Aún no has enviado reportes.');
                return;
            }
            aportes.forEach(aporte => {
                const estado = aporte.estado === 'verificado' ? 'Aprobado' :
                    aporte.estado === 'rechazado' ? 'Rechazado' :
                    aporte.estado === 'requiere_correccion' ? 'Requiere corrección' : 'Pendiente de revisión';
                agregarTexto(seccion, 'p', (aporte.descripcion || 'Reporte') + ' — ' + estado);
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