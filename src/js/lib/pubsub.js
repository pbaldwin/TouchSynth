/**
 * Pub/Sub mixin object.
 * Adapted from David Walsh's https://davidwalsh.name/pubsub-javascript
 * By Patrick Baldwin (patrick.baldwin@smashingideas.com)
 */

var pubsub = {
  subscribe: function(topic, listener) {
    var self = this;
    this.topics = this.topics || {};

    // Create the topic's object if not yet created
    if(!this.topics.hasOwnProperty(topic)) {
      this.topics[topic] = [];
    }

    // Add the listener to queue
    var index = this.topics[topic].push(listener) -1;

    // Provide handle back for removal of topic
    return {
      remove: function() {
        delete self.topics[topic][index];
      }
    };
  },
  publish: function(topic, info) {
    this.topics = this.topics || {};

    // If the topic doesn't exist, or there's no listeners in queue, just leave
    if(!this.topics.hasOwnProperty(topic)) return;

    // Cycle through topics queue, fire!
    this.topics[topic].forEach(function(item) {
        item(info != undefined ? info : {});
    });
  }
};

export default pubsub;