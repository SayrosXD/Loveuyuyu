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

// Variables para Traducción
let modoTraduccion = false;
let cargandoTraduccion = false;
const originalImages = [
    'inicio.png', 'teamo(1).png', 'carta(2).png', 'lisa(3).png',
    'jennie(4).png', 'jisoo(5).png', 'rose(6).png', 'final(7).png'
];

// Audio Visualizer
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
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
        this.size = Math.random() * 2 + 1;
        this.type = Math.floor(Math.random() * 3);

        const r = Math.random();
        if (r < 0.55) this.color = '#ff4fd8'; // rosa
        else if (r < 0.8) this.color = '#ffffff'; // blanco
        else if (r < 0.92) this.color = '#b86bff'; // morado claro
        else this.color = '#7a2cff'; // morado profundo

        this.targetX = null;
        this.targetY = null;
    }

    update() {
        if (isHeartMode && this.targetX !== null) {
            let tx = this.targetX * pulseFactor + canvas.width / 2;
            let ty = this.targetY * pulseFactor + canvas.height / 2;
            this.x += (tx - this.x) * 0.04;
            this.y += (ty - this.y) * 0.04;
        } else {
            let speedMult = 1 + (energiaSuave / 25);
            this.x += this.vx * speedMult;
            this.y += this.vy * speedMult;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        if (this.type === 1) this.drawStar(ctx, this.x, this.y, 5, this.size * 2, this.size);
        else if (this.type === 2) this.drawHeart(ctx, this.x, this.y, this.size * 1.5);
        else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3; let x = cx; let y = cy; let step = Math.PI / spikes;
        ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y); rot += step;
            x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y); rot += step;
        }
        ctx.closePath(); ctx.fill();
    }

    drawHeart(ctx, x, y, size) {
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 4; i++) sum += dataArray[i];
        energiaSuave = energiaSuave * 0.85 + (sum / 4) * 0.15;
    }
    if (isHeartMode) {
        pulseTime += 0.04;
        pulseFactor = 1 + Math.sin(pulseTime) * 0.08;
    } else {
        ctx.strokeStyle = "rgba(255, 79, 216, 0.15)";
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                }
            }
        }
    }
    particles.forEach(p => { p.update(); p.draw(ctx); });
    requestAnimationFrame(render);
}
render();

function actualizarZIndex() {
    pages.forEach((page, i) => {
        if (i < paginaActual) page.style.zIndex = i + 1;
        else page.style.zIndex = pages.length - i;
    });
}

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
        bookContainer.classList.add('hidden');
        btnTranslate.classList.add('hidden');
        isHeartMode = true;
        for (let i = 0; i < 100; i++) particles.push(new Particle());
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

// Lógica de traducción integrada
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
    });
}

btnTranslate.addEventListener('click', async () => {
    if (cargandoTraduccion) return;
    if (!modoTraduccion) {
        cargandoTraduccion = true;
        btnTranslate.disabled = true;
        try {
            const index = Math.min(paginaActual, originalImages.length - 1);
            let tradName = originalImages[index].replace(/\(\d+\)/, "").replace(".png", "_traduccion.png");
            const tradSrc = `assets/images/traduccion/${tradName}`;
            await preloadImage(tradSrc);
            pages[index].querySelector('.front').style.backgroundImage = `url('${tradSrc}')`;
            btnTranslate.querySelector('.text').innerText = "Ver Original";
            modoTraduccion = true;
        } catch (e) { console.log("Error en traducción", e); }
        finally { cargandoTraduccion = false; btnTranslate.disabled = false; }
    } else {
        modoTraduccion = false;
        btnTranslate.querySelector('.text').innerText = "Traducir página";
        pages.forEach((p, i) => {
            p.querySelector('.front').style.backgroundImage = `url('assets/images/${originalImages[i]}')`;
        });
    }
});

bookContainer.addEventListener('click', (e) => {
    const rect = bookContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX > rect.width / 2) cambiarPagina('adelante');
    else cambiarPagina('atras');
});

actualizarZIndex();
