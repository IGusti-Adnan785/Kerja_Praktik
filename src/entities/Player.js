import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";
import InputController from "../systems/InputController.js";

export default class Player {
  constructor(camera, domElement, shootCallback, uiManager) {
    this.camera = camera;
    this.ui = uiManager;
    this.gunMesh = new THREE.Group();
    this.recoilTimer = 0;

    this.maxHp = 3;
    this.hp = 3;
    this.isDead = false;

    // VARIABEL SCOPING
    this.isScoped = false;
    this.baseFov = 70;
    this.scopeFov = 25; // Makin kecil makin zoom
    this.targetFov = 70;
    this.bobTimer = 0;

    this.createWeapon();

    this.input = new InputController(
      domElement,
      () => {
        if (this.isDead) return;
        this.triggerRecoil();
        if (shootCallback) shootCallback();
      },
      () => {
        if (this.isDead) return;
        this.toggleScope();
      },
    );
  }

  get yaw() {
    return this.input ? this.input.yaw : 0;
  }
  set yaw(v) {
    if (this.input) this.input.yaw = v;
  }

  get pitch() {
    return this.input ? this.input.pitch : 0;
  }
  set pitch(v) {
    if (this.input) this.input.pitch = v;
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

  heal(amount = 1) {
    if (this.isDead || this.hp >= this.maxHp) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.ui.updateHP(this.hp, this.maxHp);
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

  toggleScope() {
    this.isScoped = !this.isScoped;
    this.targetFov = this.isScoped ? this.scopeFov : this.baseFov;
    if (this.input) this.input.setScoped(this.isScoped);
    if (this.ui) this.ui.toggleScopeUI(this.isScoped);

    // Sembunyikan model senjata saat mengeker
    this.gunMesh.visible = !this.isScoped;
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

  update(rawDelta, arenaSize, obstacles = [], enemies = []) {
    const delta = Math.min(rawDelta, 0.1);

    // Animasi FOV Scope
    if (Math.abs(this.camera.fov - this.targetFov) > 0.5) {
      this.camera.fov += (this.targetFov - this.camera.fov) * 15 * delta;
      this.camera.updateProjectionMatrix();
    }

    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");

    const currentSpeed = this.isScoped ? 4.0 : 10.0;
    const speed = currentSpeed * delta;

    let dirX = 0,
      dirZ = 0;
    let isMoving = false;

    const moveState = this.input.moveState;

    if (moveState.fwd) {
      dirX -= Math.sin(this.yaw);
      dirZ -= Math.cos(this.yaw);
      isMoving = true;
    }
    if (moveState.bwd) {
      dirX += Math.sin(this.yaw);
      dirZ += Math.cos(this.yaw);
      isMoving = true;
    }
    if (moveState.left) {
      dirX -= Math.cos(this.yaw);
      dirZ += Math.sin(this.yaw);
      isMoving = true;
    }
    if (moveState.right) {
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
    const playerRadius = 0.8;

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
      const enemyRadius = 1.0;
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

    // Headbobbing Effect
    if (isMoving && !collideX && !collideZ) {
      this.bobTimer += delta * (this.isScoped ? 8 : 12);
      this.camera.position.y = 1.7 + Math.sin(this.bobTimer) * 0.08;
    } else {
      this.bobTimer = 0;
      this.camera.position.y += (1.7 - this.camera.position.y) * 10 * delta;
    }

    // Recoil Senjata
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

  reset() {
    this.hp = this.maxHp;
    this.isDead = false;
    this.isScoped = false;
    this.targetFov = this.baseFov;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.gunMesh.visible = true;
    if (this.input) this.input.reset();
  }
}
