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
