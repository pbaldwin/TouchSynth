(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _touchTracker = require('./touchTracker');

var _touchTracker2 = _interopRequireDefault(_touchTracker);

var _synth = require('./synth');

var _synth2 = _interopRequireDefault(_synth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Cache our DOM nodes
var background = document.getElementById('background');
var title = document.getElementById('title');

// Messages consts
var CLICK = 'Click.';
var DRAG = 'Drag.';
var THANKS = 'Thanks.';

var HUES = [180, 20];

// TODO: Regenerate these numbers on window resize
var width = window.innerWidth;
var height = window.innerHeight;

// Get the middle of our stage
var middle = {
  x: Math.floor(width / 2),
  y: Math.floor(height / 2)
};

// These are the ratios we want to use to get our color values
var ratio = {
  x: 360 / width,
  y: 70 / height
};

// Max and min values of our scale
// Currently C3 - C4
var notes = {
  root: 130.8,
  max: 261.6
};

var noteRatio = (notes.max - notes.root) / width;

// Get our filter frequency range
var filter = {
  min: 50,
  max: 10000
};

var filterRatio = (filter.max - filter.min) / height;

// Handle touchTracker events...
_touchTracker2.default.subscribe('pointerdown', handleDown);
_touchTracker2.default.subscribe('pointerdrag', handleDrag);
_touchTracker2.default.subscribe('pointerup', handleUp);

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
  _synth2.default.gate.close();
}

/**
 * Changes color and synth changes on pointer down and drag events.
 * @param  {Object} coords { x: `Number`, y: `Number` }
 * @return {undefined}
 */
function handleTouch(coords) {
  var shift = {
    x: Math.floor((coords.x - middle.x) * ratio.x),
    y: Math.floor(100 - coords.y * ratio.y)
  };

  var gradient = getGradient(shift);

  background.style.backgroundImage = gradient;

  var note = notes.root + coords.x * noteRatio;
  var filterFreq = filter.max - coords.y * filterRatio;

  _synth2.default.pitch(note);
  _synth2.default.filter(filterFreq);
  _synth2.default.gate.open(.5);
}

/**
 * Get new gradient CSS
 * @param  {Object} shift { x: `Number`, y: `Number` }
 * @return {String}       CSS Gradient String
 */
function getGradient(shift) {
  var shiftedHues = HUES.map(function (hue) {
    return hue + shift.x;
  });
  return 'linear-gradient(40deg, hsl(' + shiftedHues[0] + ',' + shift.y + '%,70%), hsl(' + shiftedHues[1] + ',' + shift.y + '%,70%))';
}

},{"./synth":3,"./touchTracker":4}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Pub/Sub mixin object.
 * Adapted from David Walsh's https://davidwalsh.name/pubsub-javascript
 * By Patrick Baldwin (patrick.baldwin@smashingideas.com)
 */

var pubsub = {
  subscribe: function subscribe(topic, listener) {
    var self = this;
    this.topics = this.topics || {};

    // Create the topic's object if not yet created
    if (!this.topics.hasOwnProperty(topic)) {
      this.topics[topic] = [];
    }

    // Add the listener to queue
    var index = this.topics[topic].push(listener) - 1;

    // Provide handle back for removal of topic
    return {
      remove: function remove() {
        delete self.topics[topic][index];
      }
    };
  },
  publish: function publish(topic, info) {
    this.topics = this.topics || {};

    // If the topic doesn't exist, or there's no listeners in queue, just leave
    if (!this.topics.hasOwnProperty(topic)) return;

    // Cycle through topics queue, fire!
    this.topics[topic].forEach(function (item) {
      item(info != undefined ? info : {});
    });
  }
};

exports.default = pubsub;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var lowPassFilter = audioCtx.createBiquadFilter();

lowPassFilter.type = 'lowpass';
lowPassFilter.frequency.value = 500;
lowPassFilter.Q.value = 20;

