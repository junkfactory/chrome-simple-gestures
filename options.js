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
const $ = function (path) {
    if (path) {
        var objs = document.querySelectorAll(path)
        return objs.length > 1 ? objs : objs.item(0)
    }
    return document;
}

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
    "Reload (bypass cache)": "reload",
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

    div = $("#optsTab");
    for (key in commandMapping) {
        tr = div.insertRow(div.rows.length)
        td = $().createElement('td')
        td.appendChild($().createTextNode(key))
        tr.appendChild(td)
        td = $().createElement('td')
        inp = $().createElement('input')
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

    select = $("#color");
    value = select.children[select.selectedIndex].value;
    config.trailColor = colorNameToCode[value];

    select = $("#width");
    config.trailWidth = select.children[select.selectedIndex].value;

    var trail = $('#trail');
    config.trailEnabled = trail.checked;

    config.rockerEnabled = $('#rockerEnabled').checked;

    inputs = $('input')
    for (i = 0; i < inputs.length; i++) {
        s = inputs[i].parentElement.parentElement.children[0].textContent
        if (inputs[i].value.length > 0)
            config.gestures[commandMapping[s]] = inputs[i].value;
        else
            delete config.gestures[commandMapping[s]];
    }
    chrome.storage.local.set({ simple_gestures_config: config }, function () {
        chrome.runtime.sendMessage({ msg: "config.update", updatedCconfig: config }, result => {
            // Update status to let user know options were saved.
            var status = $("#status");
            status.innerHTML = result.resp;
            setTimeout(() => {
                status.innerHTML = ''
            }, 5000);
        });
    });
    return false;
}

// Restores select box state to saved value from local storage.
function restoreOptions() {
    chrome.storage.local.get("simple_gestures_config", (result) => {
        var config = result.simple_gestures_config;

        var trailEnabled = $('#trail');
        trailEnabled.checked = config.trailEnabled;

        var rockerEnabled = $('#rockerEnabled');
        rockerEnabled.checked = config.rockerEnabled;

        var select = $("#color");
        value = colorCodeToName[config.trailColor];
        if (!value) value = "red"
        for (var i = 0; i < select.children.length; i++) {
            var child = select.children[i];
            if (child.value == value) {
                child.selected = "true";
                break;
            }
        }

        select = $("#width");
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

    var tabNav = $('input[name=tabs]')
    tabNav.forEach(t => {
        t.addEventListener('click', e => {
            for (const c of $('.tab')) {
                c.style.display = 'none'
            }
            $('.' + e.target.id).style.display = 'block'
        })
    })
}

function addCustomUrl(e) {
    e.preventDefault()
    console.log("add custom url")
    var urlTable = $("#customUrlTab");
    var tr = urlTable.insertRow(urlTable.rows.length)
    //url
    var td = $().createElement('td')
    var inp = $().createElement('input')
    inp.type = 'text'
    inp.className = 'url'
    inp.autofocus = true
    td.appendChild(inp)
    tr.appendChild(td)
    //gesture
    td = $().createElement('td')
    var gurl = $().createElement('input')
    gurl.type = 'text'
    gurl.className = 'gurl'
    td.appendChild(gurl)
    tr.appendChild(td)

    td = $().createElement('td')
    var removeLink = $().createElement('a')
    removeLink.className = 'addremove'
    removeLink.title = 'Click to remove custom url mappin'
    removeLink.href = '#'
    removeLink.innerHTML = '-'
    removeLink.addEventListener('click', e => {
        console.log('remove', e.target.parentElement.parentElement)
    });
    td.appendChild(removeLink)
    tr.appendChild(td)
    //focus on url input
    inp.focus()
}

$().addEventListener('DOMContentLoaded', function () {
    restoreOptions();
    $("#option_form").addEventListener("submit", saveConfiguration);
    $('#plus').addEventListener('click', addCustomUrl)
});
