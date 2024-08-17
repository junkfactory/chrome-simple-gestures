class MouseHandler {
  #gesture;
  #rmouseDown = false;
  #currentElement = null;
  #suppress = 1;
  #elementFromPoint;

  constructor(gesture) {
    this.#gesture = gesture;
  }

  #contextMenu() {
    if (!this.#gesture.config.enabled) {
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
    if (!this.#gesture.config.enabled) {
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
      if (this.#gesture.moved) {
        this.#gesture.execute();
      } else {
        --this.#suppress;
      }
    }
    this.#rmouseDown = false;
    //always remove canvas on mouse up
    this.#gesture.stop();
  }

  #mouseDown(event) {
    if (!this.#gesture.config.enabled) {
      return;
    }
    this.#rmouseDown = event.button == 2;
    if (this.#rmouseDown && this.#suppress) {
      this.#gesture.start(event);
    }
  }

  #mouseMove(event) {
    if (!this.#gesture.config.enabled) {
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
      this.#gesture.move(event);
    }
  }

  install(doc) {
    this.#elementFromPoint = doc.elementFromPoint.bind(doc);
    const capture = { capture: true };
    doc.addEventListener("contextmenu", this.#contextMenu.bind(this), capture);
    doc.addEventListener("mousemove", this.#mouseMove.bind(this), capture);
    doc.addEventListener("mouseup", this.#mouseUp.bind(this), capture);
    doc.addEventListener("mousedown", this.#mouseDown.bind(this), capture);
    this.#gesture.install(doc);
  }
}
