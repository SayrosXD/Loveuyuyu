const pages = document.querySelectorAll('.page');
const audio = document.getElementById('bg-music');

// --- NAVEGACIÓN PRECISA POR BORDES ---
pages.forEach((page, index) => {
    page.style.zIndex = pages.length - index;

    page.addEventListener('click', (e) => {
        const rect = page.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // Borde derecho (20% final) para avanzar
        if (x > width * 0.8 && !page.classList.contains('flipped')) {
            page.classList.add('flipped');
            setTimeout(() => { page.style.zIndex = index + 1; }, 600);
            playMusic(pages[index + 1]?.getAttribute('data-song'));
        } 
        // Borde izquierdo (20% inicial) para retroceder
        else if (x < width * 0.2 && page.classList.contains('flipped')) {
            page.classList.remove('flipped');
            page.style.zIndex = pages.length - index;
            playMusic(pages[index]?.getAttribute('data-song'));
        }
    });
});

function playMusic(source) {
    if (!source || audio.src.includes(source)) return;
    audio.src = source;
    audio.play().catch(() => console.log("Interacción requerida"));
}

// --- LÓGICA DEL JUEGO TETRIS HEART ---
const board = document.getElementById('tetris-board');
const ROWS = 10; const COLS = 7;
let grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));

// Patrón corazón (5x5 dentro de la rejilla)
const heartPattern = [
    [0,1,0,1,0],
    [1,1,1,1,1],
    [1,1,1,1,1],
    [0,1,1,1,0],
    [0,0,1,0,0]
];

function initBoard() {
    board.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            div.id = `c-${r}-${c}`;
            // Guía visual del corazón
            if (r >= 3 && r < 8 && c >= 1 && c < 6) {
                if (heartPattern[r-3][c-1]) div.classList.add('target');
            }
            board.appendChild(div);
        }
    }
}

let currentPiece = { x: 3, r: 0, shape: [[1,1],[1,1]] };

function draw() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('filled'));
    grid.forEach((row, r) => row.forEach((val, c) => {
        if (val) document.getElementById(`c-${r}-${c}`).classList.add('filled');
    }));
    currentPiece.shape.forEach((row, r) => row.forEach((val, c) => {
        if (val) {
            let target = document.getElementById(`c-${currentPiece.r + r}-${currentPiece.x + c}`);
            if (target) target.classList.add('filled');
        }
    }));
}

function moveDown() {
    if (currentPiece.r + 2 < ROWS) {
        currentPiece.r++;
    } else {
        // Fijar y resetear
        currentPiece.shape.forEach((row, r) => row.forEach((val, c) => {
            if (val) grid[currentPiece.r + r][currentPiece.x + c] = 1;
        }));
        checkWin();
        currentPiece = { x: 3, r: 0, shape: [[1,1],[1,1]] };
    }
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

// Controladores con stopPropagation para no pasar página al jugar
document.getElementById('left-btn').onclick = (e) => { e.stopPropagation(); if (currentPiece.x > 0) currentPiece.x--; draw(); };
document.getElementById('right-btn').onclick = (e) => { e.stopPropagation(); if (currentPiece.x < COLS-2) currentPiece.x++; draw(); };
document.getElementById('down-btn').onclick = (e) => { e.stopPropagation(); moveDown(); };

initBoard();
setInterval(moveDown, 1000);

// Partículas
particlesJS("particles-js", { "particles": { "number": { "value": 100 }, "move": { "speed": 1 } } });
