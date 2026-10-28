document.addEventListener('DOMContentLoaded', () => {
    const encabezado = document.querySelector('.main-header');
    if (!encabezado) return;

    // 1. El logo pasa a ser un enlace a la portada.
    const logo = encabezado.querySelector('.logo-group');
    if (logo && logo.tagName !== 'A') {
        const enlace = document.createElement('a');
        enlace.className = logo.className;
        enlace.href = 'index.html';
        enlace.setAttribute('aria-label', 'FloraGirardot, ir al inicio');
        enlace.append(...logo.childNodes);
        logo.replaceWith(enlace);

        // La etiqueta del enlace ya describe el logo; el ícono no necesita repetirla.
        const icono = enlace.querySelector('.logo-icon');
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
});