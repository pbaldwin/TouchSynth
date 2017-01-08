import pubsub from './lib/pubsub';
import onResize from './lib/onResize';

let xy = Object.create(pubsub);

// Cache window height and width
let dimensions = getDimensions(window.innerWidth, window.innerHeight);

onResize((w, h) => dimensions = getDimensions(w, h));

function getDimensions(width, height) {
  return {
    width,
    height,
    ratio: {
      x: 100 / width,
      y: 100 / height
    }
  };
}

document.body.addEventListener('mousedown', dispatchDown, false);
document.body.addEventListener('mouseup', dispatchUp, false);

document.body.addEventListener('touchstart', dispatchTouchDown, { passive: false });
document.body.addEventListener('touchend', dispatchTouchEnd, { passive: false });

// Handle click events
function dispatchDown(e) {
  document.body.addEventListener('mousemove', dispatchDrag, false);
  xy.publish('pointerdown', coordinates(e));
  e.preventDefault();
}

function dispatchDrag(e) {
  xy.publish('pointerdrag', coordinates(e));
  e.preventDefault();
}

function dispatchUp(e) {
  document.body.removeEventListener('mousemove', dispatchDrag, false);
  xy.publish('pointerup', coordinates(e));
}

// Handle Touch Events
let lastTouch = null;

function dispatchTouchDown(e) {
  lastTouch = e.touches[0];
  document.body.addEventListener('touchmove', dispatchTouchDrag, { passive: false });
  xy.publish('pointerdown', coordinates(lastTouch));
  e.preventDefault();
}

function dispatchTouchDrag(e) {
  lastTouch = e.touches[0];
  xy.publish('pointerdrag', coordinates(lastTouch));
  e.preventDefault();
}

function dispatchTouchEnd(e) {
  document.body.removeEventListener('touchmove', dispatchTouchDrag, { passive: false });
  xy.publish('pointerup', coordinates(lastTouch));
  e.preventDefault();
}

/**
 * Get normalized xy coordinate values between 0 and 100
 * @param  {Object} o clientX and clientY pointer event values.
 * @return {Object}   Normalized xy coordinates
 */
function coordinates(o) {
  return {
    x: o.clientX * dimensions.ratio.x,
    y: 100 - (o.clientY * dimensions.ratio.y)
  };
}

export default xy;