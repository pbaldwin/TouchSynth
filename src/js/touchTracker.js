import pubsub from './pubsub';

let xy = Object.create(pubsub);

document.body.addEventListener('mousedown', dispatchDown, false);
document.body.addEventListener('mouseup', dispatchUp, false);

document.body.addEventListener('touchstart', dispatchTouchDown, { passive: false });
document.body.addEventListener('touchend', dispatchTouchEnd, { passive: false });

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

function coordinates(o) {
  return {
    x: o.clientX,
    y: o.clientY
  };
}

export default xy;