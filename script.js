const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');

pages.forEach((page, index) => {
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', () => {
        if (!page.classList.contains('flipped')) {
            page.classList.add('flipped');
            setTimeout(() => { page.style.zIndex = index + 1; }, 600);
            
            const nextSong = pages[index + 1]?.getAttribute('data-song');
            playMusic(nextSong);
        } else {
            page.classList.remove('flipped');
            page.style.zIndex = pages.length - index;
            
            const currentSong = page.getAttribute('data-song');
            playMusic(currentSong);
        }
    });
});

function playMusic(source) {
    // Si no hay atributo data-song o está vacío, detenemos la música y salimos
    if (!source || source === "") {
        audio.pause();
        return;
    }

    // Si es la misma canción que ya está sonando, no hacemos nada
    if (audio.src.includes(source)) return;

    audio.src = source;
    
    // El método play() devuelve una promesa, la capturamos para evitar errores en consola
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Reproducción exitosa
            console.log("Reproduciendo: " + source);
        }).catch(error => {
            // Si el archivo no existe o el navegador bloquea el autoplay, silenciamos el error
            console.log("Aviso: No se pudo reproducir el audio (Archivo faltante o bloqueo de navegador).");
            audio.pause();
        });
    }
}

// Configuración de fondo
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 150 },
        "color": { "value": "#ffffff" },
        "size": { "value": 1.2, "random": true },
        "opacity": { "value": 0.5, "random": true },
        "move": { "enable": true, "speed": 0.5 }
    }
});