const pages = [...document.querySelectorAll('.page')];
const bookContainer = document.querySelector('.book-container');
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');

let paginaActual = 0;
let modoTraduccion = false;
let audioContext = null;
let analyser = null;
let dataArray = null;
let energiaSuave = 0;

// Variables para el sistema de partículas del final (Canvas)
let particlesFinal = [];
let isHeartMode = false;
let pulseFactor = 1;
let pulseTime = 0;

const originalImages = [
    'inicio.png', 'teamo(1).png', 'carta(2).png', 'lisa(3).png',
    'jennie(4).png', 'jisoo(5).png', 'rose(6).png', 'final(7).png'
];

// --- 1. INICIALIZAR PARTICULAS ORIGINALES (Valores de tu script original) ---
function initParticles() {
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
                "speed": 1.2, // Tu velocidad original
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out", // Comportamiento que pediste: desaparecen y aparecen
                "bounce": false
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": { "onhover": { "enable": false } },
            "modes": { "push": { "particles_nb": 4 } }
        },
        "retina_detect": true
    });
}
initParticles();

// --- 2. LÓGICA DE AUDIO (Tu comportamiento original) ---
function actualizarParticulasConAudio() {
    requestAnimationFrame(actualizarParticulasConAudio);
    if (!analyser || !dataArray || isHeartMode) return;

    analyser.getByteFrequencyData(dataArray);
    let sumaBajos = 0;
    for (let i = 0; i < 4; i++) sumaBajos += dataArray[i];
    energiaSuave = energiaSuave * 0.85 + (sumaBajos / 4) * 0.15;

    const pJS = window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS;
    if (pJS && pJS.particles) {
        // Valores exactos de tu script (2).js
        pJS.particles.move.speed = 1.2 + (energiaSuave / 15);
        pJS.particles.size.value = 3 + (energiaSuave / 20);
    }
}

// --- 3. TRADUCCIÓN ---
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

// --- 4. NAVEGACIÓN ---
function cambiarPagina(dir) {
    modoTraduccion = false;
    btnTranslate.querySelector('.text').innerText = "Traducir página";

    if (dir === 'adelante' && paginaActual < pages.length) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audio);
            analyser.fftSize = 64;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            source.connect(analyser); analyser.connect(audioContext.destination);
            actualizarParticulasConAudio();
        }
        pages[paginaActual].classList.add('flipped');
        paginaActual++;
        actualizarZIndex();
        if (paginaActual === pages.length) activarFinal();
        else {
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
    pages.forEach((page, i) => {
        if (i < paginaActual) page.style.zIndex = i + 1;
        else page.style.zIndex = pages.length - i;
    });
}

// --- 5. COMPORTAMIENTO ESPECIAL AL FINAL (Corazón) ---
function activarFinal() {
    bookContainer.style.opacity = "0";
    setTimeout(() => {
        bookContainer.style.display = 'none';
        btnTranslate.style.display = 'none';
        
        // Detenemos particles.js y mostramos el Canvas del corazón
        isHeartMode = true;
        const pjsCanvas = document.querySelector('#particles-js canvas');
        if (pjsCanvas) pjsCanvas.style.display = 'none';
        
        iniciarCorazonFinal();
        document.getElementById('final-message-container').classList.remove('hidden');
        setTimeout(() => document.getElementById('final-message-container').classList.add('show'), 500);
    }, 1500);
}

// Lógica de dibujo manual solo para el final
function iniciarCorazonFinal() {
    const canvas = document.createElement('canvas');
    canvas.id = 'final-heart-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class ParticleFinal {
        constructor(tx, ty) {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.tx = tx; this.ty = ty;
            this.size = Math.random() * 2 + 1;
            this.color = "#ff4fd8";
        }
        update() {
            let realTx = this.tx * pulseFactor + canvas.width / 2;
            let realTy = this.ty * pulseFactor + canvas.height / 2;
            this.x += (realTx - this.x) * 0.05;
            this.y += (realTy - this.y) * 0.05;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Crear forma de corazón
    for (let i = 0; i < 150; i++) {
        let t = (i / 150) * Math.PI * 2;
        let x = 16 * Math.pow(Math.sin(t), 3);
        let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        particlesFinal.push(new ParticleFinal(x * 12, y * 12));
    }

    function renderFinal() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pulseTime += 0.05;
        pulseFactor = 1 + Math.sin(pulseTime) * 0.1;
        particlesFinal.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(renderFinal);
    }
    renderFinal();
}

bookContainer.addEventListener('click', (e) => {
    const rect = bookContainer.getBoundingClientRect();
    if ((e.clientX - rect.left) > rect.width / 2) cambiarPagina('adelante');
    else cambiarPagina('atras');
});

actualizarZIndex();
