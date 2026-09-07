export default class InputController {
  constructor(domElement, onShoot, onScopeToggle) {
    this.domElement = domElement || document.body;
    this.onShoot = onShoot;
    this.onScopeToggle = onScopeToggle;

    this.moveState = { fwd: false, bwd: false, left: false, right: false };
    this.yaw = 0;
    this.pitch = 0;

    this.touchMoveId = null;
    this.touchLookId = null;
    this.moveOriginX = 0;
    this.moveOriginY = 0;
    this.lookLastX = 0;
    this.lookLastY = 0;

    this.init();
  }

  init() {
    // Matikan menu konteks klik kanan
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
  }

  setupKeyboard() {
    const onKey = (e, isDown) => {
      switch (e.code) {
        case "KeyW":
          this.moveState.fwd = isDown;
          break;
        case "KeyS":
          this.moveState.bwd = isDown;
          break;
        case "KeyA":
          this.moveState.left = isDown;
          break;
        case "KeyD":
          this.moveState.right = isDown;
          break;
        case "Space":
          if (isDown && document.pointerLockElement === document.body) {
            if (this.onShoot) this.onShoot();
          }
          break;
      }
    };

    document.addEventListener("keydown", (e) => onKey(e, true));
    document.addEventListener("keyup", (e) => onKey(e, false));
  }

  setupMouse() {
    document.body.addEventListener("click", (e) => {
      if (
        e.target.tagName === "BUTTON" ||
        e.target.closest("button") ||
        e.target.id === "musicToggle"
      ) {
        return;
      }

      const menu = document.getElementById("menu");
      if (menu && menu.classList.contains("hidden")) {
        try {
          document.body.requestPointerLock();
        } catch (err) {}
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === document.body) {
        const sens = this.isScoped ? 0.0006 : 0.002;
        this.yaw -= e.movementX * sens;
        this.pitch -= e.movementY * sens;
        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
      }
    });

    document.addEventListener("mousedown", (e) => {
      if (
        e.target.tagName === "BUTTON" ||
        e.target.closest("button") ||
        e.target.id === "musicToggle"
      ) {
        return;
      }

      if (document.pointerLockElement === document.body) {
        if (e.button === 0) {
          if (this.onShoot) this.onShoot();
        } else if (e.button === 2) {
          if (this.onScopeToggle) this.onScopeToggle();
        }
      }
    });
  }

  setupTouch() {
    const joyBase = document.getElementById("joystick-base");
    const joyStick = document.getElementById("joystick-stick");
    const fireBtn = document.getElementById("fireButton");
    const aimBtn =
      document.getElementById("btn-aim") ||
      document.getElementById("aimButton");

    this.domElement.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        for (let t of e.changedTouches) {
          if (t.clientX < window.innerWidth / 2 && this.touchMoveId === null) {
            this.touchMoveId = t.identifier;
            this.moveOriginX = t.clientX;
            this.moveOriginY = t.clientY;
            if (joyBase) {
              joyBase.style.display = "block";
              joyBase.style.left = this.moveOriginX + "px";
              joyBase.style.top = this.moveOriginY + "px";
            }
            if (joyStick) {
              joyStick.style.transform = `translate(-50%,-50%)`;
            }
          } else if (
            t.clientX >= window.innerWidth / 2 &&
            this.touchLookId === null
          ) {
            this.touchLookId = t.identifier;
            this.lookLastX = t.clientX;
            this.lookLastY = t.clientY;
          }
        }
      },
      { passive: false },
    );

    this.domElement.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        for (let t of e.changedTouches) {
          if (t.identifier === this.touchMoveId) {
            const dx = t.clientX - this.moveOriginX;
            const dy = t.clientY - this.moveOriginY;
            const dist = Math.min(50, Math.hypot(dx, dy));
            const ang = Math.atan2(dy, dx);

            if (joyStick) {
              joyStick.style.transform = `translate(calc(-50% + ${
                Math.cos(ang) * dist
              }px), calc(-50% + ${Math.sin(ang) * dist}px))`;
            }

            this.moveState.fwd = dy < -10;
            this.moveState.bwd = dy > 10;
            this.moveState.left = dx < -10;
            this.moveState.right = dx > 10;
          }
          if (t.identifier === this.touchLookId) {
            const sens = this.isScoped ? 0.002 : 0.004;
            this.yaw -= (t.clientX - this.lookLastX) * sens;
            this.pitch -= (t.clientY - this.lookLastY) * sens;
            this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
            this.lookLastX = t.clientX;
            this.lookLastY = t.clientY;
          }
        }
      },
      { passive: false },
    );

    const endTouch = (e) => {
      e.preventDefault();
      for (let t of e.changedTouches) {
        if (t.identifier === this.touchMoveId) {
          this.touchMoveId = null;
          this.moveState.fwd = false;
          this.moveState.bwd = false;
          this.moveState.left = false;
          this.moveState.right = false;
          if (joyBase) joyBase.style.display = "none";
        }
        if (t.identifier === this.touchLookId) {
          this.touchLookId = null;
        }
      }
    };

    this.domElement.addEventListener("touchend", endTouch);
    this.domElement.addEventListener("touchcancel", endTouch);

    if (fireBtn) {
      fireBtn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.onShoot) this.onShoot();
        },
        { passive: false },
      );
    }

    if (aimBtn) {
      aimBtn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.onScopeToggle) this.onScopeToggle();
        },
        { passive: false },
      );
    }
  }

  setScoped(isScoped) {
    this.isScoped = isScoped;
  }

  reset() {
    this.moveState = { fwd: false, bwd: false, left: false, right: false };
    this.yaw = 0;
    this.pitch = 0;
    this.touchMoveId = null;
    this.touchLookId = null;
  }
}
