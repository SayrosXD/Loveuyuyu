const pages = [...document.querySelectorAll('.page')];
const book = document.querySelector('.book');
const bookContainer = document.querySelector('.book-container') || book;
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');

let modoTraduccion = false;
let cargandoTraduccion = false;
let paginaActual = 0;

/* =========================
   NUEVO: AUDIO VISUALIZER
   ========================= */
let audioContext = null;
let analyser = null;
let dataArray = null;
let mediaSource = null;
let energiaSuave = 0;
let animationId = null;

// Array con los nombres originales exactos para la restauración
const originalImages = [
    'inicio.png', 'teamo(1).png', 'carta(2).png', 'lisa(3).png',
    'jennie(4).png', 'jisoo(5).png', 'rose(6).png', 'final(7).png'
];

function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
    });
}

// Pre-carga opcional de las traducciones al iniciar
window.addEventListener('load', () => {
    originalImages.forEach((originalName) => {
        let tradName = originalName.replace(/\(\d+\)/, "").replace(".png", "_traduccion.png");
        if (tradName.includes("jennie")) tradName = tradName.replace("jennie", "Jennie");
        if (tradName.includes("lisa")) tradName = tradName.replace("lisa", "Lisa");

        const img = new Image();
        img.src = `traduccion/${tradName}`;
    });
});

/* =========================
   NUEVO: INICIALIZAR ANALIZADOR
   ========================= */
function iniciarAnalizadorAudio() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();

    // Valores bajos = más liviano y suficiente para reaccionar al ritmo
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.85;

    mediaSource = audioContext.createMediaElementSource(audio);
    mediaSource.connect(analyser);
    analyser.connect(audioContext.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);

    actualizarParticulasConAudio();
}

/* =========================
   NUEVO: LOOP DEL VISUALIZER
   ========================= */
function actualizarParticulasConAudio() {
    animationId = requestAnimationFrame(actualizarParticulasConAudio);

    if (!analyser || !dataArray) return;

    analyser.getByteFrequencyData(dataArray);

    // Tomamos solo frecuencias bajas para captar el pulso/beat
    const bajos = Math.min(5, dataArray.length);
    let suma = 0;

    for (let i = 0; i < bajos; i++) {
        suma += dataArray[i];
    }

    const promedio = bajos ? (suma / bajos) : 0;

    // Suavizado para evitar saltos bruscos
    energiaSuave = energiaSuave * 0.88 + promedio * 0.12;

    // Mapeo: canción lenta = partículas lentas; canción intensa = más rápidas
    const speed = Math.max(0.35, Math.min(8, 0.5 + (energiaSuave / 22)));

    const pJS = window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS;
    if (pJS && pJS.particles && pJS.particles.move) {
        pJS.particles.move.speed = speed;
    }
}

// --- 1. NAVEGACIÓN Y AUDIO ---
function playMusic(source) {
    if (!source || !audio) return;

    // Normaliza la URL para comparar bien
    const nextSrc = new URL(source, window.location.href).href;

    // Iniciar el contexto solo con interacción del usuario
    if (!audioContext) {
        iniciarAnalizadorAudio();
    } else if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    // Si ya está sonando esa misma pista, no la recargues
    if (audio.src === nextSrc) {
        if (audio.paused) {
            audio.play().catch(() => console.log("Audio en espera"));
        }
        return;
    }

    audio.src = nextSrc;
    audio.loop = true;
    audio.play().catch(() => console.log("Audio en espera"));
}

function actualizarZIndex() {
    pages.forEach((page, i) => {
        page.style.zIndex = i < paginaActual ? i + 1 : pages.length - i;
    });
}

function volverPagina(pageToBack, pageIndex) {
    if (modoTraduccion) desactivarTraduccionGlobal();
    pageToBack.classList.remove('flipped');
    pageToBack.style.zIndex = pages.length - pageIndex;
    paginaActual = pageIndex;

    const currentSong = pageToBack.getAttribute('data-song');
    if (currentSong) playMusic(currentSong);
}

function avanzarPagina() {
    if (paginaActual >= pages.length) return;

    if (modoTraduccion) desactivarTraduccionGlobal();

    const page = pages[paginaActual];

    // Mantener la página visible mientras gira
    page.style.zIndex = pages.length + 10;

    requestAnimationFrame(() => {
        page.classList.add('flipped');
    });

    paginaActual++;

    const nextSong = pages[paginaActual]?.getAttribute('data-song');
    if (nextSong) playMusic(nextSong);

    setTimeout(actualizarZIndex, 1150);
}