// TODO: Make oscilator generation part of the synth initialization.
var oscillator1 = audioCtx.createOscillator();

oscillator1.type = 'sawtooth';
oscillator1.frequency.value = 261.6;

var oscillator2 = audioCtx.createOscillator();

oscillator2.type = 'sawtooth';
oscillator2.frequency.value = 261.6;
oscillator2.detune.value = 20;

var gainNode = audioCtx.createGain();

gainNode.gain.value = 0;

oscillator1.connect(lowPassFilter);
oscillator2.connect(lowPassFilter);

lowPassFilter.connect(gainNode);

gainNode.connect(audioCtx.destination);

// Release is null until we make it an interval
var release = null;

var synth = {
  /**
   * Set lowpass filter frequency
   * @param  {Number} freq New lowpass filter frequency
   * @return {undefined}
   */
  filter: function filter(freq) {
    return lowPassFilter.frequency.value = freq;
  },
  /**
   * Set oscillator frequencies to `freq`
   * @param  {Number} freq New oscillator frequency
   * @return {undefined}
   */
  pitch: function pitch(freq) {
    oscillator1.frequency.value = freq;
    oscillator2.frequency.value = freq;
  },
  gate: {
    /**
     * Open synth gate to given level.
     * @param  {Number} level Number between 0 and 1
     * @return {undefined}
     */
    open: function open(level) {
      if (release) clearInterval(release);
      gainNode.gain.value = level;
    },
    // TODO: Gate release should be set by an ADSR
    close: function close() {
      release = setInterval(function () {
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

exports.default = synth;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pubsub = require('./pubsub');

var _pubsub2 = _interopRequireDefault(_pubsub);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var xy = Object.create(_pubsub2.default);

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

var lastTouch = null;

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

exports.default = xy;

},{"./pubsub":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYXBwLmpzIiwic3JjL2pzL3B1YnN1Yi5qcyIsInNyYy9qcy9zeW50aC5qcyIsInNyYy9qcy90b3VjaFRyYWNrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOzs7O0FBQ0E7Ozs7OztBQUVBO0FBQ0EsSUFBSSxhQUFhLFNBQVMsY0FBVCxDQUF3QixZQUF4QixDQUFqQjtBQUNBLElBQUksUUFBUSxTQUFTLGNBQVQsQ0FBd0IsT0FBeEIsQ0FBWjs7QUFFQTtBQUNBLElBQU0sUUFBUSxRQUFkO0FBQ0EsSUFBTSxPQUFPLE9BQWI7QUFDQSxJQUFNLFNBQVMsU0FBZjs7QUFFQSxJQUFNLE9BQU8sQ0FBQyxHQUFELEVBQU0sRUFBTixDQUFiOztBQUVBO0FBQ0EsSUFBSSxRQUFRLE9BQU8sVUFBbkI7QUFDQSxJQUFJLFNBQVMsT0FBTyxXQUFwQjs7QUFFQTtBQUNBLElBQUksU0FBUztBQUNYLEtBQUcsS0FBSyxLQUFMLENBQVcsUUFBUSxDQUFuQixDQURRO0FBRVgsS0FBRyxLQUFLLEtBQUwsQ0FBVyxTQUFTLENBQXBCO0FBRlEsQ0FBYjs7QUFLQTtBQUNBLElBQUksUUFBUTtBQUNWLEtBQUcsTUFBTSxLQURDO0FBRVYsS0FBRyxLQUFLO0FBRkUsQ0FBWjs7QUFLQTtBQUNBO0FBQ0EsSUFBSSxRQUFRO0FBQ1YsUUFBTSxLQURJO0FBRVYsT0FBSztBQUZLLENBQVo7O0FBS0EsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFOLEdBQVksTUFBTSxJQUFuQixJQUEyQixLQUEzQzs7QUFFQTtBQUNBLElBQUksU0FBUztBQUNYLE9BQUssRUFETTtBQUVYLE9BQUs7QUFGTSxDQUFiOztBQUtBLElBQUksY0FBYyxDQUFDLE9BQU8sR0FBUCxHQUFhLE9BQU8sR0FBckIsSUFBNEIsTUFBOUM7O0FBRUE7QUFDQSx1QkFBYSxTQUFiLENBQXVCLGFBQXZCLEVBQXNDLFVBQXRD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V0FBWCxFQUF3QixZQUFZLFNBQVosQ0FBeEI7QUFDQSxJQUFFLGNBQUY7QUFDRDs7QUFFRCxTQUFTLFdBQVQsQ0FBcUIsQ0FBckIsRUFBd0I7QUFDdEIsU0FBTztBQUNMLE9BQUcsRUFBRSxPQURBO0FBRUwsT0FBRyxFQUFFO0FBRkEsR0FBUDtBQUlEOztrQkFFYyxFIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB0b3VjaFRyYWNrZXIgZnJvbSAnLi90b3VjaFRyYWNrZXInO1xuaW1wb3J0IHN5bnRoIGZyb20gJy4vc3ludGgnO1xuXG4vLyBDYWNoZSBvdXIgRE9NIG5vZGVzXG5sZXQgYmFja2dyb3VuZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWNrZ3JvdW5kJyk7XG5sZXQgdGl0bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGl0bGUnKTtcblxuLy8gTWVzc2FnZXMgY29uc3RzXG5jb25zdCBDTElDSyA9ICdDbGljay4nO1xuY29uc3QgRFJBRyA9ICdEcmFnLic7XG5jb25zdCBUSEFOS1MgPSAnVGhhbmtzLic7XG5cbmNvbnN0IEhVRVMgPSBbMTgwLCAyMF07XG5cbi8vIFRPRE86IFJlZ2VuZXJhdGUgdGhlc2UgbnVtYmVycyBvbiB3aW5kb3cgcmVzaXplXG5sZXQgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbmxldCBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbi8vIEdldCB0aGUgbWlkZGxlIG9mIG91ciBzdGFnZVxubGV0IG1pZGRsZSA9IHtcbiAgeDogTWF0aC5mbG9vcih3aWR0aCAvIDIpLFxuICB5OiBNYXRoLmZsb29yKGhlaWdodCAvIDIpXG59O1xuXG4vLyBUaGVzZSBhcmUgdGhlIHJhdGlvcyB3ZSB3YW50IHRvIHVzZSB0byBnZXQgb3VyIGNvbG9yIHZhbHVlc1xubGV0IHJhdGlvID0ge1xuICB4OiAzNjAgLyB3aWR0aCxcbiAgeTogNzAgLyBoZWlnaHRcbn07XG5cbi8vIE1heCBhbmQgbWluIHZhbHVlcyBvZiBvdXIgc2NhbGVcbi8vIEN1cnJlbnRseSBDMyAtIEM0XG5sZXQgbm90ZXMgPSB7XG4gIHJvb3Q6IDEzMC44LFxuICBtYXg6IDI2MS42XG59O1xuXG5sZXQgbm90ZVJhdGlvID0gKG5vdGVzLm1heCAtIG5vdGVzLnJvb3QpIC8gd2lkdGg7XG5cbi8vIEdldCBvdXIgZmlsdGVyIGZyZXF1ZW5jeSByYW5nZVxubGV0IGZpbHRlciA9IHtcbiAgbWluOiA1MCxcbiAgbWF4OiAxMDAwMFxufTtcblxubGV0IGZpbHRlclJhdGlvID0gKGZpbHRlci5tYXggLSBmaWx0ZXIubWluKSAvIGhlaWdodDtcblxuLy8gSGFuZGxlIHRvdWNoVHJhY2tlciBldmVudHMuLi5cbnRvdWNoVHJhY2tlci5zdWJzY3JpYmUoJ3BvaW50ZXJkb3duJywgaGFuZGxlRG93bik7XG50b3VjaFRyYWNrZXIuc3Vic2NyaWJlKCdwb2ludGVyZHJhZycsIGhhbmRsZURyYWcpO1xudG91Y2hUcmFja2VyLnN1YnNjcmliZSgncG9pbnRlcnVwJywgaGFuZGxlVXApO1xuXG4vKipcbiAqIENoYW5nZXMgdGl0bGUgbWVzc2FnZSBvbiBwb2ludGVyIGRvd24uXG4gKiBAcGFyYW0gIHtPYmplY3R9IGNvb3JkcyB7IHg6IGBOdW1iZXJgLCB5OiBgTnVtYmVyYCB9XG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gKi9cbmZ1bmN0aW9uIGhhbmRsZURvd24oY29vcmRzKSB7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gRFJBRztcbiAgaGFuZGxlVG91Y2goY29vcmRzKTtcbn1cblxuLyoqXG4gKiBDaGFuZ2VzIHRpdGxlIG1lc3NhZ2Ugb24gcG9pbnRlciBkcmFnLlxuICogQHBhcmFtICB7T2JqZWN0fSBjb29yZHMgeyB4OiBgTnVtYmVyYCwgeTogYE51bWJlcmAgfVxuICogQHJldHVybiB7dW5kZWZpbmVkfVxuICovXG5mdW5jdGlvbiBoYW5kbGVEcmFnKGNvb3Jkcykge1xuICB0aXRsZS50ZXh0Q29udGVudCA9IFRIQU5LUztcbiAgaGFuZGxlVG91Y2goY29vcmRzKTtcbn1cblxuLyoqXG4gKiBDaGFuZ2VzIHRpdGxlIG1lc3NhZ2Ugb24gcG9pbnRlciB1cC5cbiAqIEBwYXJhbSAge09iamVjdH0gY29vcmRzIHsgeDogYE51bWJlcmAsIHk6IGBOdW1iZXJgIH1cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gaGFuZGxlVXAoY29vcmRzKSB7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gQ0xJQ0s7XG4gIHN5bnRoLmdhdGUuY2xvc2UoKTtcbn1cblxuXG4vKipcbiAqIENoYW5nZXMgY29sb3IgYW5kIHN5bnRoIGNoYW5nZXMgb24gcG9pbnRlciBkb3duIGFuZCBkcmFnIGV2ZW50cy5cbiAqIEBwYXJhbSAge09iamVjdH0gY29vcmRzIHsgeDogYE51bWJlcmAsIHk6IGBOdW1iZXJgIH1cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gaGFuZGxlVG91Y2goY29vcmRzKSB7XG4gIGxldCBzaGlmdCA9IHtcbiAgICB4OiBNYXRoLmZsb29yKChjb29yZHMueCAtIG1pZGRsZS54KSAqIHJhdGlvLngpLFxuICAgIHk6IE1hdGguZmxvb3IoMTAwIC0gKGNvb3Jkcy55ICogcmF0aW8ueSkpXG4gIH07XG5cbiAgbGV0IGdyYWRpZW50ID0gZ2V0R3JhZGllbnQoc2hpZnQpO1xuXG4gIGJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gZ3JhZGllbnQ7XG5cbiAgbGV0IG5vdGUgPSBub3Rlcy5yb290ICsgKGNvb3Jkcy54ICogbm90ZVJhdGlvKTtcbiAgbGV0IGZpbHRlckZyZXEgPSBmaWx0ZXIubWF4IC0gKGNvb3Jkcy55ICogZmlsdGVyUmF0aW8pO1xuXG4gIHN5bnRoLnBpdGNoKG5vdGUpO1xuICBzeW50aC5maWx0ZXIoZmlsdGVyRnJlcSk7XG4gIHN5bnRoLmdhdGUub3BlbiguNSk7XG59XG5cbi8qKlxuICogR2V0IG5ldyBncmFkaWVudCBDU1NcbiAqIEBwYXJhbSAge09iamVjdH0gc2hpZnQgeyB4OiBgTnVtYmVyYCwgeTogYE51bWJlcmAgfVxuICogQHJldHVybiB7U3RyaW5nfSAgICAgICBDU1MgR3JhZGllbnQgU3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGdldEdyYWRpZW50KHNoaWZ0KSB7XG4gIGxldCBzaGlmdGVkSHVlcyA9IEhVRVMubWFwKChodWUpID0+IGh1ZSArIHNoaWZ0LngpO1xuICByZXR1cm4gYGxpbmVhci1ncmFkaWVudCg0MGRlZywgaHNsKCR7c2hpZnRlZEh1ZXNbMF19LCR7c2hpZnQueX0lLDcwJSksIGhzbCgke3NoaWZ0ZWRIdWVzWzFdfSwke3NoaWZ0Lnl9JSw3MCUpKWA7XG59IiwiLyoqXG4gKiBQdWIvU3ViIG1peGluIG9iamVjdC5cbiAqIEFkYXB0ZWQgZnJvbSBEYXZpZCBXYWxzaCdzIGh0dHBzOi8vZGF2aWR3YWxzaC5uYW1lL3B1YnN1Yi1qYXZhc2NyaXB0XG4gKiBCeSBQYXRyaWNrIEJhbGR3aW4gKHBhdHJpY2suYmFsZHdpbkBzbWFzaGluZ2lkZWFzLmNvbSlcbiAqL1xuXG52YXIgcHVic3ViID0ge1xuICBzdWJzY3JpYmU6IGZ1bmN0aW9uKHRvcGljLCBsaXN0ZW5lcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnRvcGljcyA9IHRoaXMudG9waWNzIHx8IHt9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB0b3BpYydzIG9iamVjdCBpZiBub3QgeWV0IGNyZWF0ZWRcbiAgICBpZighdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSB7XG4gICAgICB0aGlzLnRvcGljc1t0b3BpY10gPSBbXTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHF1ZXVlXG4gICAgdmFyIGluZGV4ID0gdGhpcy50b3BpY3NbdG9waWNdLnB1c2gobGlzdGVuZXIpIC0xO1xuXG4gICAgLy8gUHJvdmlkZSBoYW5kbGUgYmFjayBmb3IgcmVtb3ZhbCBvZiB0b3BpY1xuICAgIHJldHVybiB7XG4gICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWxldGUgc2VsZi50b3BpY3NbdG9waWNdW2luZGV4XTtcbiAgICAgIH1cbiAgICB9O1xuICB9LFxuICBwdWJsaXNoOiBmdW5jdGlvbih0b3BpYywgaW5mbykge1xuICAgIHRoaXMudG9waWNzID0gdGhpcy50b3BpY3MgfHwge307XG5cbiAgICAvLyBJZiB0aGUgdG9waWMgZG9lc24ndCBleGlzdCwgb3IgdGhlcmUncyBubyBsaXN0ZW5lcnMgaW4gcXVldWUsIGp1c3QgbGVhdmVcbiAgICBpZighdGhpcy50b3BpY3MuaGFzT3duUHJvcGVydHkodG9waWMpKSByZXR1cm47XG5cbiAgICAvLyBDeWNsZSB0aHJvdWdoIHRvcGljcyBxdWV1ZSwgZmlyZSFcbiAgICB0aGlzLnRvcGljc1t0b3BpY10uZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIGl0ZW0oaW5mbyAhPSB1bmRlZmluZWQgPyBpbmZvIDoge30pO1xuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBwdWJzdWI7IiwibGV0IGF1ZGlvQ3R4ID0gbmV3ICh3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7XG5cbmxldCBsb3dQYXNzRmlsdGVyID0gYXVkaW9DdHguY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbmxvd1Bhc3NGaWx0ZXIudHlwZSA9ICdsb3dwYXNzJztcbmxvd1Bhc3NGaWx0ZXIuZnJlcXVlbmN5LnZhbHVlID0gNTAwO1xubG93UGFzc0ZpbHRlci5RLnZhbHVlID0gMjA7XG5cbi8vIFRPRE86IE1ha2Ugb3NjaWxhdG9yIGdlbmVyYXRpb24gcGFydCBvZiB0aGUgc3ludGggaW5pdGlhbGl6YXRpb24uXG5sZXQgb3NjaWxsYXRvcjEgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG5cbm9zY2lsbGF0b3IxLnR5cGUgPSAnc2F3dG9vdGgnO1xub3NjaWxsYXRvcjEuZnJlcXVlbmN5LnZhbHVlID0gMjYxLjY7XG5cbmxldCBvc2NpbGxhdG9yMiA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxub3NjaWxsYXRvcjIudHlwZSA9ICdzYXd0b290aCc7XG5vc2NpbGxhdG9yMi5mcmVxdWVuY3kudmFsdWUgPSAyNjEuNjtcbm9zY2lsbGF0b3IyLmRldHVuZS52YWx1ZSA9IDIwO1xuXG5sZXQgZ2Fpbk5vZGUgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCk7XG5cbmdhaW5Ob2RlLmdhaW4udmFsdWUgPSAwO1xuXG5vc2NpbGxhdG9yMS5jb25uZWN0KGxvd1Bhc3NGaWx0ZXIpO1xub3NjaWxsYXRvcjIuY29ubmVjdChsb3dQYXNzRmlsdGVyKTtcblxubG93UGFzc0ZpbHRlci5jb25uZWN0KGdhaW5Ob2RlKTtcblxuZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG5cbi8vIFJlbGVhc2UgaXMgbnVsbCB1bnRpbCB3ZSBtYWtlIGl0IGFuIGludGVydmFsXG5sZXQgcmVsZWFzZSA9IG51bGw7XG5cbmxldCBzeW50aCA9IHtcbiAgLyoqXG4gICAqIFNldCBsb3dwYXNzIGZpbHRlciBmcmVxdWVuY3lcbiAgICogQHBhcmFtICB7TnVtYmVyfSBmcmVxIE5ldyBsb3dwYXNzIGZpbHRlciBmcmVxdWVuY3lcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgZmlsdGVyOiAoZnJlcSkgPT4gbG93UGFzc0ZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSBmcmVxLFxuICAvKipcbiAgICogU2V0IG9zY2lsbGF0b3IgZnJlcXVlbmNpZXMgdG8gYGZyZXFgXG4gICAqIEBwYXJhbSAge051bWJlcn0gZnJlcSBOZXcgb3NjaWxsYXRvciBmcmVxdWVuY3lcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgcGl0Y2g6IChmcmVxKSA9PiB7XG4gICAgb3NjaWxsYXRvcjEuZnJlcXVlbmN5LnZhbHVlID0gZnJlcTtcbiAgICBvc2NpbGxhdG9yMi5mcmVxdWVuY3kudmFsdWUgPSBmcmVxO1xuICB9LFxuICBnYXRlOiB7XG4gICAgLyoqXG4gICAgICogT3BlbiBzeW50aCBnYXRlIHRvIGdpdmVuIGxldmVsLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gbGV2ZWwgTnVtYmVyIGJldHdlZW4gMCBhbmQgMVxuICAgICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICAgKi9cbiAgICBvcGVuOiAobGV2ZWwpID0+IHtcbiAgICAgIGlmIChyZWxlYXNlKSBjbGVhckludGVydmFsKHJlbGVhc2UpO1xuICAgICAgZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IGxldmVsO1xuICAgIH0sXG4gICAgLy8gVE9ETzogR2F0ZSByZWxlYXNlIHNob3VsZCBiZSBzZXQgYnkgYW4gQURTUlxuICAgIGNsb3NlOiAoKSA9PiB7XG4gICAgICByZWxlYXNlID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBnYWluTm9kZS5nYWluLnZhbHVlIC09IC4wMjtcbiAgICAgICAgaWYgKGdhaW5Ob2RlLmdhaW4udmFsdWUgPD0gMCkge1xuICAgICAgICAgIGdhaW5Ob2RlLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwocmVsZWFzZSk7XG4gICAgICAgIH1cbiAgICAgIH0sIDE1KTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGlPUyByZXF1aXJlcyB1cyB0byBzdGFydCB0aGUgc3ludGggYXMgYSByZXN1bHQgb2YgYSB1c2VyIGFjdGlvbi4uLlxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaW5pdGlhbGl6ZVN5bnRoKTtcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBpbml0aWFsaXplU3ludGgpO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplU3ludGgoKSB7XG4gIG9zY2lsbGF0b3IxLnN0YXJ0KCk7XG4gIG9zY2lsbGF0b3IyLnN0YXJ0KCk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGluaXRpYWxpemVTeW50aCk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBpbml0aWFsaXplU3ludGgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBzeW50aDtcbiIsImltcG9ydCBwdWJzdWIgZnJvbSAnLi9wdWJzdWInO1xuXG5sZXQgeHkgPSBPYmplY3QuY3JlYXRlKHB1YnN1Yik7XG5cbmRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZGlzcGF0Y2hEb3duLCBmYWxzZSk7XG5kb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBkaXNwYXRjaFVwLCBmYWxzZSk7XG5cbmRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRpc3BhdGNoVG91Y2hEb3duLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xuZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGRpc3BhdGNoVG91Y2hFbmQsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XG5cbmZ1bmN0aW9uIGRpc3BhdGNoRG93bihlKSB7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZGlzcGF0Y2hEcmFnLCBmYWxzZSk7XG4gIHh5LnB1Ymxpc2goJ3BvaW50ZXJkb3duJywgY29vcmRpbmF0ZXMoZSkpO1xuICBlLnByZXZlbnREZWZhdWx0KCk7XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoRHJhZyhlKSB7XG4gIHh5LnB1Ymxpc2goJ3BvaW50ZXJkcmFnJywgY29vcmRpbmF0ZXMoZSkpO1xuICBlLnByZXZlbnREZWZhdWx0KCk7XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoVXAoZSkge1xuICBkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGRpc3BhdGNoRHJhZywgZmFsc2UpO1xuICB4eS5wdWJsaXNoKCdwb2ludGVydXAnLCBjb29yZGluYXRlcyhlKSk7XG59XG5cbmxldCBsYXN0VG91Y2ggPSBudWxsO1xuXG5mdW5jdGlvbiBkaXNwYXRjaFRvdWNoRG93bihlKSB7XG4gIGxhc3RUb3VjaCA9IGUudG91Y2hlc1swXTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBkaXNwYXRjaFRvdWNoRHJhZywgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgeHkucHVibGlzaCgncG9pbnRlcmRvd24nLCBjb29yZGluYXRlcyhsYXN0VG91Y2gpKTtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xufVxuXG5mdW5jdGlvbiBkaXNwYXRjaFRvdWNoRHJhZyhlKSB7XG4gIGxhc3RUb3VjaCA9IGUudG91Y2hlc1swXTtcbiAgeHkucHVibGlzaCgncG9pbnRlcmRyYWcnLCBjb29yZGluYXRlcyhsYXN0VG91Y2gpKTtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xufVxuXG5mdW5jdGlvbiBkaXNwYXRjaFRvdWNoRW5kKGUpIHtcbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBkaXNwYXRjaFRvdWNoRHJhZywgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgeHkucHVibGlzaCgncG9pbnRlcnVwJywgY29vcmRpbmF0ZXMobGFzdFRvdWNoKSk7XG4gIGUucHJldmVudERlZmF1bHQoKTtcbn1cblxuZnVuY3Rpb24gY29vcmRpbmF0ZXMobykge1xuICByZXR1cm4ge1xuICAgIHg6IG8uY2xpZW50WCxcbiAgICB5OiBvLmNsaWVudFlcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgeHk7Il19
