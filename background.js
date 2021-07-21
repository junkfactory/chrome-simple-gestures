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
        reload: "DR"
    }
};

chrome.runtime.onInstalled.addListener(details => {
    if (details && details.reason == 'update') {
        chrome.action.setBadgeBackgroundColor({color:'#f00'})
        chrome.action.setBadgeText({text: "New"})
    }
    chrome.storage.local.get("simple_gestures_config", result => {
        if (result.simple_gestures_config) {
            Object.assign(config, result.simple_gestures_config);
        } else {
            chrome.storage.local.set({ simple_gestures_config: config });
        }
    });
});

function withActiveTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, tab => {
        callback(tab[0]);
    });
}

function switchTab(tabs, direction) {
    var indices = []
    var activeIndex = -1;
    for (var i = 0; i < tabs.length; i++) {
        var t = tabs[i]
        indices.push(t)
        if (t.active) {
            activeIndex = i;
        }
    }
    var nexttab = activeIndex + direction;
    if (nexttab < 0) {
        nexttab = indices.length - 1
    } else if (nexttab > indices.length - 1) {
        nexttab = 0;
    }
    chrome.tabs.highlight({ tabs: indices[nexttab].index, windowId: indices[nexttab].windowId })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.msg) {
        case "back":
            withActiveTab(tab => chrome.tabs.goBack(tab.id));
            break;
        case "forward":
            withActiveTab(tab => chrome.tabs.goForward(tab.id));
            break;
        case "reload":
            withActiveTab(tab => chrome.tabs.reload(tab.id, { bypassCache: true }));
            break;
        case "closetab":
            withActiveTab(tab => {
                chrome.tabs.remove(tab.id, function () {
                    sendResponse({ resp: "tab closed" });
                });
            });
            break;
        case "newtab":
            var createProperties = {};
            if (request.url && request.url.length > 0) {
                createProperties.url = request.url;
            }
            chrome.tabs.create(createProperties, function (result) {
                sendResponse({ resp: result });
            });
            break;
        case "config.update":
            Object.assign(config, request.updatedCconfig);
            chrome.tabs.query({}, tabs => {
                tabs.forEach(t => chrome.tabs.sendMessage(t.id, { msg: "tabs.config.update", updatedConfig: config }))
            });
            sendResponse({ resp: "Configuration saved!"})
            break;
        case "config":
            sendResponse({ resp: config });
            break;
        case "nexttab":
            chrome.tabs.query({}, r => {
                switchTab(r, 1)
            })
            break;
        case "prevtab":
            chrome.tabs.query({}, r => {
                switchTab(r, -1)
            })
            break;
        default:
            console.error("Unknown message request", request);
            break;
    }

});

