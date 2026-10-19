export class AudioController {
  private audio: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private isPlaying = false;
  private isInitialized = false;
  private animId: number | null = null;
  private onBeatUpdate?: (bassIntensity: number) => void;

  // DOM Elements
  private musicTile: HTMLElement | null = null;
  private vinylDisc: HTMLElement | null = null;
  private playPauseIcon: HTMLElement | null = null;
  private musicTag: HTMLElement | null = null;
  private eqBars: NodeListOf<HTMLElement> | null = null;

  constructor(src = '/audio/cyber-beat.mp3', onBeatUpdate?: (bassIntensity: number) => void) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = 0.55;
    this.onBeatUpdate = onBeatUpdate;

    this.initDOM();
  }

  private initDOM() {
    this.musicTile = document.querySelector('.bento-music');
    this.vinylDisc = document.querySelector('.vinyl-disc');
    this.playPauseIcon = document.querySelector('.play-pause-icon');
    this.musicTag = document.querySelector('.music-tag');
    this.eqBars = document.querySelectorAll('.eq-bar');

    if (this.musicTile) {
      this.musicTile.style.cursor = 'pointer';
      this.musicTile.addEventListener('click', () => this.toggle());
    }
  }

  private initAudioContext() {
    if (this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64; // 32 frequency bins, ultra lightweight
      this.analyser.smoothingTimeConstant = 0.82;

      const source = this.audioCtx.createMediaElementSource(this.audio);

      // 1. Anti-Hiss Low-Pass Filter: rolls off harsh high-frequency tape hiss / vinyl crackle above 9kHz
      const hissFilter = this.audioCtx.createBiquadFilter();
      hissFilter.type = 'lowpass';
      hissFilter.frequency.value = 9200;
      hissFilter.Q.value = 0.7; // Smooth Butterworth roll-off

      // 2. Dynamics Compressor: prevents harsh peak transients and clipping distortion
      const compressor = this.audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 24;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      // 3. Dedicated Master Gain: ensures clean digital headroom, preventing audio buffer distortion
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.value = 0.5;

      // Routing: Source -> Analyser -> HissFilter -> Compressor -> MasterGain -> Destination
      source.connect(this.analyser);
      this.analyser.connect(hissFilter);
      hissFilter.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(this.audioCtx.destination);

      this.dataArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.isInitialized = true;
    } catch (err) {
      console.warn('AudioContext initialization failed or blocked:', err);
    }
  }

  public async toggle() {
    this.initAudioContext();

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updateUI(true);
      this.startAnalyserLoop();
    }).catch((err) => {
      console.warn('Autoplay error:', err);
    });
  }

  public pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updateUI(false);
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    // Reset EQ bars and beat intensity
    if (this.eqBars) {
      this.eqBars.forEach((bar) => {
        bar.style.height = '4px';
      });
    }
    if (this.onBeatUpdate) {
      this.onBeatUpdate(0);
    }
  }

  private updateUI(playing: boolean) {
    if (this.vinylDisc) {
      if (playing) {
        this.vinylDisc.classList.add('is-playing');
      } else {
        this.vinylDisc.classList.remove('is-playing');
      }
    }

    if (this.musicTag) {
      this.musicTag.textContent = playing ? 'NOW PLAYING 🎧' : 'CLICK TO PLAY ▶';
      this.musicTag.style.color = playing ? 'var(--neon-mint)' : 'var(--neon-cyan)';
    }

    if (this.playPauseIcon) {
      this.playPauseIcon.innerHTML = playing ? '❚❚' : '▶';
    }
  }

  private startAnalyserLoop() {
    const loop = () => {
      if (!this.isPlaying) return;

      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);

        // Map live frequencies to the 4 equalizer bars
        // Low bass (bin 1-2), punch bass (bin 3-4), mids (bin 6-8), highs (bin 12-16)
        const b0 = this.dataArray[1] || 0;
        const b1 = this.dataArray[3] || 0;
        const b2 = this.dataArray[7] || 0;
        const b3 = this.dataArray[14] || 0;

        if (this.eqBars && this.eqBars.length >= 4) {
          const h0 = Math.max(4, Math.floor((b0 / 255) * 18));
          const h1 = Math.max(4, Math.floor((b1 / 255) * 20));
          const h2 = Math.max(4, Math.floor((b2 / 255) * 17));
          const h3 = Math.max(4, Math.floor((b3 / 255) * 15));

          this.eqBars[0].style.height = `${h0}px`;
          this.eqBars[1].style.height = `${h1}px`;
          this.eqBars[2].style.height = `${h2}px`;
          this.eqBars[3].style.height = `${h3}px`;
        }

        // Bass kick intensity for background canvas pulse (0.0 to 1.0)
        if (this.onBeatUpdate) {
          const rawBass = ((b0 + b1) / (2 * 255));
          // Apply a non-linear threshold so only real kicks flare the canvas
          const beatPower = rawBass > 0.45 ? Math.pow((rawBass - 0.45) / 0.55, 1.5) : 0;
          this.onBeatUpdate(beatPower);
        }
      }

      this.animId = requestAnimationFrame(loop);
    };

    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame(loop);
  }
}
