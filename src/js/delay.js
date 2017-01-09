function delayFactory(context) {
  let delay = context.createDelay(2.0);
  let filter = context.createBiquadFilter();
  let feedback = context.createGain();
  let output = context.createGain();

  delay.delayTime.value = .4;
  filter.frequency.value = 6000;
  feedback.gain.value = .5;
  output.gain.value = .5;

  delay.connect(filter);
  filter.connect(feedback);
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