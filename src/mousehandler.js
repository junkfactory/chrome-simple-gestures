console.debug = () => {};

class MouseHandler {
  #gesture;
  #rmouseDown = false;
  #currentElement = null;
  #suppress = 1;
  #elementFromPoint;
  #elementMouseDown;

  constructor(gesture) {
    this.#gesture = gesture;
    this.#elementMouseDown = this.#mouseDown.bind(this);
  }

  #contextMenu(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }

    if (this.#suppress) {
      console.debug("context menu suppress", {
        event: event,
        rmouseDown: this.#rmouseDown,
        suppress: this.#suppress,
      });
      return false;
    }

    this.#rmouseDown = false;
    this.#suppress++;
    console.debug("context menu", {
      event: event,
      rmouseDown: this.#rmouseDown,
      suppress: this.#suppress,
    });
    return true;
  }

  #mouseUp(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }
    if (this.#rmouseDown && event.buttons > 0) {
      if (event.button == 2) {
        browser.runtime.sendMessage({ msg: Actions.NextTab });
      } else if (event.button == 0) {
        browser.runtime.sendMessage({ msg: Actions.PrevTab });
        ++this.#suppress;
      }
    } else if (event.button == 2) {
      if (this.#gesture.moved) {
        this.#gesture.execute();
      } else {
        --this.#suppress;
      }
    }
    this.#rmouseDown = false;
    //always remove canvas on mouse up
    this.#gesture.stop();
    console.debug("mouse up", event);
    return false;
  }

  #mouseDown(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }
    this.#rmouseDown = event.button == 2;
    if (this.#rmouseDown && this.#suppress) {
      this.#gesture.start(event);
      return false;
    }
    console.debug("mouse down", {
      rmouseDown: this.#rmouseDown,
      suppress: this.#suppress,
    });
    return true;
  }

  #mouseMove(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }
    //track the mouse if we are holding the right button
    if (this.#currentElement) {
      this.#currentElement.removeEventListener(
        "mousedown",
        this.#elementMouseDown,
      );
    }
    this.#currentElement = this.#elementFromPoint(event.clientX, event.clientY);
    if (this.#currentElement) {
      this.#currentElement.addEventListener(
        "mousedown",
        this.#elementMouseDown,
      );
    }
    if (this.#rmouseDown) {
      this.#gesture.move(event);
      return false;
    }
    return true;
  }

  install(doc) {
    this.#elementFromPoint = doc.elementFromPoint.bind(doc);
    doc.oncontextmenu = this.#contextMenu.bind(this);
    doc.onmousemove = this.#mouseMove.bind(this);
    doc.onmouseup = this.#mouseUp.bind(this);
    doc.onmousedown = this.#mouseDown.bind(this);
    this.#gesture.install(doc);
  }
}
