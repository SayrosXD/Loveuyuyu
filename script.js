const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
const pages = [...document.querySelectorAll('.page')];
const bookContainer = document.querySelector('.book-container');
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');

let paginaActual = 0;
let particles = [];
let isHeartMode = false;
let pulseFactor = 1;
let pulseTime = 0;
let energiaSuave = 0;
let audioContext, analyser, dataArray;

// --- CONFIGURACIÓN DE NITIDEZ ---
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.init();
    }
    init() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        
        // Velocidad original: estable y pausada
        this.vx = (Math.random() - 0.5) * 1.0; 
        this.vy = (Math.random() - 0.5) * 1.0;
        
        // Tamaño base y lógica de parpadeo/crecimiento
        this.baseSize = Math.random() * 1.5 + 0.5;
        this.size = this.baseSize;
        this.growing = Math.random() > 0.5;
        
        this.type = Math.floor(Math.random() * 3);

        const r = Math.random();
        if (r < 0.55) this.color = '#ff4fd8';
        else if (r < 0.8) this.color = '#ffffff';
        else if (r < 0.92) this.color = '#b86bff';
        else this.color = '#7a2cff';

        this.targetX = null;
        this.targetY = null;
    }

    update() {
        if (isHeartMode && this.targetX !== null) {
            let tx = this.targetX * pulseFactor + window.innerWidth / 2;
            let ty = this.targetY * pulseFactor + window.innerHeight / 2;
            this.x += (tx - this.x) * 0.04;
            this.y += (ty - this.y) * 0.04;
        } else {
            // 1. Variación aleatoria de tamaño (como en tu original)
            if (this.growing) {
                this.size += 0.01;
                if (this.size > this.baseSize + 1) this.growing = false;
            } else {
                this.size -= 0.01;
                if (this.size < this.baseSize) this.growing = true;
            }

            // 2. Reacción al Audio: Velocidad y Tamaño (Valores rescatados de tu script)
            let speedMult = 1 + (energiaSuave / 15); 
            let audioSizeMult = 1 + (energiaSuave / 20); 

            this.x += this.vx * speedMult;
            this.y += this.vy * speedMult;

            // 3. Comportamiento "Out" (reaparecer)
            if (this.x < -10) this.x = window.innerWidth + 10;
            if (this.x > window.innerWidth + 10) this.x = -10;
            if (this.y < -10) this.y = window.innerHeight + 10;
            if (this.y > window.innerHeight + 10) this.y = -10;

            this.currentRenderSize = this.size * audioSizeMult;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.7; 
        const renderSize = isHeartMode ? this.size * 1.5 : this.currentRenderSize;

        if (this.type === 1) {
            this.drawStar(this.x, this.y, 5, renderSize * 2, renderSize);
        } else if (this.type === 2) {
            this.drawHeart(this.x, this.y, renderSize * 1.5);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, renderSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3; let step = Math.PI / spikes;
        ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        ctx.closePath(); ctx.fill();
    }

    drawHeart(x, y, size) {
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.bezierCurveTo(x, y - size, x - size, y - size, x - size, y);
        ctx.bezierCurveTo(x - size, y + size, x, y + size, x, y + size * 1.5);
        ctx.bezierCurveTo(x, y + size, x + size, y + size, x + size, y);
        ctx.bezierCurveTo(x + size, y - size, x, y - size, x, y);
        ctx.fill();
    }
}

for (let i = 0; i < 50; i++) particles.push(new Particle());

function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 4; i++) sum += dataArray[i];
        energiaSuave = energiaSuave * 0.85 + (sum / 4) * 0.15;
    }

    if (!isHeartMode) {
        ctx.strokeStyle = "rgba(255, 79, 216, 0.12)";
        ctx.lineWidth = 0.8;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                }
            }
        }
    } else {
        pulseTime += 0.04;
        pulseFactor = 1 + Math.sin(pulseTime) * 0.08;
    }

    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(render);
}
render();

// Navegación (Izquierda: Atrás / Derecha: Adelante)
function cambiarPagina(dir) {
    if (dir === 'adelante' && paginaActual < pages.length) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audio);
            analyser.fftSize = 64;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            source.connect(analyser); analyser.connect(audioContext.destination);
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

function activarFinal() {
    bookContainer.style.opacity = "0";
    setTimeout(() => {
        bookContainer.style.display = 'none';
        btnTranslate.style.display = 'none';
        isHeartMode = true;
        for (let i = 0; i < 120; i++) particles.push(new Particle());
        particles.forEach((p, i) => {
            let t = (i / particles.length) * Math.PI * 2;
            let x = 16 * Math.pow(Math.sin(t), 3);
            let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            p.targetX = x * 13; p.targetY = y * 13;
        });
        document.getElementById('final-message-container').classList.remove('hidden');
        setTimeout(() => document.getElementById('final-message-container').classList.add('show'), 500);
    }, 1500);
}

function actualizarZIndex() {
    pages.forEach((page, i) => {
        if (i < paginaActual) page.style.zIndex = i + 1;
        else page.style.zIndex = pages.length - i;
    });
}

bookContainer.addEventListener('click', (e) => {
    const rect = bookContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX > rect.width / 2) cambiarPagina('adelante');
    else cambiarPagina('atras');
});

actualizarZIndex();
