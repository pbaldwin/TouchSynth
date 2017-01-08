import manifest from './manifest';

let callbackList = manifest();

/**
 * Watch window resize to load different video files.
 */
let ticking = false;
let lastKnownWidth = window.innerWidth;
let lastKnownHeight = window.innerHeight;

const onResize = function () {
  lastKnownWidth = window.innerWidth;
  lastKnownHeight = window.innerHeight;
  requestTick();
};

const requestTick = function () {
  if(!ticking) {
    requestAnimationFrame(update);
  }
  ticking = true;
};

const update = function () {
  ticking = false;
  const currentWidth = lastKnownWidth;
  const currentHeight = lastKnownHeight;

  callbackList.play(currentWidth, currentHeight);
};

window.addEventListener('resize', onResize, false);

export default function (cb) {
  callbackList.add(cb);
}
