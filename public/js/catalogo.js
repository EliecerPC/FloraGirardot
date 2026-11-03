document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://' + window.location.hostname + ':3000'
        : '';
    const cardsGrid = document.querySelector('.cards-grid');
    const searchInput = document.getElementById('search-input');
    const checkboxes = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');

    let todasLasEspecies = [];

    try {
        const response = await fetch(API_BASE + '/api/especies');
        if (!response.ok) throw new Error('Error HTTP: ' + response.status);
        todasLasEspecies = await response.json();

        // Renderizar todas al inicio
        renderizarTarjetas(todasLasEspecies);

    } catch (error) {
        console.error('Error cargando el catálogo:', error);
        mostrarMensaje('Error al conectar con el servidor.');
    }

    // Escuchar cambios en la barra de búsqueda y checkboxes
    if (searchInput) {
        searchInput.addEventListener('input', aplicarFiltros);
    }
    checkboxes.forEach(chk => chk.addEventListener('change', aplicarFiltros));


    function aplicarFiltros() {
        const textoBusqueda = searchInput
            ? searchInput.value.toLowerCase().trim()
            : '';

        const tiposSeleccionados = Array.from(
            document.querySelectorAll('.filter-tipo:checked')
        ).map(cb => cb.value.toLowerCase());

        const origenesSeleccionados = Array.from(
            document.querySelectorAll('.filter-origen:checked')
        ).map(cb => cb.value.toLowerCase());

        const habitatsSeleccionados = Array.from(
            document.querySelectorAll('.filter-habitat:checked')
        ).map(cb => cb.value.toLowerCase());

        const especiesFiltradas = todasLasEspecies.filter(e => {
            const nombreComun = (e.nombre_comun || '').toLowerCase();
            const nombreCientifico = (e.nombre_cientifico || '').toLowerCase();
            const familia = (e.familia || '').toLowerCase();

            const tipo = (e.tipo_planta || '').toLowerCase();
            const origen = (e.origen || '').toLowerCase();
            const habitat = (e.habitat || '').toLowerCase();

            // Búsqueda por texto
            const coincideTexto = !textoBusqueda ||
                nombreComun.includes(textoBusqueda) ||
                nombreCientifico.includes(textoBusqueda) ||
                familia.includes(textoBusqueda);

            // Tipo de planta
            const coincideTipo = tiposSeleccionados.length === 0 ||
                tiposSeleccionados.some(t => tipo.includes(t));

            // Origen
            const coincideOrigen = origenesSeleccionados.length === 0 ||
                origenesSeleccionados.some(o => origen.includes(o));

            // Hábitat: reconocer expresiones relacionadas
            const coincideHabitat = habitatsSeleccionados.length === 0 ||
                habitatsSeleccionados.some(h => {
                    const equivalencias = {
                        'bosque seco': ['bosque seco'],
                        'ribera': ['ribera', 'río', 'rios', 'quebrada'],
                        'intervenido': [
                            'zona abierta',
                            'zonas abiertas',
                            'intervenido',
                            'potrero',
                            'potreros',
                            'borde de camino',
                            'bordes de caminos',
                            'paisaje rural'
                        ],
                        'bosque húmedo': ['bosque húmedo', 'bosques húmedos'],
                        'urbano': [
                            'parque',
                            'parques',
                            'jardín',
                            'jardines',
                            'avenida',
                            'avenidas',
                            'vía urbana',
                            'vías urbanas'
                        ]
                    };

                    return (equivalencias[h] || [h])
                        .some(palabra => habitat.includes(palabra));
                });

            return coincideTexto &&
                coincideTipo &&
                coincideOrigen &&
                coincideHabitat;
        });

        renderizarTarjetas(especiesFiltradas);
    }


    function crearElemento(etiqueta, clase, texto) {
        const elemento = document.createElement(etiqueta);
        if (clase) elemento.className = clase;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    }

    function mostrarMensaje(texto, clase) {
        cardsGrid.replaceChildren(crearElemento('p', clase, texto));
    }

    function renderizarTarjetas(lista) {
        if (!lista || lista.length === 0) {
            mostrarMensaje('No se encontraron especies que coincidan con los filtros.', 'no-results');
            return;
        }
        cardsGrid.replaceChildren(...lista.map(crearTarjeta));
    }

    // Se arma con textContent: los datos de la base nunca se interpretan como HTML.
    function crearTarjeta(especie) {
        const tarjeta = crearElemento('article', 'species-card-horizontal');

        const contenedorImagen = crearElemento('div', 'card-img-wrapper');
        const imagen = document.createElement('img');
        imagen.src = especie.ruta || '../public/assets/img/acacia-card.jpg';
        imagen.alt = especie.nombre_comun;
        contenedorImagen.appendChild(imagen);

        const info = crearElemento('div', 'card-info-wrapper');
        const texto = crearElemento('div', 'card-text-content');
        texto.append(
            crearElemento('h3', '', especie.nombre_comun),
            crearElemento('p', 'scientific-name', especie.nombre_cientifico),
            crearElemento('p', 'family-name', especie.familia || 'Familia no especificada')
        );

        const enlace = crearElemento('a', 'btn-card-white', 'Ver Ficha');
        enlace.href = 'ficha.html?id=' + encodeURIComponent(especie.id_especie);

        info.append(texto, enlace);
        tarjeta.append(contenedorImagen, info);
        return tarjeta;
    }
});