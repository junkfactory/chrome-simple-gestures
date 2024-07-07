// The MIT License (MIT)
// ----------------------------------------------
//
// Copyright © 2024 junkfactory@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the “Software”), to deal in
// the Software without restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
// Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
// A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
// THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
var rmousedown = false,
  moved = false;
var trail = false,
  rockerEnabled = true;
var mx, my, nx, ny, lx, ly, phi;
var currentGesture = "",
  previousGesture = "";
var pi = 3.14159;
var suppress = 1;
var myGests, gestureActionMap;
var ls,
  myColor = "red",
  myWidth = 3;
var loaded = false;
var link = null;
var extensionEnabled = true;

function onStart(event) {
  if (!loaded) {
    watchGestures();
    loaded = true;
  }
  my = event.pageX;
  mx = event.pageY;
  lx = my;
  ly = mx;
  currentGesture = "";
  previousGesture = "";
  moved = false;
  link = determineLink(event.target, 10);
}

function onMove(event) {
  ny = event.pageX;
  nx = event.pageY;
  var r = Math.sqrt(Math.pow(nx - mx, 2) + Math.pow(ny - my, 2));
  if (r > 16) {
    phi = Math.atan2(ny - my, nx - mx);
    if (phi < 0) phi += 2 * pi;
    if (phi >= pi / 4 && phi < (3 * pi) / 4) var tmove = "R";
    else if (phi >= (3 * pi) / 4 && phi < (5 * pi) / 4) var tmove = "U";
    else if (phi >= (5 * pi) / 4 && phi < (7 * pi) / 4) var tmove = "L";
    else if (phi >= (7 * pi) / 4 || phi < pi / 4) var tmove = "D";
    if (tmove != previousGesture) {
      currentGesture += tmove;
      previousGesture = tmove;
    }

    if (trail) {
      if (moved == false) {
        createCanvas();
      }
      draw(ny, nx);
    }
    moved = true;
    mx = nx;
    my = ny;
  }
}

document.onmousedown = function (event) {
  if (!extensionEnabled) {
    return;
  }
  rmousedown = event.button == 2;
  if (rmousedown && suppress) {
    onStart(event);
  }
};

document.onmousemove = function (event) {
  if (!extensionEnabled) {
    return;
  }
  //track the mouse if we are holding the right button
  if (rmousedown) {
    onMove(event);
  }
};

document.onmouseup = function (event) {
  if (!extensionEnabled) {
    return;
  }
  if (rockerEnabled && event.buttons > 0) {
    if (event.button == 2) {
      browser.runtime.sendMessage({ msg: "nexttab" });
    } else if (event.button == 0) {
      browser.runtime.sendMessage({ msg: "prevtab" });
      ++suppress;
    }
  } else if (event.button == 2) {
    if (moved) {
      executeGesture();
    } else {
      --suppress;
    }
  }
  rmousedown = false;
  //always remove canvas on mouse up
  destroyCanvas();
};

document.oncontextmenu = function () {
  if (!extensionEnabled) {
    return true;
  }
  if (suppress) return false;
  else {
    rmousedown = false;
    suppress++;
    return true;
  }
};

function executeGesture() {
  var action = gestureActionMap[currentGesture];
  if (action) {
    if (isUrl(action)) {
      link = action;
      action = "newtab";
    }
    browser.runtime
      .sendMessage({ msg: action, url: link })
      .then((result) => {
        if (result != null) {
          link = null;
        }
      })
      .catch((error) => console.error(`Failed to send ${action}`, error));
  }
}

function updateConfig(config) {
  trail = Boolean(config.trailEnabled);
  rockerEnabled = Boolean(config.rockerEnabled);
  myColor = config.trailColor;
  myWidth = config.trailWidth;
  myGests = config.gestures;
  gestureActionMap = invertHash(myGests);
  extensionEnabled =
    !config?.disabled_domains?.includes(window.location.hostname) || false;
}

function watchGestures() {
  browser.runtime.sendMessage({ msg: "config" }).then(
    (response) => {
      if (response) {
        updateConfig(response.resp);
      }
    },
    (error) => console.error(error),
  );

  browser.runtime.onMessage.addListener((request) => {
    switch (request.msg) {
      case "tabs.config.update":
        updateConfig(request.updatedConfig);
        break;
    }
  });
}

function determineLink(target, allowedDrillCount) {
  if (target.href) {
    return target.href;
  }
  if (target.parentElement && allowedDrillCount > 0) {
    return determineLink(target.parentElement, allowedDrillCount - 1);
  }
  return null;
}

document.addEventListener("DOMContentLoaded", watchGestures);
