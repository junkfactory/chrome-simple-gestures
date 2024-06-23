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

importScripts("browser.js");
//default configuration
const config = {
  rockerEnabled: true,
  trailEnabled: true,
  trailColor: "ff3300",
  trailWidth: 2,
  gestures: {
    forward: "R",
    back: "L",
    newtab: "U",
    closetab: "D",
    reload: "DR",
  },
};

browser.runtime.onInstalled.addListener((details) => {
  if (details && details.reason == "update") {
    browser.action.setBadgeBackgroundColor({ color: "#f00" });
    browser.action.setBadgeText({ text: "New" });
  }
  browser.storage.local.get("simple_gestures_config", (result) => {
    if (result.simple_gestures_config) {
      Object.assign(config, result.simple_gestures_config);
    } else {
      browser.storage.local.set({ simple_gestures_config: config });
    }
  });
});

if (browser.browserSettings && browser.browserSettings.contextMenuShowEvent) {
  browser.browserSettings.contextMenuShowEvent.set({ value: "mouseup" });
}

function withActiveTab(callback) {
  browser.tabs.query({ active: true, currentWindow: true }, (tab) => {
    callback(tab[0]);
  });
}

function switchTab(tabs, direction) {
  var indices = [];
  var activeIndex = -1;
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    indices.push(t);
    if (t.active) {
      activeIndex = i;
    }
  }
  var nexttab = activeIndex + direction;
  if (nexttab < 0) {
    nexttab = indices.length - 1;
  } else if (nexttab > indices.length - 1) {
    nexttab = 0;
  }
  browser.tabs.highlight({
    tabs: indices[nexttab].index,
    windowId: indices[nexttab].windowId,
  });
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.msg) {
    case "back":
      withActiveTab((tab) => browser.tabs.goBack(tab.id));
      break;
    case "forward":
      withActiveTab((tab) => browser.tabs.goForward(tab.id));
      break;
    case "reload":
      withActiveTab((tab) =>
        browser.tabs.reload(tab.id, { bypassCache: true }),
      );
      break;
    case "closetab":
      withActiveTab((tab) => {
        browser.tabs.remove(tab.id, function () {
          sendResponse({ resp: "tab closed" });
        });
      });
      break;
    case "newtab":
      var createProperties = {};
      if (request.url && request.url.length > 0) {
        createProperties.url = request.url;
      }
      browser.tabs.create(createProperties, function (result) {
        sendResponse({ resp: result });
      });
      break;
    case "config.update":
      Object.assign(config, request.updatedCconfig);
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((t) => {
          browser.tabs
            .sendMessage(t.id, {
              msg: "tabs.config.update",
              updatedConfig: config,
            })
            .catch((error) => console.warn(error));
        });
      });
      sendResponse({ resp: "Configuration saved!" });
      break;
    case "config":
      sendResponse({ resp: config });
      break;
    case "nexttab":
      browser.tabs.query({}, (r) => {
        switchTab(r, 1);
      });
      break;
    case "prevtab":
      browser.tabs.query({}, (r) => {
        switchTab(r, -1);
      });
      break;
    default:
      console.error("Unknown message request", request);
      break;
  }
});
