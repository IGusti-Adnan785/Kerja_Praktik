export default class AudioController {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.bgmMenu = document.getElementById("audio-menu");
    this.bgmSore = document.getElementById("audio-sore");
    this.bgmDingin = document.getElementById("audio-dingin");
    this.toggleBtn = document.getElementById("musicToggle");

    this.isPlaying = false;
    this.currentState = "MENU";
    this.currentTheme = "WARM";

    this.toggleBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleMusic();
    };
    this.gunBuffer = this.createNoiseBuffer();
  }

  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  toggleMusic() {
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.isPlaying = !this.isPlaying;
    this.updateTrackState();
  }

  updateTrackState() {
    if (this.isPlaying) {
      this.toggleBtn.innerText = "🔊";
      if (this.currentState === "MENU") {
        this.bgmMenu.play().catch(() => {});
        this.bgmSore.pause();
        this.bgmSore.currentTime = 0;
        this.bgmDingin.pause();
        this.bgmDingin.currentTime = 0;
      } else if (this.currentState === "GAME") {
        this.bgmMenu.pause();
        this.bgmMenu.currentTime = 0;
        if (this.currentTheme === "WARM") {
          this.bgmSore.play().catch(() => {});
          this.bgmDingin.pause();
        } else {
          this.bgmDingin.play().catch(() => {});
          this.bgmSore.pause();
        }
      }
    } else {
      this.toggleBtn.innerText = "🔇";
      this.bgmMenu.pause();
      this.bgmSore.pause();
      this.bgmDingin.pause();
    }
  }

  playMenuMode() {
    this.currentState = "MENU";
    if (!this.isPlaying) {
      this.isPlaying = true;
    }
    this.updateTrackState();
  }

  playGameMode(theme) {
    this.currentState = "GAME";
    this.currentTheme = theme;
    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.ctx.state === "suspended") this.ctx.resume();
    }
    this.updateTrackState();
  }

  playGunShot() {
    if (this.ctx.state === "suspended") this.ctx.resume();
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.gunBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    const env = this.ctx.createGain();
    noise.connect(filter);
    filter.connect(env);
    env.connect(this.ctx.destination);
    const t = this.ctx.currentTime;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  playHitSound() {
    if (this.ctx.state === "suspended") this.ctx.resume();
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1200,
      this.ctx.currentTime + 0.1,
    );
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}
