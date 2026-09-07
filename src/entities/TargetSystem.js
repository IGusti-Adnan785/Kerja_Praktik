import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";
import { QUESTION_BANK } from "../config/questions.js";

export default class TargetSystem {
  constructor(scene, arenaSize, audioListener) {
    this.scene = scene;
    this.arenaSize = arenaSize;
    this.targets = [];
    this.targetCount = 5;
    this.obstacles = [];
    this.audioListener = audioListener;

    if (this.audioListener) {
      try {
        const ctx = this.audioListener.context;
        const bufferSize = ctx.sampleRate * 1.5;
        this.humBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = this.humBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          const time = i / ctx.sampleRate;
          const beat = (time % 0.75) / 0.75;
          const decay = Math.max(0, 1 - beat * 6);
          const bass = Math.sin(time * 50 * Math.PI * 2);
          const noise = (Math.random() - 0.5) * 0.1;
          data[i] = (bass + noise) * decay * 1.5;
        }
      } catch (e) {}
    }
  }

  spawnTargets(count, treePositions, targetMode, questMode) {
    this.obstacles = treePositions;
    this.clearTargets();

    const filteredBank = QUESTION_BANK.filter((q) => q.type === questMode);
    if (filteredBank.length === 0) return;

    // Shuffle bank soal agar tidak ada soal duplikat jika pasokan cukup
    const shuffledBank = [...filteredBank].sort(() => Math.random() - 0.5);

    this.targetCount = count;
    for (let i = 0; i < count; i++) {
      const problem = shuffledBank[i % shuffledBank.length];
      this.spawnSingle(problem, targetMode);
    }
  }

  clearTargets() {
    this.targets.forEach((t) => {
      if (t.mesh) {
        this.scene.remove(t.mesh);
        this.disposeMesh(t.mesh);
      }
    });
    this.targets = [];
  }

  disposeMesh(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => this.disposeMaterial(m));
        } else {
          this.disposeMaterial(child.material);
        }
      }
    });
  }

  disposeMaterial(mat) {
    if (!mat) return;
    if (mat.map) mat.map.dispose();
    if (mat.emissiveMap) mat.emissiveMap.dispose();
    if (mat.normalMap) mat.normalMap.dispose();
    mat.dispose();
  }

  drawLinearGraph(ctx, w, h, m, c) {
    const centerX = w / 2;
    const centerY = h / 2;
    const xVisibleRange = 10;
    const scale = w / 2 / (xVisibleRange + 2);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#cccccc";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const xLimit = Math.floor(w / 2 / scale);
    const yLimit = Math.floor(h / 2 / scale);

    for (let i = -xLimit; i <= xLimit; i++) {
      if (i === 0) continue;
      const x = centerX + i * scale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillText(i, x, centerY + 8);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let j = -yLimit; j <= yLimit; j++) {
      if (j === 0) continue;
      const y = centerY - j * scale;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillText(j, centerX - 8, y);
    }

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, h);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("X", w - 15, centerY - 15);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Y", centerX + 15, 15);
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("0", centerX - 8, centerY + 8);

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ff0000";
    ctx.beginPath();
    const xStart = -xLimit - 5;
    const yStart = m * xStart + c;
    const xEnd = xLimit + 5;
    const yEnd = m * xEnd + c;

    const cxStart = centerX + xStart * scale;
    const cyStart = centerY - yStart * scale;
    const cxEnd = centerX + xEnd * scale;
    const cyEnd = centerY - yEnd * scale;
    ctx.moveTo(cxStart, cyStart);
    ctx.lineTo(cxEnd, cyEnd);
    ctx.stroke();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  createEnemyMesh(problem) {
    const grp = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x1c2833,
      roughness: 0.8,
      metalness: 0.2,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.6), skinMat);
    body.position.y = 1.2;
    body.castShadow = true;
    grp.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
    head.position.y = 2.4;
    head.castShadow = true;
    grp.add(head);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), eyeMat);
    eyeL.position.set(-0.2, 2.5, 0.41);
    grp.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), eyeMat);
    eyeR.position.set(0.2, 2.5, 0.41);
    grp.add(eyeR);

    const armGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    const armL = new THREE.Mesh(armGeo, skinMat);
    armL.position.set(-0.7, 1.3, 0);
    armL.name = "armL";
    armL.castShadow = true;
    grp.add(armL);

    const armR = new THREE.Mesh(armGeo, skinMat);
    armR.position.set(0.7, 1.3, 0);
    armR.name = "armR";
    armR.castShadow = true;
    grp.add(armR);

    // Opsi Jawaban (Canvas 256x64 cukup untuk memori hemat)
    let shuffledOpts = [...problem.opts].sort(() => Math.random() - 0.5);
    shuffledOpts.forEach((val, i) => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 64;
      const x = c.getContext("2d");
      x.fillStyle = "rgba(20, 0, 0, 0.9)";
      x.fillRect(0, 0, 256, 64);
      x.strokeStyle = "#ff0000";
      x.lineWidth = 6;
      x.strokeRect(3, 3, 250, 58);
      let fontSize = 36;
      x.font = `bold ${fontSize}px Arial`;
      while (x.measureText(val).width > 220 && fontSize > 14) {
        fontSize -= 2;
        x.font = `bold ${fontSize}px Arial`;
      }
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillStyle = "#ffffff";
      x.fillText(val, 128, 32);

      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.35, 0.05),
        new THREE.MeshStandardMaterial({
          map: tex,
          emissive: 0x440000,
          roughness: 0.5,
        }),
      );
      m.position.set(0, 1.7 - i * 0.45, 0.5);
      m.userData = { isTarget: true, val: val, corr: problem.ans, parent: grp };
      grp.add(m);
    });

    // Papan Soal Utama (Dioptimalkan dari 4096x2048 ke 1024x512 = Hemat VRAM 16x!)
    const cQ = document.createElement("canvas");
    const W = 1024;
    const H = 512;
    cQ.width = W;
    cQ.height = H;
    const xQ = cQ.getContext("2d");

    if (problem.type === "GRAPH") {
      this.drawLinearGraph(xQ, W, H, problem.params.m, problem.params.c);
      xQ.font = "bold 28px Arial";
      xQ.fillStyle = "#000";
      xQ.textAlign = "left";
      xQ.fillText(problem.q, 20, 30);
    } else {
      xQ.fillStyle = "#1a1a1a";
      xQ.fillRect(0, 0, W, H);
      xQ.strokeStyle = "#ff5500";
      xQ.lineWidth = 10;
      xQ.strokeRect(5, 5, W - 10, H - 10);
      xQ.font = "bold 52px Courier New";
      xQ.textAlign = "center";
      xQ.textBaseline = "middle";
      xQ.fillStyle = "#ffaa00";
      this.wrapText(xQ, problem.q, W / 2, H / 2 - 40, W - 80, 60);
    }

    const texQ = new THREE.CanvasTexture(cQ);
    texQ.minFilter = THREE.LinearFilter;
    const sprMat = new THREE.SpriteMaterial({ map: texQ });
    const spr = new THREE.Sprite(sprMat);
    spr.scale.set(4, 2, 1);
    spr.position.y = 4.0;
    grp.add(spr);

    return grp;
  }

  spawnSingle(problem, targetMode) {
    const grp = this.createEnemyMesh(problem);

    const bound = 40;
    let sx,
      sz,
      valid = false,
      attempt = 0;

    while (!valid && attempt < 200) {
      sx = (Math.random() - 0.5) * 2 * bound;
      sz = (Math.random() - 0.5) * 2 * bound;
      valid = true;
      for (let obs of this.obstacles) {
        if (obs.isBox) {
          if (
            sx > obs.minX - 2 &&
            sx < obs.maxX + 2 &&
            sz > obs.minZ - 2 &&
            sz < obs.maxZ + 2
          )
            valid = false;
        } else {
          if (Math.hypot(sx - obs.x, sz - obs.z) < 3.0) valid = false;
        }
      }
      attempt++;
    }
    if (!valid) {
      sx = 0;
      sz = 0;
    }

    grp.position.set(sx, 0, sz);
    grp.lookAt(0, 0, 0);
    this.scene.add(grp);

    if (this.audioListener && this.humBuffer) {
      try {
        const sound = new THREE.PositionalAudio(this.audioListener);
        sound.setBuffer(this.humBuffer);
        sound.setRefDistance(3);
        sound.setLoop(true);
        sound.setRolloffFactor(2);
        sound.setVolume(0.8);
        sound.setMaxDistance(30);
        sound.play();
        grp.add(sound);
      } catch (e) {}
    }

    this.targets.push({
      mesh: grp,
      dir: new THREE.Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5,
      ).normalize(),
      baseSpeed: targetMode === "MOVING" ? 1.5 + Math.random() : 0,
      mode: targetMode,
      baseY: grp.position.y,
      aiState: "WANDER",
      attackCooldown: 0,
      losCache: false,
      losTimer: Math.random() * 0.2, // Staggered initial timer to avoid synchronized CPU spikes
    });
  }

  hasLineOfSight(ex, ez, px, pz) {
    const dxFull = px - ex;
    const dzFull = pz - ez;
    const distSq = dxFull * dxFull + dzFull * dzFull;

    if (distSq > 35 * 35) return false;
    const dist = Math.sqrt(distSq);

    const steps = Math.ceil(dist / 1.5);
    const dx = dxFull / steps;
    const dz = dzFull / steps;

    for (let i = 1; i < steps; i++) {
      let cx = ex + dx * i;
      let cz = ez + dz * i;
      for (let obs of this.obstacles) {
        if (this.checkCollision(cx, cz, 0.2, obs)) return false;
      }
    }
    return true;
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

  update(rawDelta, playerPos, playerObj) {
    const delta = Math.min(rawDelta, 0.1);
    const L = this.arenaSize - 5;
    const time = performance.now() * 0.005;
    const enemyRadius = 1.2;
    const playerRadius = 1.0;

    this.targets.forEach((t, index) => {
      t.mesh.position.y = t.baseY + Math.sin(time + index) * 0.15;

      if (t.attackCooldown > 0) t.attackCooldown -= delta;

      if (t.mode === "MOVING") {
        const ePos = t.mesh.position;

        // Throttled / Cached Line of Sight check (Setiap 0.1 detik)
        t.losTimer -= delta;
        if (t.losTimer <= 0) {
          t.losTimer = 0.1; // Cek 10x seminggu alih-alih 60x detik
          t.losCache = this.hasLineOfSight(
            ePos.x,
            ePos.z,
            playerPos.x,
            playerPos.z,
          );
        }

        const dx = playerPos.x - ePos.x;
        const dz = playerPos.z - ePos.z;
        const distToPlayer = Math.hypot(dx, dz);

        if (t.losCache) {
          if (distToPlayer <= enemyRadius + playerRadius + 0.5) {
            t.aiState = "ATTACK";
            if (t.attackCooldown <= 0) {
              playerObj.takeDamage(1);
              t.attackCooldown = 2.0;
            }
          } else {
            t.aiState = "CHASE";
            if (distToPlayer > 0.001) {
              t.dir.set(dx / distToPlayer, 0, dz / distToPlayer);
            }
          }
        } else {
          t.aiState = "WANDER";
        }

        const currentSpeed =
          t.aiState === "CHASE" ? t.baseSpeed * 2.5 : t.baseSpeed;

        if (t.aiState !== "ATTACK") {
          const nextX = ePos.x + t.dir.x * currentSpeed * delta;
          const nextZ = ePos.z + t.dir.z * currentSpeed * delta;

          let isColliding = false;

          for (let obs of this.obstacles) {
            if (this.checkCollision(nextX, nextZ, enemyRadius, obs)) {
              isColliding = true;
              break;
            }
          }

          if (!isColliding) {
            for (let other of this.targets) {
              if (t !== other) {
                if (
                  Math.hypot(
                    nextX - other.mesh.position.x,
                    nextZ - other.mesh.position.z,
                  ) <
                  enemyRadius * 2.2
                ) {
                  isColliding = true;
                  break;
                }
              }
            }
          }

          if (isColliding && t.aiState === "WANDER") {
            t.dir.x += Math.random() - 0.5;
            t.dir.z += Math.random() - 0.5;
            t.dir.normalize();
          } else if (!isColliding) {
            t.mesh.position.x = nextX;
            t.mesh.position.z = nextZ;
          }
        }

        t.mesh.lookAt(
          t.mesh.position.x + t.dir.x,
          t.mesh.position.y,
          t.mesh.position.z + t.dir.z,
        );

        if (Math.abs(t.mesh.position.x) > L) t.dir.x *= -1;
        if (Math.abs(t.mesh.position.z) > L) t.dir.z *= -1;

        const armL = t.mesh.getObjectByName("armL");
        const armR = t.mesh.getObjectByName("armR");
        if (armL && armR) {
          if (t.aiState === "ATTACK") {
            armL.rotation.x = -Math.PI / 2 + Math.sin(time * 10) * 0.5;
            armR.rotation.x = -Math.PI / 2 + Math.sin(time * 10) * 0.5;
          } else {
            const animSpeed = t.aiState === "CHASE" ? 4 : 2;
            armL.rotation.x = Math.sin(time * animSpeed + index) * 0.6;
            armR.rotation.x = -Math.sin(time * animSpeed + index) * 0.6;
          }
        }
      }
    });
  }

  removeTarget(mesh) {
    this.scene.remove(mesh);
    this.disposeMesh(mesh);
    this.targets = this.targets.filter((t) => t.mesh !== mesh);
    this.targetCount--;
    return this.targetCount;
  }
}
