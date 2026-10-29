document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://' + (window.location.hostname || 'localhost') + ':3000';
    const encabezado = document.querySelector('.main-header');
    if (!encabezado) return;

    // 1. El logo pasa a ser un enlace a la portada.
    const logo = encabezado.querySelector('.logo-group');
    if (logo && logo.tagName !== 'A') {
        const enlaceLogo = document.createElement('a');
        enlaceLogo.className = logo.className;
        enlaceLogo.href = 'index.html';
        enlaceLogo.setAttribute('aria-label', 'FloraGirardot, ir al inicio');
        enlaceLogo.append(...logo.childNodes);
        logo.replaceWith(enlaceLogo);

        // La etiqueta del enlace ya describe el logo; el ícono no necesita repetirla.
        const icono = enlaceLogo.querySelector('.logo-icon');
        if (icono) icono.alt = '';
    }

    // 2. El nombre se divide en dos partes para darles colores distintos.
    const titulo = encabezado.querySelector('.logo-title');
    if (titulo && titulo.textContent.trim() === 'FloraGirardot') {
        const flora = document.createElement('span');
        flora.className = 'logo-flora';
        flora.textContent = 'Flora';

        const girardot = document.createElement('span');
        girardot.className = 'logo-girardot';
        girardot.textContent = 'Girardot';

        titulo.replaceChildren(flora, girardot);
    }

    // 3. Al bajar, el encabezado se compacta.
    const actualizarEstado = () => {
        encabezado.classList.toggle('scrolled', window.scrollY > 10);
    };
    actualizarEstado();
    window.addEventListener('scroll', actualizarEstado, { passive: true });

    // 4. Menú de usuario.
    crearMenuUsuario(encabezado.querySelector('.header-container') || encabezado);

    function crearMenuUsuario(destino) {
        const ETIQUETAS_ROL = { ciudadano: 'Ciudadano', investigador: 'Investigador', admin: 'Administrador' };
        // sesion: 'cargando' | 'anonimo' | 'activa' | 'error'
        const estado = { sesion: 'cargando', usuario: null, aportes: null, fotoVersion: Date.now() };

        const nodo = (etiqueta, clase, texto) => {
            const elemento = document.createElement(etiqueta);
            if (clase) elemento.className = clase;
            if (texto !== undefined) elemento.textContent = texto;
            return elemento;
        };

        const enlace = (clase, href, texto) => {
            const a = nodo('a', clase, texto);
            a.href = href;
            return a;
        };

        // El parámetro v obliga al navegador a pedir la foto de nuevo cuando cambia.
        const urlFoto = () => API_BASE + '/api/cuenta/foto?v=' + estado.fotoVersion;
        const inicialUsuario = () => ((estado.usuario && estado.usuario.nombre) || '?').trim().charAt(0).toUpperCase();

        const contenedor = nodo('div', 'user-menu');

        const boton = nodo('button', 'user-menu-button');
        boton.type = 'button';
        boton.setAttribute('aria-haspopup', 'true');
        boton.setAttribute('aria-expanded', 'false');
        boton.setAttribute('aria-controls', 'panel-usuario');
        boton.setAttribute('aria-label', 'Menú de usuario');

        const icono = nodo('span', 'user-icon');
        // Ícono fijo: no incluye ningún dato del usuario.
        icono.innerHTML =
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path></svg>';

        const foto = nodo('img', 'user-photo');
        foto.alt = '';
        foto.hidden = true;
        foto.addEventListener('error', () => {
            if (estado.usuario) estado.usuario.tiene_foto = false;
            actualizarBoton();
            if (!panel.hidden) dibujarPanel();
        });

        const punto = nodo('span', 'user-status-dot');
        punto.hidden = true;

        boton.append(icono, foto, punto);

        const panel = nodo('div', 'user-menu-panel');
        panel.id = 'panel-usuario';
        panel.hidden = true;

        contenedor.append(boton, panel);
        destino.appendChild(contenedor);

        // ---------- Botón: ícono o foto de perfil ----------

        function actualizarBoton() {
            const conFoto = estado.sesion === 'activa' && Boolean(estado.usuario && estado.usuario.tiene_foto);
            boton.classList.toggle('has-photo', conFoto);
            icono.hidden = conFoto;
            foto.hidden = !conFoto;
            if (conFoto) foto.src = urlFoto();
            punto.hidden = estado.sesion !== 'activa';
        }

        // ---------- Contenido del panel ----------

        function crearAvatar() {
            const avatar = nodo('div', 'user-avatar');
            if (estado.usuario.tiene_foto) {
                const imagen = nodo('img', 'user-avatar-img');
                imagen.alt = '';
                imagen.src = urlFoto();
                imagen.addEventListener('error', () => {
                    imagen.remove();
                    avatar.textContent = inicialUsuario();
                });
                avatar.appendChild(imagen);
            } else {
                avatar.textContent = inicialUsuario();
            }
            return avatar;
        }

        function resumenReportes() {
            const seccion = nodo('div', 'user-panel-section');
            seccion.appendChild(nodo('p', 'user-panel-section-title', 'Mis reportes'));

            if (estado.aportes === null) {
                seccion.appendChild(nodo('p', 'user-panel-note', 'Cargando…'));
            } else if (estado.aportes === 'error') {
                seccion.appendChild(nodo('p', 'user-panel-note', 'No se pudo cargar el resumen.'));
            } else if (!estado.aportes.length) {
                seccion.appendChild(nodo('p', 'user-panel-note', 'Aún no has enviado reportes.'));
            } else {
                const cuentas = { pendiente: 0, verificado: 0, requiere_correccion: 0, rechazado: 0 };
                estado.aportes.forEach(aporte => {
                    if (Object.hasOwn(cuentas, aporte.estado)) cuentas[aporte.estado]++;
                });

                const rejilla = nodo('div', 'user-stats');
                [
                    ['pendiente', 'Pendientes'],
                    ['verificado', 'Aprobados'],
                    ['requiere_correccion', 'Por corregir'],
                    ['rechazado', 'Rechazados']
                ].forEach(([clave, etiqueta]) => {
                    const item = nodo('div', 'user-stat');
                    item.append(nodo('strong', '', String(cuentas[clave])), nodo('span', '', etiqueta));
                    rejilla.appendChild(item);
                });
                seccion.appendChild(rejilla);
            }
            return seccion;
        }

        function dibujarCuenta() {
            const u = estado.usuario;

            const cabecera = nodo('div', 'user-panel-header');
            const identidad = nodo('div', 'user-panel-id');
            identidad.append(
                nodo('strong', 'user-panel-name', u.nombre),
                nodo('span', 'user-panel-email', u.correo),
                nodo('span', 'user-role-badge', ETIQUETAS_ROL[u.rol] || u.rol)
            );
            cabecera.append(crearAvatar(), identidad);

            const partes = [cabecera];

            if (u.fecha_registro) {
                const fecha = new Date(u.fecha_registro);
                if (!isNaN(fecha)) {
                    partes.push(nodo(
                        'p',
                        'user-panel-since',
                        'Miembro desde ' + fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
                    ));
                }
            }

            partes.push(resumenReportes());

            const enlaces = nodo('div', 'user-panel-links');

            const editar = nodo('button', 'user-panel-link user-panel-link-button', 'Editar mi perfil');
            editar.type = 'button';
            editar.addEventListener('click', () => {
                cerrar(false);
                abrirPerfil();
            });

            enlaces.append(
                editar,
                enlace('user-panel-link', 'participacion.html#mis-aportes', 'Ver mis reportes'),
                enlace('user-panel-link', 'participacion.html', 'Enviar un reporte')
            );
            if (['admin', 'investigador'].includes(u.rol)) {
                enlaces.append(enlace('user-panel-link', 'revision.html', 'Bandeja de revisión'));
            }
            partes.push(enlaces);

            const salir = nodo('button', 'user-panel-logout', 'Cerrar sesión');
            salir.type = 'button';
            salir.addEventListener('click', () => cerrarSesion(salir));
            partes.push(salir);

            panel.replaceChildren(...partes);
        }

        function dibujarPanel() {
            if (estado.sesion === 'cargando') {
                panel.replaceChildren(nodo('p', 'user-panel-note', 'Cargando…'));
            } else if (estado.sesion === 'error') {
                const reintentar = nodo('button', 'btn-panel btn-panel-secondary', 'Reintentar');
                reintentar.type = 'button';
                reintentar.addEventListener('click', () => {
                    estado.sesion = 'cargando';
                    dibujarPanel();
                    cargarSesion();
                });
                panel.replaceChildren(
                    nodo('p', 'user-panel-title', 'Sin conexión'),
                    nodo('p', 'user-panel-text', 'No se pudo conectar con el servidor. Verifica que esté iniciado.'),
                    reintentar
                );
            } else if (estado.sesion === 'anonimo') {
                const acciones = nodo('div', 'user-panel-actions');
                acciones.append(
                    enlace('btn-panel btn-panel-primary', 'login.html', 'Iniciar sesión'),
                    enlace('btn-panel btn-panel-secondary', 'registro.html', 'Crear cuenta')
                );
                panel.replaceChildren(
                    nodo('p', 'user-panel-title', 'Tu cuenta'),
                    nodo('p', 'user-panel-text', 'Inicia sesión para enviar reportes y seguir su estado.'),
                    acciones
                );
            } else {
                dibujarCuenta();
            }
        }

        // ---------- Editor de perfil (se carga solo cuando se usa) ----------

        function cargarScriptPerfil() {
            if (window.FloraPerfil) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = '../public/js/perfil.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('No se pudo cargar perfil.js'));
                document.head.appendChild(script);
            });
        }

        async function abrirPerfil() {
            try {
                await cargarScriptPerfil();
                window.FloraPerfil.abrir({
                    apiBase: API_BASE,
                    usuario: estado.usuario,
                    urlFoto,
                    alCambiar(cambios) {
                        Object.assign(estado.usuario, cambios);
                        if (Object.hasOwn(cambios, 'tiene_foto')) estado.fotoVersion = Date.now();
                        actualizarBoton();
                        if (!panel.hidden) dibujarPanel();
                    }
                });
            } catch (error) {
                console.error('No se pudo abrir el editor de perfil:', error);
            }
        }

        // ---------- Datos ----------

        async function cargarSesion() {
            try {
                const response = await fetch(API_BASE + '/api/auth/me', { credentials: 'include' });
                if (response.status === 401) {
                    estado.sesion = 'anonimo';
                    estado.usuario = null;
                } else if (response.ok) {
                    estado.usuario = (await response.json()).usuario;
                    estado.sesion = 'activa';
                } else {
                    estado.sesion = 'error';
                }
            } catch (error) {
                estado.sesion = 'error';
            }
            actualizarBoton();
            if (!panel.hidden) {
                dibujarPanel();
                if (estado.sesion === 'activa') cargarResumen();
            }
        }

        async function cargarResumen() {
            if (estado.aportes !== null) return;
            try {
                const response = await fetch(API_BASE + '/api/mis-aportes', { credentials: 'include' });
                if (!response.ok) throw new Error('Respuesta no válida');
                estado.aportes = await response.json();
            } catch (error) {
                estado.aportes = 'error';
            }
            if (!panel.hidden) dibujarPanel();
        }

        async function cerrarSesion(botonSalir) {
            botonSalir.disabled = true;
            try {
                await fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = 'index.html';
            } catch (error) {
                botonSalir.disabled = false;
                botonSalir.textContent = 'No se pudo cerrar sesión. Reintentar';
            }
        }

        // ---------- Abrir y cerrar ----------

        function abrir() {
            panel.hidden = false;
            boton.setAttribute('aria-expanded', 'true');
            dibujarPanel();
            if (estado.sesion === 'activa') cargarResumen();
        }

        function cerrar(devolverFoco) {
            panel.hidden = true;
            boton.setAttribute('aria-expanded', 'false');
            if (devolverFoco) boton.focus();
        }

        boton.addEventListener('click', () => (panel.hidden ? abrir() : cerrar(false)));

        document.addEventListener('click', event => {
            if (!contenedor.contains(event.target)) cerrar(false);
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !panel.hidden) cerrar(true);
        });

        cargarSesion();
    }
});