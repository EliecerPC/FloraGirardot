document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://' + (window.location.hostname || 'localhost') + ':3000';
    const estadistica = document.getElementById('home-stat');
    if (!estadistica) return;

    try {
        const response = await fetch(API_BASE + '/api/especies');
        if (!response.ok) return;

        const especies = await response.json();
        if (!Array.isArray(especies) || especies.length === 0) return;

        estadistica.textContent = especies.length === 1
            ? 'Actualmente el catálogo reúne 1 especie.'
            : 'Actualmente el catálogo reúne ' + especies.length + ' especies.';
        estadistica.hidden = false;
    } catch (error) {
        // Si el servidor no está disponible, la portada se ve igual, sin este dato.
        console.error('No se pudo consultar el catálogo:', error);
    }
});