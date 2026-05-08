const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');
let currentPage = 0;

pages.forEach((page, index) => {
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', () => {
        if (!page.classList.contains('flipped')) {
            // Pasar página adelante
            page.classList.add('flipped');
            page.style.zIndex = index + 1;
            
            // Cambiar música
            const nextSong = pages[index + 1]?.getAttribute('data-song');
            if (nextSong) {
                playSong(nextSong);
            }
        } else {
            // Regresar página
            page.classList.remove('flipped');
            page.style.zIndex = pages.length - index;
            
            // Regresar a la canción anterior
            const prevSong = pages[index]?.getAttribute('data-song');
            if (prevSong) {
                playSong(prevSong);
            }
        }
    });
});

function playSong(source) {
    audio.src = source;
    audio.play().catch(e => console.log("El navegador bloqueó el autoplay. Haz clic en la página primero."));
}

// Configuración de las estrellas de fondo
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 100 },
        "color": { "value": "#ffffff" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5, "random": true },
        "size": { "value": 2, "random": true },
        "line_linked": { "enable": false },
        "move": { "enable": true, "speed": 1 }
    }
});
 
