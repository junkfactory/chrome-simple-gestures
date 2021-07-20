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
const colorNameToCode = {
    "red": "ff3300",
    "green": "008000",
    "blue": "00008B",
    "yellow": "FFFF00"
}

const colorCodeToName = {
    "ff3300": "red",
    "008000": "green",
    "00008B": "blue",
    "FFFF00": "yellow"
}

const defaultGestures = { "R": "forward", "L": "back", "D": "closetab" }

const commandMapping = {
    "History Back": "back",
    "History Forward": "forward",
    "Reload (bypass cache)": "reload",
    "Open New Tab": "newtab",
    "Close Current Tab": "closetab",
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
        inp.name = 'gvalue'
        inp.id = commandMapping[key]
        if (gests[commandMapping[key]])
            inp.value = gests[commandMapping[key]]
        tr.appendChild(td)
        td.appendChild(inp)
    }

    //build custom urls config
    for (const g in config.gestures) {
        if (Object.hasOwnProperty.call(config.gestures, g)) {
            const url = config.gestures[g];
            if (url.startsWith('http')) {
                addCustomUrl(url, g)
            }
        }
    }
    
}

function addCustomUrl(url, g) {
    var urlTable = $("#customUrlTab");
    var tr = urlTable.insertRow(urlTable.rows.length)
    //url
    var td = $().createElement('td')
    var inp = $().createElement('input')
    inp.type = 'text'
    inp.name = 'url'
    inp.value = url ? url : ''
    td.appendChild(inp)
    tr.appendChild(td)
    //gesture
    td = $().createElement('td')
    var gurl = $().createElement('input')
    gurl.type = 'text'
    gurl.name = 'gvalue'
    gurl.value = g ? g : ''
    td.appendChild(gurl)
    tr.appendChild(td)

    td = $().createElement('td')
    var removeLink = $().createElement('a')
    removeLink.className = 'addremove'
    removeLink.title = 'Click to remove custom url mappin'
    removeLink.href = '#'
    removeLink.innerHTML = '-'
    removeLink.addEventListener('click', e => {
        $('#customUrlTab tbody').removeChild(e.target.parentElement.parentElement)
    });
    td.appendChild(removeLink)
    tr.appendChild(td)
    //focus on url input
    inp.focus()
}

//validate configurations
function validateConfiguration(optionForm) {
    var status = $('#status')
    status.innerHTML = ''
    var definedGestures = []
    for (const i of optionForm.querySelectorAll('input[type=text]')) {
        i.classList.remove('error')
        var gval = i.value.trim()
        switch(i.name) {
            case 'url':
                try {
                    new URL(gval)
                } catch (error) {
                    displayError(i, 'Invalid url!')
                }
                break;
            case 'gvalue':
                if (definedGestures.indexOf(gval) > -1) {
                    displayError(i, 'Duplicate gesture defined.')
                }
                else if (gval == '' || !/^[DULR]*$/.test(gval)) {
                    displayError(i, 'Invalid gesture pattern!')
                } else {
                    definedGestures.push(gval)
                }
                break;
        }
    }
    return status.innerHTML == ''
}

// Saves options to local storage.
function saveConfiguration(e) {
    e.preventDefault();
    if (!validateConfiguration(e.target)) {
        return false;
    }
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

    var url = null;
    for (const i of $('#option_form input')) {
        if (url == null && i.name == 'url') {
            url = i.value;
        } else if (url != null && i.name == 'gvalue') {
            config.gestures[i.value] = url
            url = null
        } else {
            var s = i.parentElement.parentElement.children[0].textContent
            if (i.value.length > 0) {
                config.gestures[commandMapping[s]] = i.value;
            } else {
                delete config.gestures[commandMapping[s]];
            }
        }
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
        console.log('options', config)
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
}

$().addEventListener('DOMContentLoaded', function () {
    restoreOptions();
    var tabNav = $('input[name=tabs]')
    tabNav.forEach(t => {
        t.addEventListener('click', e => switchTab(e.target.id))
    })
    $("#option_form").addEventListener("submit", saveConfiguration);
    $('#plus').addEventListener('click', e => {
        e.preventDefault()
        addCustomUrl()
    })
});
