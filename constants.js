// ゲーム定数
export const GAME_CONFIG = {
    COLS: 10,
    ROWS: 20,
    BLOCK_SIZE: 45,
    INITIAL_DROP_SPEED: 1000,
    LEVEL_SPEED_DECREASE: 100,
    MIN_DROP_SPEED: 100,
    POINTS_PER_LINE: 100,
    LINES_PER_LEVEL: 10
};

// テトリミノの色
export const COLORS = [
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
export const SHAPES = [
    [], // 空
    [[1, 1, 1, 1]], // I
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0]], // S
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]]  // Z
];

// 難易度設定
export const DIFFICULTY_SETTINGS = {
    easy: 1500,
    normal: 1000,
    hard: 500
};

// サウンド周波数設定
export const SOUND_CONFIG = {
    move: { freq: 800, volume: 0.03, duration: 0.08, type: 'sine' },
    rotate: [
        { freq: 600, volume: 0.05, duration: 0.1, type: 'square', delay: 0 },
        { freq: 900, volume: 0.04, duration: 0.08, type: 'square', delay: 30 }
    ],
    drop: [
        { freq: 80, volume: 0.2, duration: 0.08, type: 'sawtooth', delay: 0 },
        { freq: 60, volume: 0.15, duration: 0.12, type: 'triangle', delay: 40 },
        { freq: 200, volume: 0.08, duration: 0.15, type: 'sine', delay: 60 }
    ],
    clear: [523, 659, 784, 1047], // C, E, G, C (上のオクターブ)
    gameover: [523, 494, 440, 392, 349, 294, 262] // C→C (下降)
};

// ローカルストレージキー
export const STORAGE_KEYS = {
    HIGH_SCORE: 'tetris-high-score'
};
