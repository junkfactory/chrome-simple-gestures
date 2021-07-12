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

colorNameToCode = {
    "red": "ff3300",
    "green": "008000",
    "blue": "00008B",
    "yellow": "FFFF00"
}

colorCodeToName = {
    "ff3300": "red",
    "008000": "green",
    "00008B": "blue",
    "FFFF00": "yellow"
}

defaultGestures = { "R": "forward", "L": "back", "D": "closetab" }

commandMapping = {
    "History Back": "back",
    "History Forward": "forward",
    "Reload": "reload",
    "Open New Tab": "newtab",
    "Close Current Tab": "closetab",
}

function invertHash(hash) {
    inv = {}
    for (key in hash)
        inv[hash[key]] = key
    return inv
}

function createOptions(config) {
    var key, div, tr, td, select, inp, img, a
    var gests = "gestures" in config ? config.gestures : {};

    if (Object.keys(gests).length == 0)
        gests = invertHash(defaultGestures);
    
    div = document.getElementById("optsTab");
    for (key in commandMapping) {
        tr = div.insertRow(div.rows.length)
        td = document.createElement('td')
        td.appendChild(document.createTextNode(key))
        tr.appendChild(td)
        td = document.createElement('td')
        inp = document.createElement('input')
        inp.type = 'text'
        if (gests[commandMapping[key]])
            inp.value = gests[commandMapping[key]]
        tr.appendChild(td)
        td.appendChild(inp)
    }
}


// Saves options to local storage.
function saveConfiguration(e) {
    e.preventDefault();
    var select, value
    var config = {
        gestures: {}
    };

    select = document.getElementById("color");
    value = select.children[select.selectedIndex].value;
    config.trailColor = colorNameToCode[value];

    select = document.getElementById("width");
    config.trailWidth = select.children[select.selectedIndex].value;

    var trail = document.getElementById('trail');
    config.trailEnabled = trail.checked;

    inputs = document.getElementsByTagName('input')
    for (i = 0; i < inputs.length; i++) {
        s = inputs[i].parentElement.parentElement.children[0].textContent
        if (inputs[i].value.length > 0)
            config.gestures[commandMapping[s]] = inputs[i].value;
        else
            delete config.gestures[commandMapping[s]];
    }
    chrome.storage.local.set({simple_gestures_config: config}, function() {
        chrome.runtime.sendMessage({msg: "config.update", updatedCconfig: config}, result => {
            // Update status to let user know options were saved.
            var status = document.getElementById("status");
            status.innerHTML = result.resp;
        });
    });
    return false;
}

// Restores select box state to saved value from local storage.
function restoreOptions() {
    chrome.storage.local.get("simple_gestures_config", (result) => {
        var config = result.simple_gestures_config;

        var trailEnabled = document.getElementById('trail');
        trailEnabled.checked = config.trailEnabled;

        var select = document.getElementById("color");
        value = colorCodeToName[config.trailColor];
        if (!value) value = "red"
        for (var i = 0; i < select.children.length; i++) {
            var child = select.children[i];
            if (child.value == value) {
                child.selected = "true";
                break;
            }
        }
    
        select = document.getElementById("width");
        var value = config.trailWidth;
        if (!value) value = 3
        for (var i = 0; i < select.children.length; i++) {
            var child = select.children[i];
            if (child.value == value) {
                child.selected = "true";
                break;
            }
        }

        createOptions(config);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();
    document.getElementById("option_form").addEventListener("submit", saveConfiguration);
});
