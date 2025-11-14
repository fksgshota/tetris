// ゲーム定数
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 45;
const COLORS = [
    '#000000', // 空
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// テトリミノの形状定義
const SHAPES = [
    [], // 空
    [[1, 1, 1, 1]], // I
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0]], // S
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]]  // Z
];

// ゲーム状態
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = false;
let gamePaused = false;
let gameInterval = null;
let dropSpeed = 1000;
let soundEnabled = true;

// Canvas要素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

// ボタン要素
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const restartBtn = document.getElementById('restart-btn');
const difficultySelect = document.getElementById('difficulty');
const soundToggle = document.getElementById('sound-toggle');

// スコア表示要素
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const finalScoreElement = document.getElementById('final-score');
const gameOverOverlay = document.getElementById('game-over-overlay');

// モバイルボタン
const mobileLeft = document.getElementById('mobile-left');
const mobileRight = document.getElementById('mobile-right');
const mobileDown = document.getElementById('mobile-down');
const mobileRotate = document.getElementById('mobile-rotate');
const mobileDrop = document.getElementById('mobile-drop');

// ゲーム初期化
function init() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    lines = 0;
    level = 1;
    updateScore();
    loadHighScore();
    setDifficulty();
}

// ボードを描画
function drawBoard() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }
}

// ブロックを描画
function drawBlock(context, x, y, colorIndex) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    
    context.fillStyle = COLORS[colorIndex];
    context.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
    
    // ブロックの境界線
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 2;
    context.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
    
    // ハイライト効果
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(px, py, BLOCK_SIZE / 2, BLOCK_SIZE / 2);
}

// 新しいピースを生成
function createPiece() {
    const typeId = Math.floor(Math.random() * 7) + 1;
    const shape = SHAPES[typeId];
    return {
        shape: shape,
        color: typeId,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

// 次のピースを描画
function drawNextPiece() {
    nextCtx.fillStyle = '#1a1a2e';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!nextPiece) return;
    
    const offsetX = (nextCanvas.width - nextPiece.shape[0].length * BLOCK_SIZE) / 2;
    const offsetY = (nextCanvas.height - nextPiece.shape.length * BLOCK_SIZE) / 2;
    
    for (let row = 0; row < nextPiece.shape.length; row++) {
        for (let col = 0; col < nextPiece.shape[row].length; col++) {
            if (nextPiece.shape[row][col]) {
                const px = offsetX + col * BLOCK_SIZE;
                const py = offsetY + row * BLOCK_SIZE;
                
                nextCtx.fillStyle = COLORS[nextPiece.color];
                nextCtx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
                
                nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                nextCtx.lineWidth = 2;
                nextCtx.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// ゴーストピースの位置を計算
function getGhostPieceY() {
    if (!currentPiece) return 0;
    
    let ghostY = currentPiece.y;
    const ghostPiece = { ...currentPiece, y: ghostY };
    
    while (!isCollision(ghostPiece, 0, 1)) {
        ghostY++;
        ghostPiece.y = ghostY;
    }
    
    return ghostY;
}

// ゴーストピースを描画
function drawGhostPiece() {
    if (!currentPiece) return;
    
    const ghostY = getGhostPieceY();
    
    // 現在のピースと同じ位置なら描画しない
    if (ghostY === currentPiece.y) return;
    
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const px = (currentPiece.x + col) * BLOCK_SIZE;
                const py = (ghostY + row) * BLOCK_SIZE;
                
                // 半透明の影として描画
                ctx.fillStyle = COLORS[currentPiece.color];
                ctx.globalAlpha = 0.2;
                ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
                
                // 点線の境界線
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = COLORS[currentPiece.color];
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0;
            }
        }
    }
}

// 現在のピースを描画
function drawPiece() {
    if (!currentPiece) return;
    
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                drawBlock(ctx, currentPiece.x + col, currentPiece.y + row, currentPiece.color);
            }
        }
    }
}

