import Delay from './delay';

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let lowPassFilter = audioCtx.createBiquadFilter();
let delay = Delay(audioCtx);

lowPassFilter.type = 'lowpass';
lowPassFilter.frequency.value = 500;
lowPassFilter.Q.value = 5;

// TODO: Make oscilator generation part of the synth initialization.
let oscillator1 = audioCtx.createOscillator();

oscillator1.type = 'sawtooth';
oscillator1.frequency.value = 261.6;

let oscillator2 = audioCtx.createOscillator();

oscillator2.type = 'triangle';
oscillator2.frequency.value = 261.6;
oscillator2.detune.value = 10;

let gainNode = audioCtx.createGain();

gainNode.gain.value = 0;

oscillator1.connect(lowPassFilter);
oscillator2.connect(lowPassFilter);

lowPassFilter.connect(gainNode);

gainNode.connect(audioCtx.destination);
gainNode.connect(delay.input);
delay.connect(audioCtx.destination);

// Release is null until we make it an interval
let release = null;

let synth = {
  /**
   * Set lowpass filter frequency
   * @param  {Number} freq New lowpass filter frequency
   * @return {undefined}
   */
  filter: (freq) => lowPassFilter.frequency.value = freq,
  /**
   * Set oscillator frequencies to `freq`
   * @param  {Number} freq New oscillator frequency
   * @return {undefined}
   */
  pitch: (freq) => {
    oscillator1.frequency.value = freq;
    oscillator2.frequency.value = freq * 2;
  },
  gate: {
    /**
     * Open synth gate to given level.
     * @param  {Number} level Number between 0 and 1
     * @return {undefined}
     */
    open: (level) => {
      if (release) clearInterval(release);
      gainNode.gain.value = level;
    },
    // TODO: Gate release should be set by an ADSR
    close: () => {
      release = setInterval(() => {
        gainNode.gain.value -= .02;
        if (gainNode.gain.value <= 0) {
          gainNode.gain.value = 0;
          clearInterval(release);
        }
      }, 15);
    }
  }
};

// iOS requires us to start the synth as a result of a user action...
document.addEventListener('mousedown', initializeSynth);
document.addEventListener('touchstart', initializeSynth);

function initializeSynth() {
  oscillator1.start();
  oscillator2.start();
  document.removeEventListener('mousedown', initializeSynth);
  document.removeEventListener('touchstart', initializeSynth);
}

export default synth;
