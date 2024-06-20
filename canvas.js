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

function createCanvas() {
  var canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.style.width = document.body.scrollWidth;
  canvas.style.height = document.body.scrollHeight;
  canvas.width = window.document.body.scrollWidth;
  canvas.height = window.document.body.scrollHeight;
  canvas.style.left = "0px";
  canvas.style.top = "0px";
  canvas.style.overflow = "visible";
  canvas.style.position = "absolute";
  canvas.style.zIndex = "10000";
  document.body.appendChild(canvas);
}

function destroyCanvas() {
  var canvas = document.getElementById("canvas");
  if (canvas) {
    try {
      document.body.removeChild(canvas);
    } catch (error) {}
  }
}

function draw(x, y) {
  var canvas = document.getElementById("canvas");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = "#" + myColor;
    ctx.lineWidth = myWidth;
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    lx = x;
    ly = y;
  }
}
