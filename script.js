const pages = [...document.querySelectorAll('.page')];
const book = document.querySelector('.book');
const bookContainer = document.querySelector('.book-container') || book;
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');

let modoTraduccion = false;
let cargandoTraduccion = false;
let paginaActual = 0;

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

// --- 1. NAVEGACIÓN Y AUDIO ---
function playMusic(source) {
    if (!source || audio.src.includes(source)) return;
    audio.src = source;
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

// --- 3. PARTICULAS ---
if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
        particles: {
            number: { value: 50, density: { enable: true, value_area: 800 } },
            color: { value: "#ff4fd8" },
            shape: { type: "circle" },
            opacity: { value: 0.3 },
            size: { value: 2 },
            move: { enable: true, speed: 1 }
        }
    });
}