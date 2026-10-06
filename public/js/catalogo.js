document.addEventListener('DOMContentLoaded', async () => {
    const cardsGrid = document.querySelector('.cards-grid');
    const searchInput = document.getElementById('search-input');
    const checkboxes = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');

    let todasLasEspecies = [];

    try {
        const response = await fetch('http://localhost:3000/api/especies');
        todasLasEspecies = await response.json();

        // Renderizar todas al inicio
        renderizarTarjetas(todasLasEspecies);

    } catch (error) {
        console.error('Error cargando el catálogo:', error);
        cardsGrid.innerHTML = '<p>Error al conectar con el servidor.</p>';
    }

    // Escuchar cambios en la barra de búsqueda y checkboxes
    if (searchInput) {
        searchInput.addEventListener('input', aplicarFiltros);
    }
    checkboxes.forEach(chk => chk.addEventListener('change', aplicarFiltros));

    function aplicarFiltros() {
        const textoBusqueda = searchInput ? searchInput.value.toLowerCase().trim() : '';

        // Obtener los valores seleccionados de cada categoría
        const tiposSeleccionados = Array.from(document.querySelectorAll('.filter-tipo:checked')).map(cb => cb.value.toLowerCase());
        const origenesSeleccionados = Array.from(document.querySelectorAll('.filter-origen:checked')).map(cb => cb.value.toLowerCase());
        const habitatsSeleccionados = Array.from(document.querySelectorAll('.filter-habitat:checked')).map(cb => cb.value.toLowerCase());

        const especiesFiltradas = todasLasEspecies.filter(e => {
            // 1. Filtro por texto (Nombre común, científico o familia)
            const coincideTexto = !textoBusqueda ||
                (e.nombre_comun && e.nombre_comun.toLowerCase().includes(textoBusqueda)) ||
                (e.nombre_cientifico && e.nombre_cientifico.toLowerCase().includes(textoBusqueda)) ||
                (e.familia && e.familia.toLowerCase().includes(textoBusqueda));

            // 2. Filtro por Tipo de Planta
            const coincideTipo = tiposSeleccionados.length === 0 ||
                (e.tipo_planta && tiposSeleccionados.some(t => e.tipo_planta.toLowerCase().includes(t)));

            // 3. Filtro por Origen
            const coincideOrigen = origenesSeleccionados.length === 0 ||
                (e.origen && origenesSeleccionados.some(o => e.origen.toLowerCase().includes(o)));

            // 4. Filtro por Hábitat
            const coincideHabitat = habitatsSeleccionados.length === 0 ||
                (e.habitat && habitatsSeleccionados.some(h => e.habitat.toLowerCase().includes(h)));

            return coincideTexto && coincideTipo && coincideOrigen && coincideHabitat;
        });

        renderizarTarjetas(especiesFiltradas);
    }

    function renderizarTarjetas(lista) {
        if (!lista || lista.length === 0) {
            cardsGrid.innerHTML = '<p class="no-results">No se encontraron especies que coincidan con los filtros.</p>';
            return;
        }

        cardsGrid.innerHTML = lista.map(especie => {
            let rutaImagen = especie.ruta || '../public/assets/img/acacia-card.jpg';
            /*if (rutaImagen.includes('public/')) {
                rutaImagen = rutaImagen.replace('../public/', '../');
            }*/

            return `
        <article class="species-card-horizontal">
          <div class="card-img-wrapper">
            <img src="${rutaImagen}" alt="${especie.nombre_comun}">
          </div>
          <div class="card-info-wrapper">
            <div class="card-text-content">
              <h3>${especie.nombre_comun}</h3>
              <p class="scientific-name">${especie.nombre_cientifico}</p>
              <p class="family-name">${especie.familia || 'Familia no especificada'}</p>
            </div>
            <a href="ficha.html?id=${especie.id_especie}" class="btn-card-white">Ver Ficha</a>
          </div>
        </article>
      `;
        }).join('');
    }
});