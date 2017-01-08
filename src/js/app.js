import touchTracker from './touchTracker';
import synth from './synth';

// Cache our DOM nodes
let background = document.getElementById('background');
let title = document.getElementById('title');

// Messages consts
const CLICK = 'Click.';
const DRAG = 'Drag.';
const THANKS = 'Thanks.';

const HUES = [180, 20];

// TODO: Regenerate these numbers on window resize
let width = window.innerWidth;
let height = window.innerHeight;

// Get the middle of our stage
let middle = {
  x: Math.floor(width / 2),
  y: Math.floor(height / 2)
};

// These are the ratios we want to use to get our color values
let ratio = {
  x: 360 / width,
  y: 70 / height
};

// Max and min values of our scale
// Currently C3 - C4
let notes = {
  root: 130.8,
  max: 261.6
};

let noteRatio = (notes.max - notes.root) / width;

// Get our filter frequency range
let filter = {
  min: 50,
  max: 10000
};

let filterRatio = (filter.max - filter.min) / height;

// Handle touchTracker events...
touchTracker.subscribe('pointerdown', handleDown);
touchTracker.subscribe('pointerdrag', handleDrag);
touchTracker.subscribe('pointerup', handleUp);

/**
 * Changes title message on pointer down.
 * @param  {Object} coords { x: `Number`, y: `Number` }
 * @return {undefined}
 */
function handleDown(coords) {
  title.textContent = DRAG;
  handleTouch(coords);
}

/**
 * Changes title message on pointer drag.
 * @param  {Object} coords { x: `Number`, y: `Number` }
 * @return {undefined}
 */
function handleDrag(coords) {
  title.textContent = THANKS;
  handleTouch(coords);
}

/**
 * Changes title message on pointer up.
 * @param  {Object} coords { x: `Number`, y: `Number` }
 * @return {undefined}
 */
function handleUp(coords) {
  title.textContent = CLICK;
  synth.gate.close();
}


/**
 * Changes color and synth changes on pointer down and drag events.
 * @param  {Object} coords { x: `Number`, y: `Number` }
 * @return {undefined}
 */
function handleTouch(coords) {
  let shift = {
    x: Math.floor((coords.x - middle.x) * ratio.x),
    y: Math.floor(100 - (coords.y * ratio.y))
  };

  let gradient = getGradient(shift);

  background.style.backgroundImage = gradient;

  let note = notes.root + (coords.x * noteRatio);
  let filterFreq = filter.max - (coords.y * filterRatio);

  synth.pitch(note);
  synth.filter(filterFreq);
  synth.gate.open(.5);
}

/**
 * Get new gradient CSS
 * @param  {Object} shift { x: `Number`, y: `Number` }
 * @return {String}       CSS Gradient String
 */
function getGradient(shift) {
  let shiftedHues = HUES.map((hue) => hue + shift.x);
  return `linear-gradient(40deg, hsl(${shiftedHues[0]},${shift.y}%,70%), hsl(${shiftedHues[1]},${shift.y}%,70%))`;
}