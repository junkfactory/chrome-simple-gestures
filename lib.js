const VALID_GESTURES = /^[DULR]*$/;

const $ = function (path) {
  if (path) {
    var objs = document.querySelectorAll(path);
    return objs.length > 1 ? objs : objs.item(0);
  }
  return document;
};

function invertHash(hash) {
  var inv = {};
  for (key in hash) {
    //don't invert urls
    try {
      inv[key] = new URL(hash[key]).toString().trim();
    } catch (error) {
      inv[hash[key]] = key;
    }
  }
  return inv;
}

function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}
