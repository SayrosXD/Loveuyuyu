const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
const pages = [...document.querySelectorAll('.page')];
const bookContainer = document.querySelector('.book-container');
const audio = document.getElementById('bg-music');

let paginaActual = 0;
let particles = [];
let isHeartMode = false;
let heartScale = 0;
let pulseFactor = 1;

// Configuración del Visualizador
let audioContext, analyser, dataArray, energiaSuave = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.init();
    }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.3 ? '#ff4fd8' : '#ffffff';
        this.targetX = null;
        this.targetY = null;
    }
    update() {
        if (isHeartMode && this.targetX !== null) {
            // Lógica de atracción al corazón (Lerp)
            let tx = this.targetX * pulseFactor + canvas.width / 2;
            let ty = this.targetY * pulseFactor + canvas.height / 2;
            this.x += (tx - this.x) * 0.04;
            this.y += (ty - this.y) * 0.04;
        } else {
            // Movimiento normal + Reacción al Audio
            let speedMult = 1 + (energiaSuave / 20);
            this.x += this.vx * speedMult;
            this.y += this.vy * speedMult;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Generar 300 partículas para una forma definida
for (let i = 0; i < 300; i++) {
    particles.push(new Particle());
}

function getHeartPoint(t) {
    // Ecuación matemática del corazón
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * 12, y: y * 12 };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        let suma = 0;
        for (let i = 0; i < 5; i++) suma += dataArray[i];
        energiaSuave = energiaSuave * 0.8 + (suma / 5) * 0.2;
    }

    if (isHeartMode) {
        heartScale += 0.04;
        pulseFactor = 1 + Math.sin(heartScale) * 0.1; // Efecto de latido
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(render);
}
render();

function iniciarAudio() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
}

function cambiarPagina(dir) {
    if (dir === 'adelante' && paginaActual < pages.length) {
        iniciarAudio();
        const p = pages[paginaActual];
        p.classList.add('flipped');
        p.style.zIndex = 10 + paginaActual;
        paginaActual++;

        if (paginaActual === pages.length) {
            activarEfectoFinal();
        } else {
            const nextSong = pages[paginaActual].getAttribute('data-song');
            if (nextSong) {
                audio.src = nextSong;
                audio.play();
            }
        }
    }
}

function activarEfectoFinal() {
    // Ocultar libro
    bookContainer.style.opacity = "0";
    setTimeout(() => bookContainer.classList.add('hidden'), 2000);

    // Activar modo corazón
    isHeartMode = true;
    particles.forEach((p, i) => {
        let t = (i / particles.length) * Math.PI * 2;
        let pos = getHeartPoint(t);
        p.targetX = pos.x;
        p.targetY = pos.y;
    });

    // Mostrar mensaje
    const msg = document.getElementById('final-message-container');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('show'), 1500);
}

// Navegación táctil/click
bookContainer.addEventListener('click', (e) => {
    const rect = bookContainer.getBoundingClientRect();
    if (e.clientX - rect.left > rect.width / 2) cambiarPagina('adelante');
});

// Lógica básica del traductor (simulada según tu estructura previa)
document.getElementById('btn-translate').addEventListener('click', () => {
    Swal.fire({
        title: 'Traducción',
        text: '¡Esta página dice que eres la mejor!',
        confirmButtonColor: '#ff4fd8'
    });
});
