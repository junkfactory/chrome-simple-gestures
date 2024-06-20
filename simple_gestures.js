/*
 *  Copyright (C) 2013  AJ Ribeiro
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
      chrome.runtime.sendMessage({ msg: "nexttab" });
    } else if (event.button == 0) {
      chrome.runtime.sendMessage({ msg: "prevtab" });
      ++suppress;
    }
  } else if (event.button == 2) {
    // console.log('suppress is '+suppress)
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
    chrome.runtime.sendMessage({ msg: action, url: link }, (result) => {
      if (result != null) {
        //console.log("result", result);
        link = null;
      }
    });
  }
}

function updateConfig(config) {
  // console.log("Updated config", config);
  trail = Boolean(config.trailEnabled);
  rockerEnabled = Boolean(config.rockerEnabled);
  myColor = config.trailColor;
  myWidth = config.trailWidth;
  myGests = config.gestures;
  gestureActionMap = invertHash(myGests);
  extensionEnabled = config?.domains?.[window.location.hostname];
  if (extensionEnabled === undefined) {
    extensionEnabled = true;
  }
}

function watchGestures() {
  chrome.runtime.sendMessage({ msg: "config" }, (response) => {
    if (response) {
      updateConfig(response.resp);
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.msg) {
      case "tabs.config.update":
        updateConfig(request.updatedConfig);
        break;
    }
  });
}

document.addEventListener("DOMContentLoaded", watchGestures);

function determineLink(target, allowedDrillCount) {
  if (target.href) {
    return target.href;
  }
  if (target.parentElement && allowedDrillCount > 0) {
    return determineLink(target.parentElement, allowedDrillCount - 1);
  }
  return null;
}
