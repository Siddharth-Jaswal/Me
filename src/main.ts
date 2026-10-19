import './style.css';
import { NeuralBackground } from './neural-canvas';
import { AudioController } from './audio-controller';
import { initTerminal } from './terminal-controller';
import { initProjects } from './projects-controller';

const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
let bg: NeuralBackground | null = null;

if (canvas) {
  bg = new NeuralBackground(canvas);
  (window as unknown as { neuralBg: NeuralBackground }).neuralBg = bg;
}

// Audio Player with Beat-Reactive Background Synapses
const audioController = new AudioController('/audio/cyber-beat.mp3', (bassIntensity) => {
  if (bg) {
    bg.setBeatIntensity(bassIntensity);
  }
});

(window as unknown as { audioCtrl: AudioController }).audioCtrl = audioController;

// Interactive Micro-Terminal
initTerminal();

// Interactive Projects Master Holo-Deck
initProjects();

// 3D Interactive Card Tilt for Bento Deck
const tiles = document.querySelectorAll<HTMLElement>('.bento-tile');
tiles.forEach((tile) => {
  tile.addEventListener('mousemove', (e) => {
    const rect = tile.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    tile.style.setProperty('--mouse-x', `${x}px`);
    tile.style.setProperty('--mouse-y', `${y}px`);
    tile.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
  });

  tile.addEventListener('mouseleave', () => {
    tile.style.transform = '';
  });
});
