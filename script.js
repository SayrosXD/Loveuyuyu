const pages = [...document.querySelectorAll('.page')];
const book = document.querySelector('.book');
const bookContainer = document.querySelector('.book-container') || book;
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');
const finalMsg = document.getElementById('final-message-container');

let modoTraduccion = false;
let cargandoTraduccion = false;
let paginaActual = 0;
let finalActivado = false;

/* =========================
   AUDIO VISUALIZER
   ========================= */
let audioContext = null;
let analyser = null;
let dataArray = null;
let mediaSource = null;
let energiaSuave = 0;
let animationId = null;

/* =========================
   FINAL HEART CANVAS
   ========================= */
let heartCanvas = null;
let heartCtx = null;
let heartParticles = [];
let heartPulse = 0;
let heartFrame = null;

/* =========================
   Array con los nombres originales exactos para la restauración
   ========================= */
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
   INICIALIZAR ANALIZADOR
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
   LOOP DEL VISUALIZER
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
        pJS.particles.size.value = 2 + (energiaSuave / 45);
        pJS.particles.line_linked.opacity = 0.1 + (energiaSuave / 500);
        pJS.particles.opacity.value = 0.3 + (energiaSuave / 250);
    }
}

// --- NAVEGACIÓN Y AUDIO ---
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
            audio.play().catch(() => {});
        }
        return;
    }

    audio.src = nextSrc;
    audio.loop = true;
    audio.play().catch(() => {});
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
    if (finalActivado) return;

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

    if (paginaActual === pages.length) {
        activarFinal();
    }
}

function retrocederPagina() {
    if (paginaActual <= 0) return;
    if (finalActivado) return;

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
        if (finalActivado) return;
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

// --- SISTEMA DE TRADUCCIÓN DINÁMICO ---
btnTranslate.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (cargandoTraduccion || finalActivado) return;

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
        if (front && front.style.backgroundImage.includes('traduccion/')) {
            front.style.backgroundImage = `url('assets/images/${originalImages[i]}')`;
        }
    });
}

// --- PARTICULAS VERSIÓN BLACKPINK ULTIMATE ---
if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
        particles: {
            number: { value: 110, density: { enable: true, value_area: 900 } },
            color: {
                // Paleta: Rosa BP, Blanco, Morado y Rosa suave
                value: ["#ff4fd8", "#ffffff", "#a855f7", "#ffb7ff"]
            },
            shape: {
                // Ahora mezclamos Círculos, Estrellas e IMÁGENES (el corazón)
                type: ["circle", "star", "image"],
                image: {
                    // SVG de corazón en base64 para que no necesites archivos extra
                    src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmY0ZmQ4IiBkPSJNNDcuNiAzMDAuNEwyMjguMyA0NjkuMWM3LjUgNyAxNy40IDEwLjkgMjcuNyAxMC45czIwLjItMy45IDI3LjctMTAuOUw0NjQuNCAzMDAuNEM0OTQuOCAyNzIuMSA1MTIgMjMyLjQgNTEyIDE5MC45di01LjhjMC02OS45LTUwLjUtMTI5LjUtMTE5LjQtMTQxQzM0NyAzNi41IDMwMC42IDUxLjQgMjY4IDg0TDI1NiA5NkwyNDQgODRjLTMyLjYtMzIuNi03OS00Ny41LTEyNC42LTM5LjlDNTAuNSA1NS42IDAgMTE1LjIgMCAxODUuMXY1LjhjMCA0MS41IDE3LjIgODEuMiA0Ny42IDEwOS41eiIvPjwvc3ZnPg==",
                    width: 100,
                    height: 100
                }
            },
            opacity: {
                value: 0.7,
                random: true,
                anim: { enable: true, speed: 1, opacity_min: 0.2, sync: false }
            },
            size: {
                value: 3.5,
                random: true,
                anim: { enable: true, speed: 4, size_min: 0.3, sync: false }
            },
            line_linked: {
                enable: true,
                distance: 120,
                color: "#ff4fd8",
                opacity: 0.25,
                width: 1
            },
            move: {
                enable: true,
                speed: 1.8,
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
                onhover: { enable: true, mode: "bubble" },
                onclick: { enable: true, mode: "push" }
            },
            modes: {
                bubble: { distance: 200, size: 8, duration: 2, opacity: 1, speed: 3 },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true
    });
}

