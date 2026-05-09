const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');
let modoTraduccion = false;

// --- 1. NAVEGACIÓN Y AUDIO ---
pages.forEach((page, index) => {
    // Configuración inicial de profundidad
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', (e) => {
        // No pasar página si se hace clic en el botón de traducir
        if (e.target.closest('#btn-translate')) return;

        const rect = page.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // Avanzar (Derecha)
        if (x > width * 0.7 && !page.classList.contains('flipped')) {
            desactivarTraduccionGlobal(); // Resetear traducción al cambiar
            page.classList.add('flipped');
            setTimeout(() => { page.style.zIndex = index + 1; }, 600);
            
            const nextSong = pages[index + 1]?.getAttribute('data-song');
            if (nextSong) playMusic(nextSong);
        } 
        // Retroceder (Izquierda)
        else if (x < width * 0.3 && page.classList.contains('flipped')) {
            desactivarTraduccionGlobal();
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
    audio.play().catch(() => console.log("Interacción requerida"));
}

// --- 2. SISTEMA DE TRADUCCIÓN POR REEMPLAZO ---
btnTranslate.addEventListener('click', () => {
    // Encontrar la página que está actualmente al frente
    const pageActiva = Array.from(pages).find(p => !p.classList.contains('flipped'));
    if (!pageActiva) return;

    const frontDiv = pageActiva.querySelector('.front');
    
    if (!modoTraduccion) {
        // 1. Obtener la ruta actual y extraer solo el nombre del archivo
        let currentBg = window.getComputedStyle(frontDiv).backgroundImage;
        let fullPath = currentBg.slice(5, -2).replace(/"/g, "");
        let fileName = fullPath.split('/').pop();

        // 2. Limpiar el nombre (quitar paréntesis) y añadir el sufijo
        let cleanName = fileName.replace(/\(\d+\)/, "").replace(".png", "_traduccion.png");
        
        // Ajuste manual de mayúsculas para coincidir con tus archivos en la raíz
        if (cleanName.includes("jennie")) cleanName = cleanName.replace("jennie", "Jennie");
        if (cleanName.includes("lisa")) cleanName = cleanName.replace("lisa", "Lisa");

        // 3. Aplicar la nueva imagen desde la RAÍZ
        frontDiv.style.backgroundImage = `url('${cleanName}')`;
        
        btnTranslate.classList.add('active');
        btnTranslate.querySelector('.text').innerText = "Ver Original";
        modoTraduccion = true;
    } else {
        desactivarTraduccionGlobal();
    }
});

// Restaurar imágenes originales a su carpeta assets/images/
function resetImages() {
    const originalImages = [
        'inicio.png', 'teamo(1).png', 'carta(2).png', 'lisa(3).png', 
        'jennie(4).png', 'jisoo(5).png', 'rose(6).png', 'final(7).png'
    ];
    pages.forEach((p, i) => {
        p.querySelector('.front').style.backgroundImage = `url('assets/images/${originalImages[i]}')`;
    });
}

function desactivarTraduccionGlobal() {
    modoTraduccion = false;
    btnTranslate.classList.remove('active');
    btnTranslate.querySelector('.text').innerText = "Traducir página";
    resetImages();
}

// --- 3. PARTICULAS ---
particlesJS("particles-js", {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 1000 } },
        color: { value: ["#ff4fd8", "#ffffff"] },
        shape: { type: ["circle", "star"] },
        opacity: { value: 0.5, random: true },
        size: { value: 2, random: true },
        line_linked: { enable: true, distance: 150, color: "#ff4fd8", opacity: 0.2, width: 1 },
        move: { enable: true, speed: 0.8, direction: "none", out_mode: "out" }
    }
});
