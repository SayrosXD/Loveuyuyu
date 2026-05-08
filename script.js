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
    if (!source || source === "") {
        audio.pause();
        return;
    }

    if (audio.src.includes(source)) return;

    audio.src = source;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("Reproduciendo: " + source);
        }).catch(() => {
            console.log("Aviso: No se pudo reproducir el audio.");
            audio.pause();
        });
    }
}

// Partículas estilo BLACKPINK: elegante, neon, suaves y con brillo

            
                particlesJS("particles-js", {
    particles: {
        number: {
            value: 80,
            density: {
                enable: true,
                value_area: 1000
            }
        },
        color: {
            value: ["#ff4fd8", "#ff8bd6", "#ffffff"]
        },
        shape: {
            type: ["circle", "star"]
        },
        opacity: {
            value: 0.7,
            random: true,
            anim: {
                enable: true,
                speed: 0.6,
                opacity_min: 0.15,
                sync: false
            }
        },
        size: {
            value: 2.2,
            random: true,
            anim: {
                enable: true,
                speed: 1.5,
                size_min: 0.3,
                sync: false
            }
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
            onhover: {
                enable: true,
                mode: "repulse"
            },
            onclick: {
                enable: true,
                mode: "push"
            },
            resize: true
        },
        modes: {
            repulse: {
                distance: 100,
                duration: 0.4
            },
            push: {
                particles_nb: 2
            }
        }
    },
    retina_detect: true
}); 