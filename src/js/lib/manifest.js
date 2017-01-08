export default function () {
  let manifest = [];

  const playManifest = (...args) => {
    manifest.forEach((f) => {
      try {
        f(...args);
      }
      catch (err) {
        console.log(err);
      }
    });
  };

  const addItem = (f) => manifest.push(f);

  const removeItem = (f) => {
    const idx = manifest.indexOf(f);

    if (idx > -1) {
      manifest.splice(idx, 1);
    }
  };

  return {
    add: addItem,
    remove: removeItem,
    play: playManifest
  };
}
