import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";

export default class Player {
  constructor(camera, domElement, shootCallback, uiManager) {
    this.camera = camera;
    this.ui = uiManager;
    this.gunMesh = new THREE.Group();
    this.recoilTimer = 0;
    this.pitch = 0;
    this.yaw = 0;
    this.moveState = { fwd: false, bwd: false, left: false, right: false };

    this.maxHp = 3;
    this.hp = 3;
    this.isDead = false;

    // VARIABEL SCOPING
    this.isScoped = false;
    this.baseFov = 70;
    this.scopeFov = 25; // Makin kecil makin zoom
    this.targetFov = 70;

    this.createWeapon();
    this.setupControls(domElement, shootCallback);
  }

  takeDamage(amount = 1) {
    if (this.isDead) return true;
    this.hp -= amount;
    this.ui.updateHP(this.hp, this.maxHp);
    this.ui.flashDamage();

    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  createWeapon() {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.4,
      metalness: 0.8,
    });
    const stockMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      roughness: 0.9,
    });
    const scopeMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.2,
      metalness: 0.9,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.4),
      bodyMat,
    );
    body.position.z = 0.1;
    this.gunMesh.add(body);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.6, 12),
      bodyMat,
    );
    barrel.rotation.x = -Math.PI / 2;
    barrel.position.z = -0.4;
    this.gunMesh.add(barrel);
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.1, 0.35),
      stockMat,
    );
    guard.position.z = -0.25;
    this.gunMesh.add(guard);
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.25, 0.1),
      stockMat,
    );
    mag.position.set(0, -0.2, 0.15);
    mag.rotation.x = 0.2;
    this.gunMesh.add(mag);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.18, 0.08),
      stockMat,
    );
    grip.position.set(0, -0.15, 0.35);
    grip.rotation.x = -0.3;
    this.gunMesh.add(grip);
    const stockBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.14, 0.3),
      stockMat,
    );
    stockBase.position.set(0, -0.05, 0.45);
    this.gunMesh.add(stockBase);
    const scopeBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.2),
      bodyMat,
    );
    scopeBase.position.set(0, 0.08, 0.1);
    this.gunMesh.add(scopeBase);
    const scopeCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 0.25, 12),
      scopeMat,
    );
    scopeCyl.rotation.x = -Math.PI / 2;
    scopeCyl.position.set(0, 0.11, 0.1);
    this.gunMesh.add(scopeCyl);

    this.gunMesh.position.set(0.25, -0.3, -0.5);
    this.camera.add(this.gunMesh);
  }

  // FUNGSI TOGGLE SCOPE
  toggleScope() {
    this.isScoped = !this.isScoped;
    this.targetFov = this.isScoped ? this.scopeFov : this.baseFov;
    this.ui.toggleScopeUI(this.isScoped);

    // Sembunyikan model senjata saat mengeker (agar tidak menghalangi)
    this.gunMesh.visible = !this.isScoped;
  }

  setupControls(dom, onShoot) {
    // Matikan klik kanan menu bawaan browser
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    const joyBase = document.getElementById("joystick-base");
    const joyStick = document.getElementById("joystick-stick");
    const fireBtn = document.getElementById("fireButton");
    let moveId = null,
      lookId = null,
      mx = 0,
      my = 0,
      lx = 0,
      ly = 0;

    dom.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        for (let t of e.changedTouches) {
          if (t.clientX < window.innerWidth / 2 && moveId === null) {
            moveId = t.identifier;
            mx = t.clientX;
            my = t.clientY;
            joyBase.style.display = "block";
            joyBase.style.left = mx + "px";
            joyBase.style.top = my + "px";
            joyStick.style.transform = `translate(-50%,-50%)`;
          } else if (t.clientX >= window.innerWidth / 2 && lookId === null) {
            lookId = t.identifier;
            lx = t.clientX;
            ly = t.clientY;
          }
        }
      },
      { passive: false },
    );
    dom.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        for (let t of e.changedTouches) {
          if (t.identifier === moveId) {
            const dx = t.clientX - mx,
              dy = t.clientY - my,
              dist = Math.min(50, Math.hypot(dx, dy)),
              ang = Math.atan2(dy, dx);
            joyStick.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px))`;
            this.moveState.fwd = dy < -10;
            this.moveState.bwd = dy > 10;
            this.moveState.left = dx < -10;
            this.moveState.right = dx > 10;
          }
          if (t.identifier === lookId) {
            this.yaw -= (t.clientX - lx) * 0.004;
            this.pitch -= (t.clientY - ly) * 0.004;
            this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
            lx = t.clientX;
            ly = t.clientY;
          }
        }
      },
      { passive: false },
    );
    const end = (e) => {
      e.preventDefault();
      for (let t of e.changedTouches) {
        if (t.identifier === moveId) {
          moveId = null;
          this.moveState.fwd =
            this.moveState.bwd =
            this.moveState.left =
            this.moveState.right =
              false;
          joyBase.style.display = "none";
        }
        if (t.identifier === lookId) lookId = null;
      }
    };
    dom.addEventListener("touchend", end);
    dom.addEventListener("touchcancel", end);
    fireBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.triggerRecoil();
        onShoot();
      },
      { passive: false },
    );

    document.body.addEventListener("click", (e) => {
      if (e.target.id === "musicToggle") return;
      if (document.getElementById("menu").classList.contains("hidden"))
        document.body.requestPointerLock();
    });

    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === document.body) {
        // Sensitivitas mouse turun jika sedang nge-scope
        const sens = this.isScoped ? 0.0006 : 0.002;
        this.yaw -= e.movementX * sens;
        this.pitch -= e.movementY * sens;
        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
      }
    });

    document.addEventListener("mousedown", (e) => {
      if (document.pointerLockElement === document.body) {
        if (e.button === 0) {
          // KLIK KIRI (Tembak)
          this.triggerRecoil();
          onShoot();
        } else if (e.button === 2) {
          // KLIK KANAN (Scope)
          this.toggleScope();
        }
      }
    });

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
            this.triggerRecoil();
            onShoot();
          }
          break;
      }
    };
    document.addEventListener("keydown", (e) => onKey(e, true));
    document.addEventListener("keyup", (e) => onKey(e, false));
  }

  triggerRecoil() {
    this.recoilTimer = 0.2;
  }

  checkCollision(px, pz, radius, obs) {
    if (obs.isBox) {
      let testX = px;
      let testZ = pz;
      if (px < obs.minX) testX = obs.minX;
      else if (px > obs.maxX) testX = obs.maxX;
      if (pz < obs.minZ) testZ = obs.minZ;
      else if (pz > obs.maxZ) testZ = obs.maxZ;
      return Math.hypot(px - testX, pz - testZ) < radius;
    } else {
      return Math.hypot(px - obs.x, pz - obs.z) < radius + obs.radius;
    }
  }

  update(delta, arenaSize, obstacles = [], enemies = []) {
    // Animasi FOV Scope (Tetap Ada)
    if (Math.abs(this.camera.fov - this.targetFov) > 0.5) {
      this.camera.fov += (this.targetFov - this.camera.fov) * 15 * delta;
      this.camera.updateProjectionMatrix();
    }

    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");

    const currentSpeed = this.isScoped ? 4.0 : 10.0;
    const speed = currentSpeed * delta;

    let dirX = 0,
      dirZ = 0;
    let isMoving = false; // Penanda untuk Headbobbing

    if (this.moveState.fwd) {
      dirX -= Math.sin(this.yaw);
      dirZ -= Math.cos(this.yaw);
      isMoving = true;
    }
    if (this.moveState.bwd) {
      dirX += Math.sin(this.yaw);
      dirZ += Math.cos(this.yaw);
      isMoving = true;
    }
    if (this.moveState.left) {
      dirX -= Math.cos(this.yaw);
      dirZ += Math.sin(this.yaw);
      isMoving = true;
    }
    if (this.moveState.right) {
      dirX += Math.cos(this.yaw);
      dirZ -= Math.sin(this.yaw);
      isMoving = true;
    }

    const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (length > 0) {
      dirX = (dirX / length) * speed;
      dirZ = (dirZ / length) * speed;
    }

    let nextX = this.camera.position.x + dirX;
    let nextZ = this.camera.position.z + dirZ;
    const playerRadius = 1.0;

    let collideX = false;
    let collideZ = false;

    for (let obs of obstacles) {
      if (this.checkCollision(nextX, this.camera.position.z, playerRadius, obs))
        collideX = true;
      if (this.checkCollision(this.camera.position.x, nextZ, playerRadius, obs))
        collideZ = true;
    }

    for (let enemy of enemies) {
      const ePos = enemy.mesh.position;
      const enemyRadius = 1.2;
      if (
        Math.hypot(nextX - ePos.x, this.camera.position.z - ePos.z) <
        playerRadius + enemyRadius
      )
        collideX = true;
      if (
        Math.hypot(this.camera.position.x - ePos.x, nextZ - ePos.z) <
        playerRadius + enemyRadius
      )
        collideZ = true;
    }

    if (!collideX) this.camera.position.x = nextX;
    if (!collideZ) this.camera.position.z = nextZ;

    const L = arenaSize - 2;
    this.camera.position.x = Math.max(-L, Math.min(L, this.camera.position.x));
    this.camera.position.z = Math.max(-L, Math.min(L, this.camera.position.z));

    // --- FITUR BARU: HEADBOBBING ---
    // Jika berjalan, ayunkan kamera. Jika berhenti, kembalikan ke tinggi 1.7 secara mulus
    if (this.bobTimer === undefined) this.bobTimer = 0;

    if (isMoving && !collideX && !collideZ) {
      this.bobTimer += delta * (this.isScoped ? 8 : 12); // Ayunan lebih pelan saat mengeker
      this.camera.position.y = 1.7 + Math.sin(this.bobTimer) * 0.1; // Naik turun 10cm
    } else {
      this.bobTimer = 0;
      this.camera.position.y += (1.7 - this.camera.position.y) * 10 * delta;
    }

    // Recoil Senjata (Tetap Ada)
    if (this.recoilTimer > 0) {
      this.recoilTimer -= delta;
      const recoilAmt = this.isScoped ? 0.05 : 0.2;
      this.gunMesh.position.z = -0.5 + this.recoilTimer * recoilAmt;
      this.gunMesh.rotation.x = this.recoilTimer * (this.isScoped ? 0.1 : 0.5);
    } else {
      this.gunMesh.position.z = -0.5;
      this.gunMesh.rotation.x = 0;
    }
  }
}