function retrocederPagina() {
    if (paginaActual <= 0) return;

    if (modoTraduccion) desactivarTraduccionGlobal();

    paginaActual--;

    const page = pages[paginaActual];

    // Mantener la página visible mientras regresa
    page.style.zIndex = pages.length + 10;

    requestAnimationFrame(() => {
        page.classList.remove('flipped');
    });

    const currentSong = page.getAttribute('data-song');
    if (currentSong) playMusic(currentSong);

    setTimeout(actualizarZIndex, 1150);
}

// Evita que las páginas capturen el clic y bloqueen la navegación
pages.forEach((page, index) => {
    page.style.pointerEvents = 'none';
    page.style.zIndex = pages.length - index;
});

if (bookContainer) {
    bookContainer.addEventListener('click', (e) => {
        if (e.target.closest('#btn-translate')) return;

        const rect = bookContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x > rect.width / 2) {
            avanzarPagina();
        } else {
            retrocederPagina();
        }
    });
}

actualizarZIndex();

// --- 2. SISTEMA DE TRADUCCIÓN DINÁMICO ---
btnTranslate.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (cargandoTraduccion) return;

    const pageActiva = pages[paginaActual] || Array.from(pages).find(p => !p.classList.contains('flipped'));
    if (!pageActiva) return;

    const indexPage = Array.from(pages).indexOf(pageActiva);
    const frontDiv = pageActiva.querySelector('.front');

    if (!modoTraduccion) {
        let originalName = originalImages[indexPage];
        let tradName = originalName.replace(/\(\d+\)/, "").replace(".png", "_traduccion.png");

        if (tradName.includes("jennie")) tradName = tradName.replace("jennie", "Jennie");
        if (tradName.includes("lisa")) tradName = tradName.replace("lisa", "Lisa");

        const tradSrc = `traduccion/${tradName}`;

        try {
            cargandoTraduccion = true;
            btnTranslate.disabled = true;

            await preloadImage(tradSrc);

            frontDiv.style.backgroundImage = `url('${tradSrc}')`;

            btnTranslate.querySelector('.text').innerText = "Ver Original";
            btnTranslate.style.background = "#ff4fd8";
            btnTranslate.style.color = "#000";
            modoTraduccion = true;
        } catch (error) {
            console.log("No se pudo cargar la imagen de traducción", error);
        } finally {
            cargandoTraduccion = false;
            btnTranslate.disabled = false;
        }
    } else {
        desactivarTraduccionGlobal();
    }
});

function desactivarTraduccionGlobal() {
    modoTraduccion = false;
    btnTranslate.querySelector('.text').innerText = "Traducir página";
    btnTranslate.style.background = "rgba(0, 0, 0, 0.8)";
    btnTranslate.style.color = "#ff4fd8";

    pages.forEach((p, i) => {
        const front = p.querySelector('.front');
        if (front.style.backgroundImage.includes('traduccion/')) {
            front.style.backgroundImage = `url('assets/images/${originalImages[i]}')`;
        }
    });
}

if (typeof particlesJS !== 'undefined') {
  particlesJS("particles-js", {
    particles: {
      number: {
        value: 85,
        density: { enable: true, value_area: 900 }
      },
      color: {
        value: ["#ff4fd8", "#ffffff", "#d36bff"]
      },
      shape: {
        type: ["circle", "star"]
      },
      opacity: {
        value: 0.45,
        random: true,
        anim: {
          enable: true,
          speed: 0.5,
          opacity_min: 0.12,
          sync: false
        }
      },
      size: {
        value: 2.6,
        random: true,
        anim: {
          enable: true,
          speed: 2.2,
          size_min: 0.5,
          sync: false
        }
      },
      line_linked: {
        enable: true,
        distance: 130,
        color: "#ff4fd8",
        opacity: 0.16,
        width: 1
      },
      move: {
        enable: true,
        speed: 1.2,
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
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" },
        resize: true
      },
      modes: {
        grab: {
          distance: 170,
          line_linked: { opacity: 0.35 }
        },
        push: {
          particles_nb: 2
        }
      }
    },
    retina_detect: true
  });
}