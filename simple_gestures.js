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

var rmousedown = false, moved = false;
var trail = false
var mx, my, nx, ny, lx, ly, phi
var currentGesture = "", previousGesture = ""
var pi = 3.14159
var suppress = 1
var myGests, gestureActionMap;
var link, ls, myColor = "red", myWidth = 3
var loaded = false
var link = null

function invertHash(hash) {
    inv = {}
    for (key in hash)
        inv[hash[key]] = key
    return inv
}

function createCanvas() {
    var canvas = document.createElement('canvas');
    canvas.id = "canvas"
    canvas.style.width = document.body.scrollWidth
    canvas.style.height = document.body.scrollHeight
    canvas.width = window.document.body.scrollWidth
    canvas.height = window.document.body.scrollHeight
    canvas.style.left = "0px";
    canvas.style.top = "0px";
    canvas.style.overflow = 'visible';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = "10000"
    document.body.appendChild(canvas);
}

function destroyCanvas() {
    var canvas = document.getElementById('canvas')
    if (canvas) {
        try {
            document.body.removeChild(canvas);
        } catch (error) {
            
        }
    }
}

function draw(x, y) {
    var ctx = document.getElementById('canvas').getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = '#' + myColor
    ctx.lineWidth = myWidth
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke()
    lx = x
    ly = y
}

function onStart(event) {
    if (!loaded) {
        watchGestures()
        loaded = true
    }
    my = event.pageX;
    mx = event.pageY;
    lx = my
    ly = mx
    currentGesture = ""
    previousGesture = ""
    moved = false
    if (event.target.href) {
        link = event.target.href
    }
    else if (event.target.parentElement.href) {
        link = event.target.parentElement.href
    }
    else {
        link = null
    }
}

function onMove(event) {
    ny = event.pageX;
    nx = event.pageY;
    var r = Math.sqrt(Math.pow(nx - mx, 2) + Math.pow(ny - my, 2))
    if (r > 16) {
        phi = Math.atan2(ny - my, nx - mx)
        if (phi < 0) phi += 2. * pi
        if (phi >= pi / 4. && phi < 3. * pi / 4.)
            var tmove = "R"
        else if (phi >= 3. * pi / 4. && phi < 5. * pi / 4.)
            var tmove = "U"
        else if (phi >= 5. * pi / 4. && phi < 7. * pi / 4.)
            var tmove = "L"
        else if (phi >= 7. * pi / 4. || phi < pi / 4.)
            var tmove = "D"
        if (tmove != previousGesture) {
            currentGesture += tmove
            previousGesture = tmove
        }

        if (trail) {
            if (moved == false) {
                createCanvas();
            }
            draw(ny, nx);
        }
        moved = true
        mx = nx
        my = ny
    }
}

function executeGesture() {
    var action = gestureActionMap[currentGesture];
    if (action) {
        chrome.runtime.sendMessage({ msg: action, url: link }, result => {
            if (result != null) {
                //console.log("result", result);
            }
        });
    }
}

document.onmousedown = function (event) {
    rmousedown = event.button == 2;
    if (rmousedown && suppress) {
        onStart(event);
    }
};

document.onmousemove = function (event) {
    //track the mouse if we are holding the right button
    if (rmousedown) {
        onMove(event);
    }
};

document.onmouseup = function (event) {
    //right mouse release
    if (event.button == 2) {
        // console.log('suppress is '+suppress)
        if (moved) {
            executeGesture();
        }
        else {
            --suppress
        }
    }
    rmousedown = false
    //always remove canvas on mouse up
    destroyCanvas();
};

document.oncontextmenu = function () {
    if (suppress)
        return false
    else {
        rmousedown = false;
        suppress++
        return true
    }
};

function watchGestures(name) {
    chrome.runtime.sendMessage({ msg: "config.trailColor" }, function (response) {
        if (response) {
            myColor = response.resp
        }
    });
    chrome.runtime.sendMessage({ msg: "config.trailWidth" }, function (response) {
        if (response) {
            myWidth = response.resp
        }
    });
    chrome.runtime.sendMessage({ msg: "config.gestures" }, function (response) {
        if (response) {
            myGests = response.resp
        }
        gestureActionMap = invertHash(myGests)
    });

    chrome.runtime.sendMessage({ msg: "config.trailEnabled" }, function (response) {
        if (response) {
            trail = Boolean(response.resp)
        }
    });
}

document.addEventListener('DOMContentLoaded', watchGestures);
