const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');

// --- 1. NAVEGACIÓN CORREGIDA ---
pages.forEach((page, index) => {
    // Establecer z-index inicial
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', (e) => {
        const rect = page.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // AVANZAR (Borde derecho)
        if (x > width * 0.8 && !page.classList.contains('flipped')) {
            page.classList.add('flipped');
            // Bajamos el z-index después de la animación para no bloquear las de abajo
            setTimeout(() => { 
                page.style.zIndex = index + 1; 
            }, 600);
            
            const nextSong = pages[index + 1]?.getAttribute('data-song');
            if (nextSong) playMusic(nextSong);
        } 
        // RETROCEDER (Borde izquierdo)
        else if (x < width * 0.2 && page.classList.contains('flipped')) {
            // SUBIMOS el z-index inmediatamente para que se vea la animación de vuelta
            page.style.zIndex = pages.length + index; 
            page.classList.remove('flipped');
            
            // Re-ajustar z-index de las páginas siguientes para que el mazo se mantenga ordenado
            setTimeout(() => {
                pages.forEach((p, i) => {
                    if (!p.classList.contains('flipped')) {
                        p.style.zIndex = pages.length - i;
                    }
                });
            }, 600);

            const currentSong = page.getAttribute('data-song');
            if (currentSong) playMusic(currentSong);
        }
    });
});

function playMusic(source) {
    if (!source || audio.src.includes(source)) return;
    audio.src = source;
    audio.play().catch(() => console.log("Interacción necesaria"));
}

// --- 2. MOTOR DEL JUEGO (COLISIONES REALES) ---
const board = document.getElementById('tetris-board');
const ROWS = 10; const COLS = 7;
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

function spawnPiece() {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    return { x: 3, r: 0, shape: shape };
}

let currentPiece = spawnPiece();

function initBoard() {
    if(!board) return;
    board.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            div.id = `c-${r}-${c}`;
            if (r >= 3 && r < 8 && c >= 1 && c < 6) {
                if (heartPattern[r-3][c-1]) div.classList.add('target');
            }
            board.appendChild(div);
        }
    }
}

function isValidMove(nextR, nextX, nextShape) {
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
    if(!board) return;
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('filled'));
    grid.forEach((row, r) => row.forEach((val, c) => {
        if (val) document.getElementById(`c-${r}-${c}`).classList.add('filled');
    }));
    currentPiece.shape.forEach((row, r) => row.forEach((val, c) => {
        if (val) {
            let cell = document.getElementById(`c-${currentPiece.r + r}-${currentPiece.x + c}`);
            if (cell) cell.classList.add('filled');
        }
    }));
}

function moveDown() {
    if (isValidMove(currentPiece.r + 1, currentPiece.x, currentPiece.shape)) {
        currentPiece.r++;
    } else {
        currentPiece.shape.forEach((row, r) => row.forEach((val, c) => {
            if (val && currentPiece.r + r >= 0) grid[currentPiece.r + r][currentPiece.x + c] = 1;
        }));
        checkWin();
        currentPiece = spawnPiece();
        if (!isValidMove(currentPiece.r, currentPiece.x, currentPiece.shape)) resetGame();
    }
    draw();
}

function resetGame() {
    grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    currentPiece = spawnPiece();
    document.getElementById('game-msg').innerText = "¡Forma el corazón!";
    draw();
}

function checkWin() {
    let win = true;
    for (let r = 3; r < 8; r++) {
        for (let c = 1; c < 6; c++) {
            if (heartPattern[r-3][c-1] && !grid[r][c]) win = false;
        }
    }
    if (win) document.getElementById('game-msg').innerText = "💖 ¡LO LOGRASTE! 💖";
}

// --- CONTROLES ---
document.getElementById('left-btn').onclick = (e) => { 
    e.stopPropagation(); 
    if (isValidMove(currentPiece.r, currentPiece.x - 1, currentPiece.shape)) { currentPiece.x--; draw(); }
};
document.getElementById('right-btn').onclick = (e) => { 
    e.stopPropagation(); 
    if (isValidMove(currentPiece.r, currentPiece.x + 1, currentPiece.shape)) { currentPiece.x++; draw(); }
};
document.getElementById('down-btn').onclick = (e) => { e.stopPropagation(); moveDown(); };
document.getElementById('rotate-btn').onclick = (e) => {
    e.stopPropagation();
    const newShape = currentPiece.shape[0].map((_, i) => currentPiece.shape.map(row => row[i]).reverse());
    if (isValidMove(currentPiece.r, currentPiece.x, newShape)) { currentPiece.shape = newShape; draw(); }
};
document.getElementById('reset-btn').onclick = (e) => { e.stopPropagation(); resetGame(); };

// --- 3. INICIALIZACIÓN ---
initBoard();
setInterval(moveDown, 1000);
draw(); // Dibujo inicial para evitar tablero vacío al cargar

// --- 4. PARTICULAS (AL FINAL PARA EVITAR BLOQUEOS) ---
if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 80 },
            "color": { "value": "#ffffff" },
            "size": { "value": 1.5 },
            "move": { "enable": true, "speed": 1 }
        }
    });
}