// 衝突判定
function isCollision(piece, offsetX = 0, offsetY = 0) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const newX = piece.x + col + offsetX;
                const newY = piece.y + row + offsetY;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ピースを固定
function mergePiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

// ピースを回転
function rotate(piece) {
    const newShape = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: newShape };
}

// ラインをクリア
function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // 同じ行を再チェック
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        updateScore();
        playSound('clear');
        
        // レベルアップで速度上昇
        updateGameSpeed();
    }
}

// ゲーム速度を更新
function updateGameSpeed() {
    if (gameInterval) {
        clearInterval(gameInterval);
        dropSpeed = Math.max(100, 1000 - (level - 1) * 100);
        gameInterval = setInterval(gameLoop, dropSpeed);
    }
}

// ピースを下に移動
function moveDown() {
    if (!isCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
        return true;
    } else {
        mergePiece();
        clearLines();
        spawnNewPiece();
        return false;
    }
}

// ピースを左に移動
function moveLeft() {
    if (!isCollision(currentPiece, -1, 0)) {
        currentPiece.x--;
        playSound('move');
    }
}

// ピースを右に移動
function moveRight() {
    if (!isCollision(currentPiece, 1, 0)) {
        currentPiece.x++;
        playSound('move');
    }
}

// ピースを回転
function rotatePiece() {
    const rotated = rotate(currentPiece);
    if (!isCollision(rotated)) {
        currentPiece = rotated;
        playSound('rotate');
    }
}

// ピースを即座に落下
function hardDrop() {
    while (!isCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
        score += 2;
    }
    mergePiece();
    clearLines();
    spawnNewPiece();
    updateScore();
    playSound('drop');
}

// 新しいピースを生成
function spawnNewPiece() {
    if (nextPiece === null) {
        currentPiece = createPiece();
        nextPiece = createPiece();
    } else {
        currentPiece = nextPiece;
        nextPiece = createPiece();
    }
    
    drawNextPiece();
    
    if (isCollision(currentPiece)) {
        gameOver();
    }
}

// ゲームオーバー
function gameOver() {
    gameRunning = false;
    clearInterval(gameInterval);
    finalScoreElement.textContent = score;
    gameOverOverlay.classList.remove('hidden');
    playSound('gameover');
    saveHighScore();
}

// スコアを更新
function updateScore() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// ハイスコアを読み込み
function loadHighScore() {
    const highScore = localStorage.getItem('tetris-high-score') || 0;
    highScoreElement.textContent = highScore;
}

// ハイスコアを保存
function saveHighScore() {
    const currentHighScore = parseInt(localStorage.getItem('tetris-high-score') || 0);
    if (score > currentHighScore) {
        localStorage.setItem('tetris-high-score', score);
        highScoreElement.textContent = score;
    }
}

// 難易度設定
function setDifficulty() {
    const difficulty = difficultySelect.value;
    switch (difficulty) {
        case 'easy':
            dropSpeed = 1500;
            break;
        case 'normal':
            dropSpeed = 1000;
            break;
        case 'hard':
            dropSpeed = 500;
            break;
    }
}

