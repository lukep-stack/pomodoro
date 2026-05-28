/**
 * Plays a soft 3-note rising chime (C5 → E5 → G5) using the Web Audio API.
 * Designed to be friendly and non-startling: slow attack, long gentle decay.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playNote(ctx: AudioContext, frequency: number, startTime: number, peakGain = 0.18): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, startTime)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(startTime)
  osc.stop(startTime + 2.2)
}

export function playChime(): void {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  playNote(ctx, 523.25, now,        0.16)  // C5
  playNote(ctx, 659.25, now + 0.22, 0.18)  // E5
  playNote(ctx, 783.99, now + 0.44, 0.20)  // G5
}

export function unlockAudio(): void {
  getAudioContext()
}
