const melodies = {
  countdown: [440], go: [440, 660, 880], happy: [740, 990], royal: [660, 880, 1100, 1320],
  storm: [140, 95], chaos: [280, 180, 340], combo: [660, 880, 1320], chaosMode: [220, 330, 440, 660],
  tick: [520], end: [660, 550, 440, 330], record: [523, 659, 784, 1047, 1318],
};
class Sound {
  context = null;
  muted = false;
  unlock() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio && !this.context) this.context = new Audio();
      this.context?.resume().catch(() => {});
    } catch { /* Gameplay remains available without audio. */ }
  }
  play(name) {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const context = this.context;
    (melodies[name] || melodies.happy).forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * .085;
      oscillator.type = name === 'storm' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.09, start + .01);
      gain.gain.exponentialRampToValueAtTime(.001, start + .13);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + .15);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
}
export const sound = new Sound();