// 効果音再生 (Web Audio APIを使用したかっこいい音)
function playSound(type) {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    switch (type) {
        case 'move':
            // シンプルなクリック音
            playTone(audioContext, 800, 0.03, 0.08, 'sine');
            break;
            
        case 'rotate':
            // 二重音の回転音
            playTone(audioContext, 600, 0.05, 0.1, 'square');
            setTimeout(() => playTone(audioContext, 900, 0.04, 0.08, 'square'), 30);
            break;
            
        case 'drop':
            // よりインパクトのある着地音
            playTone(audioContext, 80, 0.2, 0.08, 'sawtooth');
            setTimeout(() => playTone(audioContext, 60, 0.15, 0.12, 'triangle'), 40);
            // 余韻の音
            setTimeout(() => playTone(audioContext, 200, 0.08, 0.15, 'sine'), 60);
            break;
            
        case 'clear':
            // 華やかなライン消去音（上昇音階）
            const clearNotes = [523, 659, 784, 1047]; // C, E, G, C (上のオクターブ)
            clearNotes.forEach((freq, i) => {
                setTimeout(() => playTone(audioContext, freq, 0.15, 0.08, 'sine'), i * 50);
            });
            break;
            
        case 'gameover':
            // ドラマチックな下降音
            const gameOverNotes = [523, 494, 440, 392, 349, 294, 262]; // C→C (下降)
            gameOverNotes.forEach((freq, i) => {
                setTimeout(() => playTone(audioContext, freq, 0.2, 0.15, 'triangle'), i * 80);
            });
            break;
    }
}

// トーンを再生するヘルパー関数
function playTone(audioContext, frequency, volume, duration, waveType = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = waveType;
    oscillator.frequency.value = frequency;
    
    // エンベロープ（音量の時間変化）
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// ゲームループ
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    moveDown();
    drawBoard();
    drawGhostPiece();
    drawPiece();
}

// ゲーム開始
function startGame() {
    if (gameRunning && !gamePaused) return;
    
    if (!gameRunning) {
        init();
        spawnNewPiece();
    }
    
    gameRunning = true;
    gamePaused = false;
    gameOverOverlay.classList.add('hidden');
    
    setDifficulty();
    gameInterval = setInterval(gameLoop, dropSpeed);
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    difficultySelect.disabled = true;
}

// ゲーム一時停止
function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? '再開' : '一時停止';
    
    if (!gamePaused) {
        gameInterval = setInterval(gameLoop, dropSpeed);
    } else {
        clearInterval(gameInterval);
    }
}

// ゲームリセット
function resetGame() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(gameInterval);
    
    init();
    drawBoard();
    
    nextPiece = null;
    currentPiece = null;
    nextCtx.fillStyle = '#1a1a2e';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    gameOverOverlay.classList.add('hidden');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '一時停止';
    difficultySelect.disabled = false;
}

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveDown();
            score += 1;
            updateScore();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
    
    drawBoard();
    drawGhostPiece();
    drawPiece();
});

// ボタンイベント
startBtn.addEventListener('click', () => {
    startGame();
    closeMobileMenu();
});
pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', () => {
    resetGame();
    closeMobileMenu();
});
restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
    closeMobileMenu();
});

soundToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
});

// モバイルボタンイベント
mobileLeft.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        moveLeft();
        drawBoard();
        drawGhostPiece();
        drawPiece();
    }
});

mobileRight.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        moveRight();
        drawBoard();
        drawGhostPiece();
        drawPiece();
    }
});

mobileDown.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        moveDown();
        score += 1;
        updateScore();
        drawBoard();
        drawGhostPiece();
        drawPiece();
    }
});

mobileRotate.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        rotatePiece();
        drawBoard();
        drawGhostPiece();
        drawPiece();
    }
});

mobileDrop.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        hardDrop();
        drawBoard();
        drawGhostPiece();
        drawPiece();
    }
});

// モバイルメニュートグル
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        const rightPanel = document.querySelector('.right-panel');
        rightPanel.classList.toggle('menu-open');
        mobileMenuToggle.textContent = rightPanel.classList.contains('menu-open') ? '✕' : '☰';
    });
}

// メニューを閉じる関数
function closeMobileMenu() {
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel && rightPanel.classList.contains('menu-open')) {
        rightPanel.classList.remove('menu-open');
        if (mobileMenuToggle) {
            mobileMenuToggle.textContent = '☰';
        }
    }
}

// ボタンイベント
startBtn.addEventListener('click', () => {
    startGame();
    closeMobileMenu();
});
pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', () => {
    resetGame();
    closeMobileMenu();
});
restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
    closeMobileMenu();
});
