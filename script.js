const pages = [...document.querySelectorAll('.page')];
const book = document.querySelector('.book');
const bookContainer = document.querySelector('.book-container') || book;
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');

let modoTraduccion = false;
let cargandoTraduccion = false;
let paginaActual = 0;

/* =========================
   AUDIO VISUALIZER & STATE
   ========================= */
let audioContext = null;
let analyser = null;
let dataArray = null;
let mediaSource = null;
let energiaSuave = 0;
let animationId = null;

// Para el Canvas manual del final
let particlesFinal = [];
let isHeartMode = false;
let pulseFactor = 1;
let pulseTime = 0;

const originalImages = [
    'inicio.png', 'teamo(1).png', 'carta(2).png', 'lisa(3).png',
    'jennie(4).png', 'jisoo(5).png', 'rose(6).png', 'final(7).png'
];

// --- 1. INICIALIZACIÓN DE PARTICULAS (Tus valores originales) ---
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 50, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#ff4fd8" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ff4fd8",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 1.2,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": false }, "onclick": { "enable": true, "mode": "push" } }
            },
            "retina_detect": true
        });
    }
}

// --- 2. ACTUALIZACIÓN CON AUDIO (Tus valores originales) ---
function actualizarParticulasConAudio() {
    animationId = requestAnimationFrame(actualizarParticulasConAudio);
    if (!analyser || !dataArray || isHeartMode) return;

    analyser.getByteFrequencyData(dataArray);
    let sumaBajos = 0;
    for (let i = 0; i < 4; i++) sumaBajos += dataArray[i];
    energiaSuave = energiaSuave * 0.85 + (sumaBajos / 4) * 0.15;

    const pJS = window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS;
    if (pJS && pJS.particles) {
        pJS.particles.move.speed = 1.2 + (energiaSuave / 15);
        pJS.particles.size.value = 3 + (energiaSuave / 20);
    }
}

// --- 3. LÓGICA DE TRADUCCIÓN ---
btnTranslate.addEventListener('click', () => {
    const currentIdx = Math.min(paginaActual, originalImages.length - 1);
    const frontSide = pages[currentIdx].querySelector('.front');
    
    if (!modoTraduccion) {
        let originalName = originalImages[currentIdx];
        let tradName = originalName.replace(".png", "_traduccion.png").replace(/\(\d+\)/, "");
        frontSide.style.backgroundImage = `url('assets/images/traduccion/${tradName}')`;
        btnTranslate.querySelector('.text').innerText = "Ver Original";
        modoTraduccion = true;
    } else {
        frontSide.style.backgroundImage = `url('assets/images/${originalImages[currentIdx]}')`;
        btnTranslate.querySelector('.text').innerText = "Traducir página";
        modoTraduccion = false;
    }
});

// --- 4. NAVEGACIÓN DEL LIBRO ---
function cambiarPagina(dir) {
    modoTraduccion = false;
    btnTranslate.querySelector('.text').innerText = "Traducir página";

    if (dir === 'adelante' && paginaActual < pages.length) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            mediaSource = audioContext.createMediaElementSource(audio);
            analyser.fftSize = 64;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            mediaSource.connect(analyser);
            analyser.connect(audioContext.destination);
            actualizarParticulasConAudio();
        }
        
        pages[paginaActual].classList.add('flipped');
        paginaActual++;
        actualizarZIndex();

        if (paginaActual === pages.length) {
            activarEscenaFinal();
        } else {
            const song = pages[paginaActual].getAttribute('data-song');
            if (song) { audio.src = song; audio.play(); }
        }
    } else if (dir === 'atras' && paginaActual > 0) {
        paginaActual--;
        pages[paginaActual].classList.remove('flipped');
        actualizarZIndex();
        const song = pages[paginaActual].getAttribute('data-song');
        if (song) { audio.src = song; audio.play(); }
    }
}

function actualizarZIndex() {
    pages.forEach((p, i) => {
        p.style.zIndex = (i < paginaActual) ? i + 1 : pages.length - i;
    });
}

// --- 5. ESCENA FINAL (CANVAS MANUAL) ---
function activarEscenaFinal() {
    isHeartMode = true;
    bookContainer.style.opacity = "0";
    btnTranslate.style.display = "none";

    setTimeout(() => {
        bookContainer.style.display = "none";
        // Ocultamos el canvas de particles.js
        const oldCanvas = document.querySelector('#particles-js canvas');
        if (oldCanvas) oldCanvas.style.display = "none";

        iniciarCanvasCorazon();
        
        const msg = document.getElementById('final-message-container');
        if (msg) {
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('show'), 500);
        }
    }, 1200);
}

function iniciarCanvasCorazon() {
    const canvas = document.createElement('canvas');
    canvas.id = 'final-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class HeartParticle {
        constructor(tx, ty) {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.tx = tx; 
            this.ty = ty;
            this.size = Math.random() * 2 + 1;
            this.color = "#ff4fd8";
        }
        update() {
            let targetX = this.tx * pulseFactor + canvas.width / 2;
            let targetY = this.ty * pulseFactor + canvas.height / 2;
            this.x += (targetX - this.x) * 0.05;
            this.y += (targetY - this.y) * 0.05;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Generar puntos de corazón
    for (let i = 0; i < 180; i++) {
        let t = (i / 180) * Math.PI * 2;
        let x = 16 * Math.pow(Math.sin(t), 3);
        let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        particlesFinal.push(new HeartParticle(x * 13, y * 13));
    }

    function animFinal() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pulseTime += 0.05;
        pulseFactor = 1 + Math.sin(pulseTime) * 0.1;
        particlesFinal.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animFinal);
    }
    animFinal();
}

// Listeners iniciales
bookContainer.addEventListener('click', (e) => {
    const rect = bookContainer.getBoundingClientRect();
    if (e.clientX - rect.left > rect.width / 2) cambiarPagina('adelante');
    else cambiarPagina('atras');
});

initParticles();
actualizarZIndex();
