// function makeDistortionCurve( amount = 50 ) {
//   let n_samples = 44100;
//   let curve = new Float32Array(n_samples);
//   let deg = Math.PI / 180;
//   let x;
//   for ( let i = 0; i < n_samples; ++i ) {
//     x = i * 2 / n_samples - 1;
//     curve[i] = ( 3 + amount ) * x * 20 * deg / ( Math.PI + amount * Math.abs(x) );
//   }
//   return curve;
// }

function makeDistortionCurve( amount = 50 ) {
  let length = 44100;
  let curve = new Float32Array(length);
  let step = 2/(length - 1);

  for (let i = 0; i < length; i++) {
    curve[i] = Math.tanh((Math.PI / 2) * amount * ((i * step) -1));
  }

  return curve;
}

function makeDistortion(context, amount) {
  let distortionNode = context.createWaveShaper();
  distortionNode.curve = makeDistortionCurve(amount);

  let filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 6000;

  let input = context.createGain();
  input.gain.value = .4;

  let output = context.createGain();
  output.gain.value = .5;

  input.connect(distortionNode);
  distortionNode.connect(filter);
  filter.connect(output);

  return {
    input,
    connect: (node) => output.connect(node),
    controls: {
      distortion: (val) => input.gain.value = val,
      level: (val) => output.gain.value = val
    }
  };
}

export default makeDistortion;