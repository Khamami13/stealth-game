// Whisper Vault — sound, all synthesised. One file, one job: every beep
// and footstep comes from WebAudio oscillators, so the game needs no audio
// files and makes no network request. Sound starts on the first gesture,
// as browsers require.
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastGuardStep: 0,
    lastPlayerStep: 0,
  };
  return audio;
}

export function ensureAudio(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audio.ctx = new Ctx();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.5;
  audio.master.connect(audio.ctx.destination);
}

function tone(audio, freq, seconds, type, volume, when = 0, slideTo = 0) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime + when;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

// A soft step, panned left/right by where the walker is relative to the
// thief and quieter the further away: footsteps tell you where a warden is.
function step(audio, pan, volume) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  const panner = audio.ctx.createStereoPanner();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(95, t0);
  osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.07);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  osc.connect(gain);
  gain.connect(panner);
  panner.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + 0.1);
}

export function playPlayerStep(audio, sneaking) {
  if (!audio.ctx || audio.muted || sneaking) return;
  const now = audio.ctx.currentTime;
  if (now - audio.lastPlayerStep < 0.34) return;
  audio.lastPlayerStep = now;
  step(audio, 0, 0.05);
}

// Each warden's steps, heard through the dark: nearer means louder.
export function playGuardSteps(audio, guards, player) {
  if (!audio.ctx || audio.muted) return;
  const now = audio.ctx.currentTime;
  if (now - audio.lastGuardStep < 0.42) return;
  let nearest = null;
  let nearestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - player.x, g.y - player.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = g;
    }
  }
  if (!nearest || nearestDist > 560) return;
  audio.lastGuardStep = now;
  const pan = (nearest.x - player.x) / 560;
  const volume = 0.11 * (1 - nearestDist / 560) + 0.015;
  step(audio, pan, volume);
}

export function playPickup(audio) {
  tone(audio, 880, 0.12, 'sine', 0.16);
  tone(audio, 1318, 0.18, 'sine', 0.12, 0.07);
}

export function playSuspicious(audio) {
  tone(audio, 330, 0.16, 'triangle', 0.14, 0, 415);
}

export function playAlarm(audio) {
  tone(audio, 196, 0.22, 'sawtooth', 0.16, 0, 392);
  tone(audio, 196, 0.22, 'sawtooth', 0.16, 0.24, 392);
}

export function playCaught(audio) {
  tone(audio, 220, 0.4, 'sawtooth', 0.18, 0, 55);
  tone(audio, 110, 0.5, 'triangle', 0.16, 0.1, 40);
}

export function playLevelClear(audio) {
  [523, 659, 784, 1047].forEach((f, i) => tone(audio, f, 0.22, 'sine', 0.14, i * 0.11));
}

export function playWin(audio) {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(audio, f, 0.3, 'sine', 0.14, i * 0.13));
}
