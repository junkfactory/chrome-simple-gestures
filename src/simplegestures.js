const PI = 3.141592653589793;

const Actions = {
  NewTab: "newtab",
  NextTab: "nexttab",
  PrevTab: "prevtab",
};

class Coords {
  current = { x: 0, y: 0 };
  next = { x: 0, y: 0 };
  last = { x: 0, y: 0 };
  phi = 0;
}

class Config {
  enabled = true;
  trail = {
    enabled: true,
    color: "red",
    width: 3,
  };
  rockerEnabled = true;
  gestures = {};
  actionMap = {};
  update(config) {
    this.rockerEnabled = Boolean(config.rockerEnabled);
    this.trail.enabled = Boolean(config.trailEnabled);
    this.trail.color = config.trailColor;
    this.trail.width = config.trailWidth;
    this.actionMap = invertHash(config.gestures);
    this.enabled =
      !config?.disabled_domains?.includes(window.location.hostname) || false;
  }
}

class SimpleGesture {
  #loaded = false;
  #rmouseDown = false;
  #moved = false;
  #currentGesture = "";
  #previousGesture = "";
  #currentElement = null;
  #suppress = 1;
  #config;
  #coords;
  #link;
  #canvas;
  #elementFromPoint;

  constructor() {
    this.#config = new Config();
    this.#coords = new Coords();
    this.#canvas = new Canvas();
  }

  #onStart(event) {
    if (!this.#loaded) {
      this.#watch();
      this.#loaded = true;
    }
    this.#coords.current.y = event.pageX;
    this.#coords.current.x = event.pageY;
    this.#coords.last.x = my;
    this.#coords.last.y = mx;
    this.#currentGesture = "";
    this.#previousGesture = "";
    this.#moved = false;
    this.#link = this.#determineLink(event.target, 10);
  }

  #onMove(event) {
    const ny = event.pageX;
    const nx = event.pageY;
    const mx = this.#coords.current.x;
    const my = this.#coords.current.y;
    const r = Math.sqrt(Math.pow(nx - mx, 2) + Math.pow(ny - my, 2));
    if (r > 16) {
      const phi = Math.atan2(ny - my, nx - mx);
      if (phi < 0) {
        phi += 2 * PI;
      }

      let tmove;
      if (phi >= PI / 4 && phi < (3 * PI) / 4) {
        tmove = "R";
      } else if (phi >= (3 * PI) / 4 && phi < (5 * PI) / 4) {
        tmove = "U";
      } else if (phi >= (5 * PI) / 4 && phi < (7 * PI) / 4) {
        tmove = "L";
      } else if (phi >= (7 * PI) / 4 || phi < PI / 4) {
        tmove = "D";
      }

      if (tmove != this.#previousGesture) {
        this.#currentGesture += tmove;
        this.#previousGesture = tmove;
      }

      if (this.#config.trail.enabled) {
        if (this.#moved == false) {
          this.#canvas.create();
        }
        this.#canvas.draw(ny, nx);
      }
      this.#moved = true;
      this.#coords.current.x = nx;
      this.#coords.current.y = ny;
    }
  }

  #execute() {
    let action = this.#config.actionMap[this.#currentGesture];
    if (action) {
      if (isUrl(action)) {
        this.#link = action;
        action = Actions.NewTab;
      }
      browser.runtime
        .sendMessage({ msg: action, url: this.#link })
        .then((result) => {
          if (result != null) {
            this.#link = null;
          }
        })
        .catch((error) => console.error(`Failed to send ${action}`, error));
    }
  }

  #determineLink(target, allowedDrillCount) {
    if (target.href) {
      return target.href;
    }
    if (target.parentElement && allowedDrillCount > 0) {
      return this.#determineLink(target.parentElement, allowedDrillCount - 1);
    }
    return null;
  }

  #watch() {
    browser.runtime.sendMessage({ msg: "config" }).then(
      (response) => {
        if (response) {
          this.#config.update(response.resp);
        }
      },
      (error) => console.error(error),
    );

    browser.runtime.onMessage.addListener((request) => {
      switch (request.msg) {
        case "tabs.config.update":
          this.#config.update(request.updatedConfig);
          break;
      }
    });
  }

  #contextMenu() {
    if (!this.#config.enabled) {
      return true;
    }

    if (this.#suppress) {
      return false;
    }

    this.#rmouseDown = false;
    this.#suppress++;
    return true;
  }

  #mouseUp(event) {
    if (!this.#config.enabled) {
      return;
    }
    if (this.#rmouseDown && event.buttons > 0) {
      if (event.button == 2) {
        browser.runtime.sendMessage({ msg: Actions.NextTab });
      } else if (event.button == 0) {
        browser.runtime.sendMessage({ msg: Actions.PrevTab });
        ++this.#suppress;
      }
    } else if (event.button == 2) {
      if (this.#moved) {
        this.#execute();
      } else {
        --this.#suppress;
      }
    }
    this.#rmouseDown = false;
    //always remove canvas on mouse up
    this.#canvas.destroy();
  }

  #mouseDown(event) {
    if (!this.#config.enabled) {
      return;
    }
    this.#rmouseDown = event.button == 2;
    if (this.#rmouseDown && this.#suppress) {
      this.#onStart(event);
    }
  }

  #mouseMove(event) {
    if (!this.#config.enabled) {
      return;
    }
    //track the mouse if we are holding the right button
    if (this.#currentElement) {
      this.#currentElement.removeEventListener(
        "mousedown",
        this.#mouseDown.bind(this),
      );
    }
    this.#currentElement = this.#elementFromPoint(event.clientX, event.clientY);
    if (this.#currentElement) {
      this.#currentElement.addEventListener(
        "mousedown",
        this.#mouseDown.bind(this),
      );
    }
    if (this.#rmouseDown) {
      this.#onMove(event);
    }
  }

  install(doc) {
    this.#elementFromPoint = doc.elementFromPoint.bind(doc);
    const capture = { capture: true };
    doc.addEventListener("contextmenu", this.#contextMenu.bind(this), capture);
    doc.addEventListener("mousemove", this.#mouseMove.bind(this), capture);
    doc.addEventListener("mouseup", this.#mouseUp.bind(this), capture);
    doc.addEventListener("mousedown", this.#mouseDown.bind(this), capture);
    doc.addEventListener("DOMContentLoaded", this.#watch.bind(this), capture);
  }
}

const simpleGesture = new SimpleGesture();
simpleGesture.install(document);
