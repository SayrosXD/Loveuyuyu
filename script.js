const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');
const btnTranslate = document.getElementById('btn-translate');
let modoTraduccion = false;

// --- 1. NAVEGACIÓN Y AUDIO ---
pages.forEach((page, index) => {
    // Configuración inicial de profundidad
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', (e) => {
        // SEGURIDAD: Si el clic viene del botón o sus hijos, ignorar navegación del libro
        if (e.target.closest('#btn-translate')) return;

        const rect = page.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // Avanzar (Derecha)
        if (x > width * 0.7 && !page.classList.contains('flipped')) {
            desactivarTraduccionGlobal(); 
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

// --- 2. SISTEMA DE TRADUCCIÓN POR REEMPLAZO (CARPETA /TRADUCCION) ---
btnTranslate.addEventListener('click', (e) => {
    // EVITA que el clic se propague a la página y la voltee
    e.stopPropagation();

    const pageActiva = Array.from(pages).find(p => !p.classList.contains('flipped'));
    if (!pageActiva) return;

    const frontDiv = pageActiva.querySelector('.front');
    
    if (!modoTraduccion) {
        // 1. Obtener el nombre del archivo actual (ej: 'assets/images/inicio.png')
        let currentBg = window.getComputedStyle(frontDiv).backgroundImage;
        // Limpiamos la cadena para obtener solo el nombre del archivo
        let fileName = currentBg.split('/').pop().replace(/[()"\s]/g, '').replace('url', '');
        
        // 2. Mapeo lógico según tus archivos en la carpeta /traduccion
        let cleanName = "";
        if (fileName.includes("inicio")) cleanName = "inicio_traduccion.png";
        else if (fileName.includes("teamo")) cleanName = "teamo_traduccion.png";
        else if (fileName.includes("lisa")) cleanName = "Lisa_traduccion.png"; // Mayúscula según tu lista
        else if (fileName.includes("jennie")) cleanName = "Jennie_traduccion.png"; // Mayúscula según tu lista
        else if (fileName.includes("jisoo")) cleanName = "jisoo_traduccion.png";
        else if (fileName.includes("rose")) cleanName = "rose_traduccion.png";
        else if (fileName.includes("final")) cleanName = "final_traduccion.png";
        else {
            // Si es la carta u otra página sin traducción, no hace nada
            return;
        }

        // 3. Aplicar ruta apuntando a la carpeta /traduccion
        frontDiv.style.backgroundImage = `url('traduccion/${cleanName}')`;
        
        btnTranslate.classList.add('active');
        btnTranslate.querySelector('.text').innerText = "Ver Original";
        modoTraduccion = true;
    } else {
        desactivarTraduccionGlobal();
    }
});

// Función para restaurar las imágenes originales desde assets/images/
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
