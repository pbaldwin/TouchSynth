import Distortion from './Distortion';

function delayFactory(context) {
  let delay = context.createDelay(2.0);
  let feedback = context.createGain();
  let output = context.createGain();
  let distortion = Distortion(context, 2);

  delay.delayTime.value = .4;

  let lowPassFilter = context.createBiquadFilter();
  lowPassFilter.type = 'lowpass';
  lowPassFilter.frequency.value = 6000;
  lowPassFilter.Q.value = 1;

  let highPassFilter = context.createBiquadFilter();
  highPassFilter.type = 'highpass';
  highPassFilter.frequency.value = 400;
  highPassFilter.Q.value = 2;

  feedback.gain.value = .5;
  output.gain.value = .5;

  delay.connect(highPassFilter);
  highPassFilter.connect(lowPassFilter);
  lowPassFilter.connect(distortion.input);
  distortion.connect(feedback);
  feedback.connect(delay);
  feedback.connect(output);

  return {
    input: delay,
    connect: (node) => output.connect(node),
    controls: {
      time: (val) => delay.delayTime.value = val,
      feedback: (val) => feedback.gain.value = val,
      level: (val) => output.gain.value = val
    }
  };
}

export default delayFactory;