const pages = [...document.querySelectorAll('.page')];
const book = document.querySelector('.book');
const bookContainer = document.querySelector('.book-container') || book;
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');
const finalMsg = document.getElementById('final-message-container');

const IMAGE_DIR = 'assets/images';
const TRANSLATION_DIR = `${IMAGE_DIR}/traduccion`;

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
   IMÁGENES ORIGINALES
   ========================= */
const originalImages = [
  'inicio.png', 'teamo(1).png', 'carta(2).png', 'lisa(3).png',
  'jennie(4).png', 'jisoo(5).png', 'rose(6).png', 'final(7).png'
];

function getOriginalSrc(index) {
  return `${IMAGE_DIR}/${originalImages[index]}`;
}

function getTranslatedName(originalName) {
  let tradName = originalName
    .replace(/\(\d+\)/g, '')
    .replace('.png', '_traduccion.png');

  if (tradName.includes('jennie')) tradName = tradName.replace('jennie', 'Jennie');
  if (tradName.includes('lisa')) tradName = tradName.replace('lisa', 'Lisa');

  return tradName;
}

function getTranslatedSrc(index) {
  return `${TRANSLATION_DIR}/${getTranslatedName(originalImages[index])}`;
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

async function preloadTranslations() {
  for (let i = 0; i < originalImages.length; i++) {
    const src = getTranslatedSrc(i);
    try {
      await preloadImage(src);
    } catch (_) {
      // Si alguna no existe, no rompemos la app.
    }
  }
}

/* =========================
   PARTÍCULAS
   ========================= */
function initParticles() {
  if (typeof particlesJS === 'undefined') return;

  particlesJS("particles-js", {
    particles: {
      number: { value: 110, density: { enable: true, value_area: 900 } },
      color: { value: ["#ff4fd8", "#ffffff", "#a855f7", "#ffb7ff"] },
      shape: {
        type: ["circle", "star"],
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

/* =========================
   AUDIO
   ========================= */
function iniciarAnalizadorAudio() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.85;

  mediaSource = audioContext.createMediaElementSource(audio);
  mediaSource.connect(analyser);
  analyser.connect(audioContext.destination);

  dataArray = new Uint8Array(analyser.frequencyBinCount);
  actualizarParticulasConAudio();
}

function actualizarParticulasConAudio() {
  animationId = requestAnimationFrame(actualizarParticulasConAudio);

  if (!analyser || !dataArray) return;
  if (finalActivado) return;

  analyser.getByteFrequencyData(dataArray);

  const bajos = Math.min(5, dataArray.length);
  let suma = 0;
  for (let i = 0; i < bajos; i++) suma += dataArray[i];

  const promedio = bajos ? suma / bajos : 0;
  energiaSuave = energiaSuave * 0.88 + promedio * 0.12;

  const pJS = window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS;
  if (pJS && pJS.particles && pJS.particles.move) {
    pJS.particles.move.speed = Math.max(0.35, Math.min(8, 0.5 + (energiaSuave / 22)));
    pJS.particles.size.value = 2 + (energiaSuave / 45);
    pJS.particles.line_linked.opacity = 0.1 + (energiaSuave / 500);
    pJS.particles.opacity.value = 0.3 + (energiaSuave / 250);
  }
}

function playMusic(source) {
  if (!source || !audio) return;

  const nextSrc = new URL(source, window.location.href).href;

  if (!audioContext) {
    iniciarAnalizadorAudio();
  } else if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  if (audio.src === nextSrc) {
    if (audio.paused) audio.play().catch(() => {});
    return;
  }

  audio.src = nextSrc;
  audio.loop = true;
  audio.play().catch(() => {});
}

/* =========================
   NAVEGACIÓN
   ========================= */
function actualizarZIndex() {
  pages.forEach((page, i) => {
    page.style.zIndex = i < paginaActual ? i + 1 : pages.length - i;
  });
}

function desactivarTraduccionGlobal() {
  modoTraduccion = false;
  btnTranslate.querySelector('.text').innerText = "Traducir página";
  btnTranslate.style.background = "rgba(0, 0, 0, 0.8)";
  btnTranslate.style.color = "#ff4fd8";

  pages.forEach((p, i) => {
    const front = p.querySelector('.front');
    if (front) front.style.backgroundImage = `url('${getOriginalSrc(i)}')`;
  });
}

function avanzarPagina() {
  if (paginaActual >= pages.length || finalActivado) return;

  if (modoTraduccion) desactivarTraduccionGlobal();

  const page = pages[paginaActual];
  page.style.zIndex = pages.length + 10;

  requestAnimationFrame(() => {
    page.classList.add('flipped');
  });

  paginaActual++;

  const nextSong = pages[paginaActual]?.getAttribute('data-song');
  if (nextSong) playMusic(nextSong);

  setTimeout(() => {
    actualizarZIndex();
    if (paginaActual === pages.length) activarFinal();
  }, 1150);
}

function retrocederPagina() {
  if (paginaActual <= 0 || finalActivado) return;

  if (modoTraduccion) desactivarTraduccionGlobal();

  paginaActual--;

  const page = pages[paginaActual];
  page.style.zIndex = pages.length + 10;

  requestAnimationFrame(() => {
    page.classList.remove('flipped');
  });

  const currentSong = page.getAttribute('data-song');
  if (currentSong) playMusic(currentSong);

  setTimeout(actualizarZIndex, 1150);
}

/* =========================
   TRADUCCIÓN
   ========================= */
btnTranslate.addEventListener('click', async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (cargandoTraduccion || finalActivado) return;

  const pageActiva = pages[paginaActual] || [...pages].find(p => !p.classList.contains('flipped'));
  if (!pageActiva) return;

  const indexPage = pages.indexOf(pageActiva);
  const frontDiv = pageActiva.querySelector('.front');
  if (!frontDiv) return;

  if (!modoTraduccion) {
    const tradSrc = getTranslatedSrc(indexPage);

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

/* =========================
   EVENTO CLICK DEL LIBRO
   ========================= */
pages.forEach((page) => {
  page.style.pointerEvents = 'none';
});

if (bookContainer) {
  bookContainer.addEventListener('click', (e) => {
    if (e.target.closest('#btn-translate')) return;
    if (finalActivado) return;

    const rect = bookContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x > rect.width / 2) avanzarPagina();
    else retrocederPagina();
  });
}

/* =========================
   FINAL CON CORAZÓN
   ========================= */
function ocultarParticlesJS() {
  const pjsCanvas = document.querySelector('#particles-js canvas');
  if (pjsCanvas) pjsCanvas.style.display = 'none';

  const pjsContainer = document.getElementById('particles-js');
  if (pjsContainer) pjsContainer.style.pointerEvents = 'none';
}

function activarFinal() {
  if (finalActivado) return;
  finalActivado = true;
  modoTraduccion = false;
  isHeartMode = true;

  bookContainer.style.opacity = "0";
  btnTranslate.style.display = "none";

  setTimeout(() => {
    bookContainer.style.display = "none";
    ocultarParticlesJS();
    crearCorazonFinal();

    if (finalMsg) {
      finalMsg.classList.remove('hidden');
      setTimeout(() => finalMsg.classList.add('show'), 500);
    }
  }, 1200);
}

function crearCorazonFinal() {
  heartCanvas = document.createElement('canvas');
  heartCanvas.id = 'heart-canvas';
  heartCanvas.style.position = 'fixed';
  heartCanvas.style.top = '0';
  heartCanvas.style.left = '0';
  heartCanvas.style.width = '100vw';
  heartCanvas.style.height = '100vh';
  heartCanvas.style.zIndex = '100';
  heartCanvas.style.pointerEvents = 'none';
  document.body.appendChild(heartCanvas);

  heartCtx = heartCanvas.getContext('2d');

  const resize = () => {
    heartCanvas.width = window.innerWidth;
    heartCanvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor(tx, ty) {
      this.x = Math.random() * heartCanvas.width;
      this.y = Math.random() * heartCanvas.height;
      this.tx = tx;
      this.ty = ty;
      this.size = Math.random() * 2 + 1;
    }

    update() {
      const targetX = this.tx * (1 + Math.sin(heartPulse) * 0.1) + heartCanvas.width / 2;
      const targetY = this.ty * (1 + Math.sin(heartPulse) * 0.1) + heartCanvas.height / 2;
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

/* =========================
   INICIO
   ========================= */
window.addEventListener('load', async () => {
  initParticles();
  await preloadTranslations();
  actualizarZIndex();
});