// --- ACTUALIZACIÓN DEL ANALIZADOR (Para el efecto "Latido") ---
function actualizarParticulasConAudio() {
    animationId = requestAnimationFrame(actualizarParticulasConAudio);
    if (!analyser || !dataArray) return;

    analyser.getByteFrequencyData(dataArray);

    // Capturamos el "Punch" (bajos profundos)
    let sumaBajos = 0;
    for (let i = 0; i < 4; i++) sumaBajos += dataArray[i];
    let promedioBajos = sumaBajos / 4;

    // Suavizado dinámico
    energiaSuave = energiaSuave * 0.85 + promedioBajos * 0.15;

    const pJS = window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS;
    if (pJS && pJS.particles) {
        // Velocidad: Reacciona al ritmo general
        pJS.particles.move.speed = 1 + (energiaSuave / 15);
        
        // Tamaño: Las partículas "saltan" con el beat (efecto muy visual)
        pJS.particles.size.value = 3 + (energiaSuave / 30);
        
        // Opacidad: Se vuelven más brillantes en los momentos intensos
        pJS.particles.opacity.value = 0.4 + (energiaSuave / 200);
        
        // Color dinámico (Sutil): Las líneas se intensifican
        pJS.particles.line_linked.opacity = 0.1 + (energiaSuave / 400);
    }
}

/* =========================
   FINAL CON CANVAS INDEPENDIENTE
   ========================= */
function activarFinal() {
    if (finalActivado) return;
    finalActivado = true;

    modoTraduccion = false;
    btnTranslate.style.display = "none";

    bookContainer.style.opacity = "0";
    bookContainer.style.pointerEvents = "none";

    setTimeout(() => {
        bookContainer.style.display = "none";
        crearCorazonFinal();

        if (finalMsg) {
            finalMsg.classList.remove('hidden');
            setTimeout(() => finalMsg.classList.add('show'), 300);
        }
    }, 1500);
}

function crearCorazonFinal() {
    const overlay = document.createElement('div');
    overlay.id = 'final-overlay';
    document.body.appendChild(overlay);

    heartCanvas = document.createElement('canvas');
    heartCanvas.style.position = 'absolute';
    heartCanvas.style.inset = '0';
    heartCanvas.style.width = '100%';
    heartCanvas.style.height = '100%';
    heartCanvas.style.display = 'block';
    overlay.appendChild(heartCanvas);

    heartCtx = heartCanvas.getContext('2d');

    const resize = () => {
        heartCanvas.width = window.innerWidth;
        heartCanvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    class Particle {
        constructor(tx, ty) {
            this.x = Math.random() * heartCanvas.width;
            this.y = Math.random() * heartCanvas.height;
            this.tx = tx;
            this.ty = ty;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            const scale = 1 + Math.sin(heartPulse) * 0.1;
            const targetX = this.tx * scale + heartCanvas.width / 2;
            const targetY = this.ty * scale + heartCanvas.height / 2;
            this.x += (targetX - this.x) * 0.05;
            this.y += (targetY - this.y) * 0.05;
        }

        draw() {
            heartCtx.fillStyle = "#ff4fd8";
            heartCtx.beginPath();
            heartCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            heartCtx.fill();
        }
    }

    heartParticles = [];
    for (let i = 0; i < 200; i++) {
        const t = (i / 200) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        heartParticles.push(new Particle(x * 13, y * 13));
    }

    const render = () => {
        if (!heartCtx || !heartCanvas) return;

        heartCtx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);

        heartPulse += 0.05;
        heartParticles.forEach(p => {
            p.update();
            p.draw();
        });

        heartFrame = requestAnimationFrame(render);
    };

    render();
}

// Iniciar al cargar
window.addEventListener('load', () => {
    actualizarZIndex();
});