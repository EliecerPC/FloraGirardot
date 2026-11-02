document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://' + (window.location.hostname || 'localhost') + ':3000';
    const titleBadge = document.querySelector('.species-title-badge');
    const especieId = new URLSearchParams(window.location.search).get('id');

    if (!especieId) {
        titleBadge.textContent = 'Especie no especificada';
        return;
    }

    try {
        const response = await fetch(API_BASE + '/api/especies/' + encodeURIComponent(especieId));

        if (response.status === 404) {
            titleBadge.textContent = 'Especie no encontrada';
            return;
        }
        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();

        // 1. Título
        titleBadge.textContent = `${data.nombre_comun} - ${data.nombre_cientifico}`;

        // 2. Imagen principal (si la especie no tiene foto, se oculta el recuadro)
        const speciesImg = document.querySelector('.species-image-box img');
        if (speciesImg) {
            if (data.ruta) {
                speciesImg.src = data.ruta;
                speciesImg.alt = data.nombre_comun;
            } else {
                speciesImg.style.display = 'none';
            }
        }

        // 3. Ficha taxonómica (solo muestra lo que proviene de la base de datos)
        const taxonomyBox = document.querySelector('.taxonomy-list-card');
        if (taxonomyBox) {
            taxonomyBox.replaceChildren();
            agregarDato(taxonomyBox, 'Nombre común', data.nombre_comun || 'No registrado', '.');
            agregarDato(taxonomyBox, 'Nombre científico', data.nombre_cientifico || 'No registrado', '.', true);
            agregarDato(taxonomyBox, 'Familia', data.familia || 'No especificada', '.');
            agregarDato(taxonomyBox, 'Origen', data.origen || 'No especificado', '.');
            agregarDato(taxonomyBox, 'Tipo de planta', data.tipo_planta || 'No especificado', '.');
            agregarDato(taxonomyBox, 'Rango altitudinal', data.rango_altitudinal || 'No especificado', '');
        }

        // 4. Información botánica
        const campos = {
            'descripcion': data.descripcion,
            'caracteristicas': data.caracteristicas,
            'habitat': data.habitat,
            'distribucion': data.distribucion,
            'importancia-ecologica': data.importancia_ecologica,
            'conservacion': data.conservacion
        };

        Object.entries(campos).forEach(([id, contenido]) => {
            const elemento = document.getElementById(id);

            if (elemento) {
                elemento.textContent = contenido || 'Sin información registrada en la base de datos.';
            }
        });

        // 5. Fuentes bibliográficas
        const listaFuentes = document.getElementById('fuentes-bibliograficas');

        if (listaFuentes) {
            listaFuentes.replaceChildren();

            if (data.fuentes && data.fuentes.length > 0) {
                data.fuentes.forEach(fuente => {
                    const elemento = document.createElement('li');

                    const autor = fuente.autor_institucion || 'Autor no especificado';
                    const anio = fuente.anio || 's. f.';

                    elemento.textContent = `${autor} (${anio}). ${fuente.titulo || 'Título no disponible'}.`;

                    if (fuente.enlace) {
                        const enlace = document.createElement('a');
                        enlace.href = fuente.enlace;
                        enlace.textContent = ' Consultar fuente';
                        enlace.target = '_blank';
                        enlace.rel = 'noopener noreferrer';

                        elemento.appendChild(enlace);
                    }

                    listaFuentes.appendChild(elemento);
                });
            } else {
                const elemento = document.createElement('li');
                elemento.textContent = 'No hay fuentes bibliográficas registradas.';
                listaFuentes.appendChild(elemento);
            }
        }


        // 5. Mapa
        inicializarMapa(data.ubicaciones, data.nombre_comun);

    } catch (error) {
        console.error('Error al cargar la ficha:', error);
        titleBadge.textContent = 'No se pudo cargar la ficha. Verifica que el servidor esté iniciado.';
    }
});

// Agrega una línea "Etiqueta: valor" sin interpretar el valor como HTML.
function agregarDato(contenedor, etiqueta, valor, sufijo, cursiva = false) {
    const linea = document.createElement('p');

    const negrita = document.createElement('strong');
    negrita.textContent = etiqueta + ':';
    linea.append(negrita, ' ');

    if (cursiva) {
        const enfasis = document.createElement('em');
        enfasis.textContent = valor;
        linea.appendChild(enfasis);
    } else {
        linea.append(valor);
    }

    if (sufijo) linea.append(sufijo);
    contenedor.appendChild(linea);
}

function inicializarMapa(ubicaciones, nombreEspecie) {
    const mapContainer = document.getElementById('mapa-girardot');
    if (!mapContainer || typeof L === 'undefined') return;

    // Coordenadas centrales de Girardot
    const map = L.map('mapa-girardot').setView([4.3023, -74.8061], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Solo pinta marcadores si existen ubicaciones registradas en la base de datos
    if (ubicaciones && ubicaciones.length > 0) {
        ubicaciones.forEach(ub => {
            if (!ub.direccion_coordenadas) return;

            const coords = ub.direccion_coordenadas.split(',').map(c => parseFloat(c.trim()));
            if (coords.length !== 2 || !coords.every(Number.isFinite)) return;

            // El popup se arma con nodos de texto, no con HTML.
            const popup = document.createElement('div');
            const nombre = document.createElement('b');
            nombre.textContent = nombreEspecie;
            popup.append(nombre, document.createElement('br'), document.createTextNode(ub.sector || ''));

            L.marker(coords).addTo(map).bindPopup(popup);
        });
    }
}