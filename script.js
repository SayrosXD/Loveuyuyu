const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');
let modoTraduccion = false;

// Array con los nombres originales exactos para la restauración
const originalImages = [
    'inicio.png', 'teamo(1).png', 'carta(2).png', 'lisa(3).png', 
    'jennie(4).png', 'jisoo(5).png', 'rose(6).png', 'final(7).png'
];

// --- 1. NAVEGACIÓN Y AUDIO ---
pages.forEach((page, index) => {
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', (e) => {
        if (e.target.closest('#btn-translate')) return;

        const rect = page.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        if (x > width * 0.7 && !page.classList.contains('flipped')) {
            if (modoTraduccion) desactivarTraduccionGlobal();
            page.classList.add('flipped');
            setTimeout(() => { page.style.zIndex = index + 1; }, 600);
            const nextSong = pages[index + 1]?.getAttribute('data-song');
            if (nextSong) playMusic(nextSong);
        } 
        else if (x < width * 0.3 && page.classList.contains('flipped')) {
            if (modoTraduccion) desactivarTraduccionGlobal();
            page.classList.remove('flipped');
            page.style.zIndex = pages.length - index;
            const currentSong = page.getAttribute('data-song');
            if (currentSong) playMusic(currentSong);
        }
    });
});

function playMusic(source) {
    if (!source || audio.src.includes(source)) return;
    audio.src = source;
    audio.loop = true;
    audio.play().catch(() => console.log("Audio en espera"));
}

// --- 2. SISTEMA DE TRADUCCIÓN DINÁMICO ---
btnTranslate.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const pageActiva = Array.from(pages).find(p => !p.classList.contains('flipped'));
    if (!pageActiva) return;

    const indexPage = Array.from(pages).indexOf(pageActiva);
    const frontDiv = pageActiva.querySelector('.front');

    if (!modoTraduccion) {
        // LÓGICA DINÁMICA: 
        // 1. Tomamos el nombre base del array original (ej: 'jennie(4).png')
        let originalName = originalImages[indexPage];
        
        // 2. Quitamos paréntesis y números para coincidir con tus archivos de traducción
        // 'jennie(4).png' -> 'jennie_traduccion.png'
        let tradName = originalName.replace(/\(\d+\)/, "").replace(".png", "_traduccion.png");

        // 3. Casos especiales de mayúsculas (Jennie y Lisa)
        if (tradName.includes("jennie")) tradName = tradName.replace("jennie", "Jennie");
        if (tradName.includes("lisa")) tradName = tradName.replace("lisa", "Lisa");

        // Aplicamos la ruta de la carpeta /traduccion
        frontDiv.style.backgroundImage = `url('traduccion/${tradName}')`;
        
        btnTranslate.querySelector('.text').innerText = "Ver Original";
        btnTranslate.style.background = "#ff4fd8";
        btnTranslate.style.color = "#000";
        modoTraduccion = true;
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
