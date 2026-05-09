const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');

// Forzamos que el audio siempre intente loopear la canción actual
audio.loop = true;

pages.forEach((page, index) => {
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', (e) => {
        // Detectar si el clic es para avanzar o retroceder (según tu lógica de bordes anterior)
        const rect = page.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // AVANZAR (Borde derecho)
        if (x > width * 0.7 && !page.classList.contains('flipped')) {
            page.classList.add('flipped');
            setTimeout(() => { page.style.zIndex = index + 1; }, 600);

            const nextSong = pages[index + 1]?.getAttribute('data-song');
            if (nextSong) playMusic(nextSong);
        } 
        // RETROCEDER (Borde izquierdo)
        else if (x < width * 0.3 && page.classList.contains('flipped')) {
            page.classList.remove('flipped');
            page.style.zIndex = pages.length - index;

            const currentSong = page.getAttribute('data-song');
            if (currentSong) playMusic(currentSong);
        }
    });
});

function playMusic(source) {
    if (!source || source === "") {
        audio.pause();
        return;
    }

    // Si la canción ya es la que está sonando, no hacemos nada (sigue en bucle)
    if (audio.src.includes(source)) return;

    audio.src = source;
    audio.loop = true; // Aseguramos que el bucle esté activo para la nueva fuente
    
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("Reproduciendo en bucle: " + source);
        }).catch(() => {
            console.log("Aviso: Interacción necesaria para iniciar audio.");
        });
    }
}

// --- Partículas estilo BLACKPINK ---
particlesJS("particles-js", {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 1000 } },
        color: { value: ["#ff4fd8", "#ff8bd6", "#ffffff"] },
        shape: { type: ["circle", "star"] },
        opacity: {
            value: 0.7,
            random: true,
            anim: { enable: true, speed: 0.6, opacity_min: 0.15, sync: false }
        },
        size: {
            value: 2.2,
            random: true,
            anim: { enable: true, speed: 1.5, size_min: 0.3, sync: false }
        },
        line_linked: {
            enable: true,
            distance: 140,
            color: "#ff4fd8",
            opacity: 0.14,
            width: 1
        },
        move: {
            enable: true,
            speed: 0.7,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" },
            resize: true
        },
        modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { particles_nb: 2 }
        }
    },
    retina_detect: true
});
