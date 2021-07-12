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

chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
});


chrome.runtime.onInstalled.addListener(() => {
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
            sendResponse({ resp: "Configuration Saved" });
            break;
        case "config.trailColor":
            sendResponse({ resp: config.trailColor });
            break;
        case "config.trailWidth":
            sendResponse({ resp: config.trailWidth });
            break;
        case "config.gestures":
            sendResponse({ resp: config.gestures });
            break;
        case "config.trailEnabled":
            sendResponse({ resp: config.trailEnabled });
            break;
        default:
            console.error("Unknown message request", request);
            break;
    }

});

