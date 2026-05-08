// --- 1. CONFIGURACIÓN DE PARTÍCULAS (AL PRINCIPIO) ---
function initParticles() {
    if (window.particlesJS) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 80 },
                "color": { "value": "#ffffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5 },
                "size": { "value": 1.5 },
                "move": { "enable": true, "speed": 1 }
            }
        });
    }
}

const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');

// --- 2. NAVEGACIÓN DEL LIBRO (LÓGICA MEJORADA) ---
pages.forEach((page, index) => {
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', (e) => {
        // Si el clic viene de un botón del juego, NO pasar página
        if (e.target.tagName === 'BUTTON') return;

        const rect = page.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // AVANZAR
        if (x > width * 0.75 && !page.classList.contains('flipped')) {
            page.classList.add('flipped');
            setTimeout(() => { 
                page.style.zIndex = index + 1; 
            }, 500);
            playMusic(pages[index + 1]?.getAttribute('data-song'));
        } 
        // RETROCEDER
        else if (x < width * 0.25 && page.classList.contains('flipped')) {
            page.style.zIndex = pages.length + index; // Sube para que la animación se vea
            page.classList.remove('flipped');
            
            // Re-organizar z-index al terminar la vuelta
            setTimeout(() => {
                pages.forEach((p, i) => {
                    if (!p.classList.contains('flipped')) {
                        p.style.zIndex = pages.length - i;
                    }
                });
            }, 500);
            
            const currentSong = page.getAttribute('data-song');
            playMusic(currentSong);
        }
    });
});

function playMusic(source) {
    if (!source || audio.src.includes(source)) return;
    audio.src = source;
    audio.play().catch(err => console.log("Esperando interacción..."));
}

// --- 3. MOTOR DEL JUEGO (ESTRUCTURA ROBUSTA) ---
const board = document.getElementById('tetris-board');
const msgDisplay = document.getElementById('game-msg');
const ROWS = 10;
const COLS = 7;
let grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));

const shapes = [
    [[1]], 
    [[1, 1]], 
    [[1], [1]], 
    [[1, 1], [1, 1]]
];

const heartPattern = [
    [0,1,0,1,0],
    [1,1,1,1,1],
    [1,1,1,1,1],
    [0,1,1,1,0],
    [0,0,1,0,0]
];

let currentPiece = spawnPiece();

function spawnPiece() {
    return {
        x: 2,
        r: 0,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
    };
}

function initBoard() {
    if (!board) return;
    board.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            div.id = `c-${r}-${c}`;
            // Guía visual
            if (r >= 3 && r < 8 && c >= 1 && c < 6) {
                if (heartPattern[r-3][c-1]) div.classList.add('target');
            }
            board.appendChild(div);
        }
    }
}

function isValid(nextR, nextX, nextShape) {
    for (let r = 0; r < nextShape.length; r++) {
        for (let c = 0; c < nextShape[r].length; c++) {
            if (nextShape[r][c]) {
                let nR = nextR + r;
                let nX = nextX + c;
                if (nX < 0 || nX >= COLS || nR >= ROWS) return false;
                if (nR >= 0 && grid[nR][nX]) return false;
            }
        }
    }
    return true;
}

function draw() {
    if (!board) return;
    // Limpiar
    const cells = board.getElementsByClassName('cell');
    for (let cell of cells) cell.classList.remove('filled');

    // Grid fijo
    grid.forEach((row, r) => row.forEach((val, c) => {
        if (val) document.getElementById(`c-${r}-${c}`).classList.add('filled');
    }));

    // Pieza móvil
    currentPiece.shape.forEach((row, r) => row.forEach((val, c) => {
        if (val) {
            const cell = document.getElementById(`c-${currentPiece.r + r}-${currentPiece.x + c}`);
            if (cell) cell.classList.add('filled');
        }
    }));
}

function gameLoop() {
    if (isValid(currentPiece.r + 1, currentPiece.x, currentPiece.shape)) {
        currentPiece.r++;
    } else {
        // Colisión detectada: fijar pieza
        currentPiece.shape.forEach((row, r) => row.forEach((val, c) => {
            if (val && currentPiece.r + r >= 0) {
                grid[currentPiece.r + r][currentPiece.x + c] = 1;
            }
        }));
        checkWin();
        currentPiece = spawnPiece();
        if (!isValid(currentPiece.r, currentPiece.x, currentPiece.shape)) {
            resetGame();
        }
    }
    draw();
}

function resetGame() {
    grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    currentPiece = spawnPiece();
    if(msgDisplay) msgDisplay.innerText = "¡Forma el corazón!";
    draw();
}

function checkWin() {
    let win = true;
    for (let r = 3; r < 8; r++) {
        for (let c = 1; c < 6; c++) {
            if (heartPattern[r-3][c-1] && !grid[r][c]) win = false;
        }
    }
    if (win && msgDisplay) {
        msgDisplay.innerText = "💖 ¡LO LOGRASTE! 💖";
        msgDisplay.style.color = "#ff85a1";
    }
}

// --- 4. CONTROLES (CORREGIDOS) ---
document.getElementById('left-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (isValid(currentPiece.r, currentPiece.x - 1, currentPiece.shape)) {
        currentPiece.x--; draw();
    }
});

document.getElementById('right-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (isValid(currentPiece.r, currentPiece.x + 1, currentPiece.shape)) {
        currentPiece.x++; draw();
    }
});

document.getElementById('rotate-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const newShape = currentPiece.shape[0].map((_, i) => currentPiece.shape.map(row => row[i]).reverse());
    if (isValid(currentPiece.r, currentPiece.x, newShape)) {
        currentPiece.shape = newShape; draw();
    }
});

document.getElementById('down-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    gameLoop();
});

document.getElementById('reset-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    resetGame();
});

// --- 5. INICIALIZACIÓN FINAL ---
window.onload = () => {
    initParticles();
    initBoard();
    setInterval(gameLoop, 1000);
    draw();
};
