import { SOUND_CONFIG } from './constants.js';

/**
 * サウンド管理クラス
 */
export class SoundManager {
    constructor() {
        this.enabled = true;
    }

    /**
     * サウンドの有効/無効を設定
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * トーンを再生
     */
    playTone(frequency, volume, duration, waveType = 'sine', delay = 0) {
        if (!this.enabled) return;

        setTimeout(() => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        }, delay);
    }

    /**
     * 効果音を再生
     */
    play(type) {
        if (!this.enabled) return;

        const config = SOUND_CONFIG[type];

        if (!config) return;

        switch (type) {
            case 'move':
            case 'rotate':
            case 'drop':
                if (Array.isArray(config)) {
                    config.forEach(({ freq, volume, duration, type: waveType, delay }) => {
                        this.playTone(freq, volume, duration, waveType, delay);
                    });
                } else {
                    const { freq, volume, duration, type: waveType } = config;
                    this.playTone(freq, volume, duration, waveType);
                }
                break;

            case 'clear':
                config.forEach((freq, i) => {
                    this.playTone(freq, 0.15, 0.08, 'sine', i * 50);
                });
                break;

            case 'gameover':
                config.forEach((freq, i) => {
                    this.playTone(freq, 0.2, 0.15, 'triangle', i * 80);
                });
                break;
        }
    }
}
