document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const especieId = urlParams.get('id');

    if (!especieId) {
        document.querySelector('.species-title-badge').textContent = 'Especie no especificada';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/especies/${especieId}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        // 1. Título y Badge
        const titleBadge = document.querySelector('.species-title-badge');
        if (titleBadge) {
            titleBadge.textContent = `${data.nombre_comun} - ${data.nombre_cientifico}`;
        }

        // 2. Imagen Principal
        const speciesImg = document.querySelector('.species-image-box img');
        if (speciesImg) {
            speciesImg.src = data.ruta || '../public/assets/img/placeholder.jpg';
            speciesImg.alt = data.nombre_comun;
        }

        // 3. Ficha Taxonómica (Solo muestra lo que proviene de la BD)
        const taxonomyBox = document.querySelector('.taxonomy-list-card');
        if (taxonomyBox) {
            taxonomyBox.innerHTML = `
                <p><strong>Nombre común:</strong> ${data.nombre_comun || 'No registrado'}.</p>
                <p><strong>Nombre científico:</strong> <em>${data.nombre_cientifico || 'No registrado'}</em>.</p>
                <p><strong>Familia:</strong> ${data.familia || 'No especificada'}.</p>
                <p><strong>Origen:</strong> ${data.origen || 'No especificado'}.</p>
                <p><strong>Tipo de planta:</strong> ${data.tipo_planta || 'No especificado'}.</p>
                <p><strong>Rango altitudinal:</strong> ${data.rango_altitudinal || 'No especificado'}</p>
            `;
        }

        // 4. Bloques de Texto
        const blocks = document.querySelectorAll('.info-block-card');
        if (blocks[0]) {
            blocks[0].querySelector('p').textContent = data.descripcion || 'Sin información registrada en la base de datos.';
        }
        if (blocks[1]) {
            blocks[1].querySelector('p').textContent = data.importancia_ecologica || data.distribucion || 'Sin información registrada en la base de datos.';
        }

        // 5. Inicializar Mapa
        inicializarMapa(data.ubicaciones, data.nombre_comun);

    } catch (error) {
        console.error('Error al cargar la ficha:', error);
        const titleBadge = document.querySelector('.species-title-badge');
        if (titleBadge) {
            titleBadge.textContent = 'Error al consultar la base de datos';
        }
    }
});

function inicializarMapa(ubicaciones, nombreEspecie) {
    const mapContainer = document.getElementById('mapa-girardot');
    if (!mapContainer) return;

    // Coordenadas centrales de Girardot
    const map = L.map('mapa-girardot').setView([4.3023, -74.8061], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Solo pinta marcadores si existen registros reales de ubicaciones en PostgreSQL
    if (ubicaciones && ubicaciones.length > 0) {
        ubicaciones.forEach(ub => {
            if (ub.direccion_coordenadas) {
                const coords = ub.direccion_coordenadas.split(',').map(c => parseFloat(c.trim()));
                if (coords.length === 2 && !isNaN(coords[0])) {
                    L.marker(coords)
                        .addTo(map)
                        .bindPopup(`<b>${nombreEspecie}</b><br>${ub.sector}`);
                }
            }
        });
    }
}