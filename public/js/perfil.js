(function () {
    const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FOTO = 2 * 1024 * 1024;

    function nodo(etiqueta, clase, texto) {
        const elemento = document.createElement(etiqueta);
        if (clase) elemento.className = clase;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    }

    function mostrar(elemento, texto, esError) {
        elemento.textContent = texto;
        elemento.classList.toggle('is-error', Boolean(esError));
    }

    async function enviar(apiBase, ruta, opciones) {
        const respuesta = await fetch(apiBase + ruta, { credentials: 'include', ...opciones });
        let datos = {};
        try {
            datos = await respuesta.json();
        } catch (error) {
            // La respuesta no traía JSON; se usan los mensajes por defecto.
        }
        return { ok: respuesta.ok, datos };
    }

    function campo(id, etiqueta, tipo, autocompletar) {
        const envoltorio = nodo('div', 'profile-field');
        const rotulo = nodo('label', '', etiqueta);
        rotulo.htmlFor = id;

        const entrada = document.createElement('input');
        entrada.id = id;
        entrada.type = tipo;
        entrada.required = true;
        if (autocompletar) entrada.autocomplete = autocompletar;

        envoltorio.append(rotulo, entrada);
        return { envoltorio, entrada };
    }

    function abrir(opciones) {
        const { apiBase, usuario } = opciones;
        const inicial = () => (usuario.nombre || '?').trim().charAt(0).toUpperCase();

        const anterior = document.getElementById('dialogo-perfil');
        if (anterior) anterior.remove();

        const dialogo = nodo('dialog', 'profile-dialog');
        dialogo.id = 'dialogo-perfil';
        dialogo.setAttribute('aria-labelledby', 'perfil-titulo');

        // ---------- Encabezado ----------
        const cabecera = nodo('div', 'profile-dialog-header');
        const titulo = nodo('h2', '', 'Mi perfil');
        titulo.id = 'perfil-titulo';
        const cerrar = nodo('button', 'profile-close', '×');
        cerrar.type = 'button';
        cerrar.setAttribute('aria-label', 'Cerrar');
        cerrar.addEventListener('click', () => dialogo.close());
        cabecera.append(titulo, cerrar);

        const cuerpo = nodo('div', 'profile-dialog-body');

        // ---------- Foto de perfil ----------
        const seccionFoto = nodo('section', 'profile-section');
        seccionFoto.appendChild(nodo('h3', '', 'Foto de perfil'));

        const filaFoto = nodo('div', 'profile-photo-row');
        const vista = nodo('div', 'user-avatar profile-avatar');
        const acciones = nodo('div', 'profile-photo-actions');

        const entradaFoto = document.createElement('input');
        entradaFoto.type = 'file';
        entradaFoto.accept = TIPOS_IMAGEN.join(',');
        entradaFoto.hidden = true;

        const cambiar = nodo('button', 'btn-panel btn-panel-secondary btn-compact', 'Cambiar foto');
        cambiar.type = 'button';
        const quitar = nodo('button', 'btn-panel btn-panel-danger btn-compact', 'Quitar foto');
        quitar.type = 'button';

        acciones.append(cambiar, quitar, entradaFoto);
        filaFoto.append(vista, acciones);

        const ayudaFoto = nodo('p', 'profile-hint', 'JPG, PNG o WebP, de hasta 2 MB.');
        const mensajeFoto = nodo('p', 'profile-message');
        mensajeFoto.setAttribute('role', 'status');
        seccionFoto.append(filaFoto, ayudaFoto, mensajeFoto);

        function dibujarAvatar() {
            vista.replaceChildren();
            if (usuario.tiene_foto) {
                const imagen = nodo('img', 'user-avatar-img');
                imagen.alt = 'Tu foto de perfil';
                imagen.src = opciones.urlFoto();
                imagen.addEventListener('error', () => {
                    imagen.remove();
                    vista.textContent = inicial();
                });
                vista.appendChild(imagen);
            } else {
                vista.textContent = inicial();
            }
            quitar.hidden = !usuario.tiene_foto;
        }

        cambiar.addEventListener('click', () => entradaFoto.click());

        entradaFoto.addEventListener('change', async () => {
            const archivo = entradaFoto.files[0];
            entradaFoto.value = '';
            if (!archivo) return;

            if (!TIPOS_IMAGEN.includes(archivo.type)) {
                return mostrar(mensajeFoto, 'La imagen debe ser JPG, PNG o WebP.', true);
            }
            if (archivo.size > MAX_FOTO) {
                return mostrar(mensajeFoto, 'La imagen supera los 2 MB.', true);
            }

            const datosFormulario = new FormData();
            datosFormulario.append('foto', archivo);

            cambiar.disabled = true;
            mostrar(mensajeFoto, 'Subiendo…');
            try {
                const { ok, datos } = await enviar(apiBase, '/api/cuenta/foto', { method: 'POST', body: datosFormulario });
                if (!ok) return mostrar(mensajeFoto, datos.error || 'No se pudo subir la foto.', true);
                opciones.alCambiar({ tiene_foto: true });
                dibujarAvatar();
                mostrar(mensajeFoto, datos.mensaje || 'Foto de perfil actualizada.');
            } catch (error) {
                mostrar(mensajeFoto, 'No se pudo conectar con el servidor.', true);
            } finally {
                cambiar.disabled = false;
            }
        });

        quitar.addEventListener('click', async () => {
            quitar.disabled = true;
            mostrar(mensajeFoto, 'Quitando…');
            try {
                const { ok, datos } = await enviar(apiBase, '/api/cuenta/foto', { method: 'DELETE' });
                if (!ok) return mostrar(mensajeFoto, datos.error || 'No se pudo quitar la foto.', true);
                opciones.alCambiar({ tiene_foto: false });
                dibujarAvatar();
                mostrar(mensajeFoto, datos.mensaje || 'Foto de perfil eliminada.');
            } catch (error) {
                mostrar(mensajeFoto, 'No se pudo conectar con el servidor.', true);
            } finally {
                quitar.disabled = false;
            }
        });

        // ---------- Nombre ----------
        const seccionNombre = nodo('section', 'profile-section');
        seccionNombre.appendChild(nodo('h3', '', 'Nombre'));

        const formNombre = document.createElement('form');
        const campoNombre = campo('perfil-nombre', 'Nombre completo', 'text', 'name');
        campoNombre.entrada.value = usuario.nombre || '';
        campoNombre.entrada.minLength = 2;
        campoNombre.entrada.maxLength = 100;
        const botonNombre = nodo('button', 'btn-panel btn-panel-primary btn-compact', 'Guardar nombre');
        botonNombre.type = 'submit';
        const mensajeNombre = nodo('p', 'profile-message');
        mensajeNombre.setAttribute('role', 'status');
        formNombre.append(campoNombre.envoltorio, botonNombre, mensajeNombre);
        seccionNombre.appendChild(formNombre);

        formNombre.addEventListener('submit', async event => {
            event.preventDefault();
            const nombre = campoNombre.entrada.value.trim();
            if (nombre.length < 2 || nombre.length > 100) {
                return mostrar(mensajeNombre, 'El nombre debe tener entre 2 y 100 caracteres.', true);
            }
            if (nombre === usuario.nombre) {
                return mostrar(mensajeNombre, 'Ese ya es tu nombre actual.');
            }

            botonNombre.disabled = true;
            mostrar(mensajeNombre, 'Guardando…');
            try {
                const { ok, datos } = await enviar(apiBase, '/api/cuenta/nombre', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre })
                });
                if (!ok) return mostrar(mensajeNombre, datos.error || 'No se pudo cambiar el nombre.', true);
                opciones.alCambiar({ nombre: datos.usuario.nombre });
                campoNombre.entrada.value = datos.usuario.nombre;
                if (!usuario.tiene_foto) dibujarAvatar();
                mostrar(mensajeNombre, datos.mensaje || 'Nombre actualizado.');
            } catch (error) {
                mostrar(mensajeNombre, 'No se pudo conectar con el servidor.', true);
            } finally {
                botonNombre.disabled = false;
            }
        });

        // ---------- Contraseña ----------
        const seccionClave = nodo('section', 'profile-section');
        seccionClave.appendChild(nodo('h3', '', 'Contraseña'));

        const formClave = document.createElement('form');
        const campoActual = campo('perfil-actual', 'Contraseña actual', 'password', 'current-password');
        const campoNueva = campo('perfil-nueva', 'Nueva contraseña', 'password', 'new-password');
        const campoConfirmar = campo('perfil-confirmar', 'Confirmar nueva contraseña', 'password', 'new-password');
        campoNueva.entrada.minLength = 8;
        campoNueva.entrada.maxLength = 72;
        campoConfirmar.entrada.maxLength = 72;

        const ayudaClave = nodo(
            'p',
            'profile-hint',
            'Entre 8 y 72 caracteres. Al cambiarla se cerrará tu sesión en otros dispositivos.'
        );
        const botonClave = nodo('button', 'btn-panel btn-panel-primary btn-compact', 'Cambiar contraseña');
        botonClave.type = 'submit';
        const mensajeClave = nodo('p', 'profile-message');
        mensajeClave.setAttribute('role', 'status');

        formClave.append(
            campoActual.envoltorio,
            campoNueva.envoltorio,
            campoConfirmar.envoltorio,
            ayudaClave,
            botonClave,
            mensajeClave
        );
        seccionClave.appendChild(formClave);

        formClave.addEventListener('submit', async event => {
            event.preventDefault();
            const actual = campoActual.entrada.value;
            const nueva = campoNueva.entrada.value;

            if (nueva.length < 8 || nueva.length > 72) {
                return mostrar(mensajeClave, 'La nueva contraseña debe tener entre 8 y 72 caracteres.', true);
            }
            if (nueva !== campoConfirmar.entrada.value) {
                return mostrar(mensajeClave, 'La confirmación no coincide con la nueva contraseña.', true);
            }
            if (nueva === actual) {
                return mostrar(mensajeClave, 'La nueva contraseña debe ser distinta de la actual.', true);
            }

            botonClave.disabled = true;
            mostrar(mensajeClave, 'Guardando…');
            try {
                const { ok, datos } = await enviar(apiBase, '/api/cuenta/contrasena', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actual, nueva })
                });
                if (!ok) return mostrar(mensajeClave, datos.error || 'No se pudo cambiar la contraseña.', true);
                formClave.reset();
                mostrar(mensajeClave, datos.mensaje || 'Contraseña actualizada.');
            } catch (error) {
                mostrar(mensajeClave, 'No se pudo conectar con el servidor.', true);
            } finally {
                botonClave.disabled = false;
            }
        });

        // ---------- Armado y apertura ----------
        cuerpo.append(seccionFoto, seccionNombre, seccionClave);
        dialogo.append(cabecera, cuerpo);

        // Un clic sobre el fondo oscuro cierra el cuadro.
        dialogo.addEventListener('click', event => {
            if (event.target === dialogo) dialogo.close();
        });
        dialogo.addEventListener('close', () => dialogo.remove());

        dibujarAvatar();
        document.body.appendChild(dialogo);
        dialogo.showModal();
    }

    window.FloraPerfil = { abrir };
})();