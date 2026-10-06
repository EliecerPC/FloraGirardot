document.addEventListener('DOMContentLoaded', () => {
    const formAporte = document.getElementById('form-aporte');
    const listaAportes = document.getElementById('lista-aportes');
    const mensajeFeedback = document.getElementById('mensaje-feedback');

    const dropArea = document.getElementById('drop-area');
    const inputImagen = document.getElementById('input-imagen');
    const imgPreview = document.getElementById('img-preview');
    const previewContainer = document.getElementById('preview-container');

    // Trigger para abrir el selector de archivos al hacer clic en la caja
    if (dropArea) {
        dropArea.addEventListener('click', () => inputImagen.click());
    }

    // Previsualizar la imagen seleccionada
    if (inputImagen) {
        inputImagen.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imgPreview.src = event.target.result;
                    imgPreview.style.display = 'block';
                    previewContainer.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Envío del formulario usando FormData
    if (formAporte) {
        formAporte.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('planta', document.getElementById('input-planta').value.trim());
            formData.append('ubicacion', document.getElementById('input-ubicacion').value.trim());
            formData.append('notas', document.getElementById('input-notas').value.trim());

            if (inputImagen.files[0]) {
                formData.append('imagen', inputImagen.files[0]);
            }

            try {
                const response = await fetch('http://localhost:3000/api/aportes', {
                    method: 'POST',
                    body: formData // No llevar Header Content-Type, el navegador lo asigna automáticamente con multipart
                });

                const data = await response.json();

                if (response.ok) {
                    mensajeFeedback.style.color = '#00b04f';
                    mensajeFeedback.textContent = '¡Gracias! Tu reporte e imagen se guardaron correctamente.';
                    formAporte.reset();

                    // Resetear previsualización
                    imgPreview.style.display = 'none';
                    previewContainer.style.display = 'flex';

                    cargarAportes();
                } else {
                    mensajeFeedback.style.color = 'red';
                    mensajeFeedback.textContent = data.error || 'Ocurrió un error al guardar el reporte.';
                }
            } catch (error) {
                console.error('Error al enviar aporte:', error);
                mensajeFeedback.style.color = 'red';
                mensajeFeedback.textContent = 'No se pudo conectar con el servidor.';
            }
        });
    }

    async function cargarAportes() {
        if (!listaAportes) return;

        try {
            const response = await fetch('http://localhost:3000/api/aportes');
            const aportes = await response.json();

            if (aportes.length === 0) {
                listaAportes.innerHTML = '<p style="color: #666;">No hay reportes recientes.</p>';
                return;
            }

            listaAportes.innerHTML = aportes.map(aporte => `
        <article class="species-card-horizontal" style="background: #00b04f; border-radius: 15px; padding: 0.8rem; min-height: 90px; align-items: center; display: flex; gap: 1rem;">
          <div class="card-img-wrapper" style="width: 70px; height: 70px; background: transparent; flex-shrink: 0;">
            <img src="../assets/img/acacia-card.jpg" alt="Ilustración Planta" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
          </div>
          <div class="card-info-wrapper" style="flex: 1; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
            <div class="card-text-content" style="color: white;">
              <h3 style="color: white; font-size: 1rem; margin: 0;">${aporte.descripcion.split('|')[0] || 'Planta'}</h3>
              <p style="color: rgba(255,255,255,0.8); font-size: 0.8rem; margin: 0;">${aporte.observaciones ? aporte.observaciones.substring(0, 25) + '...' : ''}</p>
            </div>
            <button class="btn-card-white" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; white-space: nowrap;">Ver Reporte</button>
          </div>
        </article>
      `).join('');

        } catch (error) {
            console.error('Error al cargar lista de aportes:', error);
            listaAportes.innerHTML = '<p style="color: #666;">No se pudieron cargar los reportes.</p>';
        }
    }
});