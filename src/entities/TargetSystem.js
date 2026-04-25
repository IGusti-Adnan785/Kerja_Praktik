import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";
import { QUESTION_BANK } from "../config/questions.js";

export default class TargetSystem {
  constructor(scene, arenaSize, audioListener) {
    this.scene = scene;
    this.arenaSize = arenaSize;
    this.targets = [];
    this.targetCount = 5;
    this.obstacles = [];
    this.audioListener = audioListener; // Ambil telinga pemain dari GameApp

    // Buat file suara digital (Dengungan Mengerikan)
    if (this.audioListener) {
      const ctx = this.audioListener.context;
      const bufferSize = ctx.sampleRate * 2; // 2 detik loop
      this.humBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = this.humBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Kombinasi suara mesin rendah dan static noise
        data[i] = Math.sin(i * 0.05) * 0.4 + Math.random() * 0.1;
      }
    }
  }

  spawnTargets(count, treePositions, targetMode, questMode) {
    this.obstacles = treePositions;
    this.clearTargets();
    this.targetCount = count;
    for (let i = 0; i < count; i++) this.spawnSingle(targetMode, questMode);
  }

  clearTargets() {
    this.targets.forEach((t) => this.scene.remove(t.mesh));
    this.targets = [];
  }

  // (Fungsi drawLinearGraph dan wrapText tetap dipertahankan)
  drawLinearGraph(ctx, w, h, m, c) {
    const centerX = w / 2;
    const centerY = h / 2;
    const xVisibleRange = 10;
    const scale = w / 2 / (xVisibleRange + 2);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cccccc";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 60px Arial";
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
      ctx.fillText(i, x, centerY + 20);
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
      ctx.fillText(j, centerX - 20, y);
    }

    ctx.lineWidth = 8;
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, h);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("X", w - 40, centerY - 40);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Y", centerX + 40, 40);
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("0", centerX - 20, centerY + 20);

    ctx.lineWidth = 12;
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
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
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

    let shuffledOpts = [...problem.opts].sort(() => Math.random() - 0.5);
    shuffledOpts.forEach((val, i) => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 128;
      const x = c.getContext("2d");
      x.fillStyle = "rgba(20, 0, 0, 0.9)";
      x.fillRect(0, 0, 512, 128);
      x.strokeStyle = "#ff0000";
      x.lineWidth = 10;
      x.strokeRect(5, 5, 502, 118);
      let fontSize = 80;
      x.font = `bold ${fontSize}px Arial`;
      while (x.measureText(val).width > 450 && fontSize > 20) {
        fontSize -= 5;
        x.font = `bold ${fontSize}px Arial`;
      }
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillStyle = "#ffffff";
      x.fillText(val, 256, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 16;
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

    const cQ = document.createElement("canvas");
    const W = 4096;
    const H = 2048;
    cQ.width = W;
    cQ.height = H;
    const xQ = cQ.getContext("2d");
    if (problem.type === "GRAPH") {
      this.drawLinearGraph(xQ, W, H, problem.params.m, problem.params.c);
      xQ.font = "bold 80px Arial";
      xQ.fillStyle = "#000";
      xQ.textAlign = "left";
      xQ.fillText(problem.q, 40, 100);
    } else {
      xQ.fillStyle = "#1a1a1a";
      xQ.fillRect(0, 0, W, H);
      xQ.strokeStyle = "#ff5500";
      xQ.lineWidth = 20;
      xQ.strokeRect(10, 10, W - 20, H - 20);
      xQ.font = "bold 200px Courier New";
      xQ.textAlign = "center";
      xQ.textBaseline = "middle";
      xQ.fillStyle = "#ffaa00";
      this.wrapText(xQ, problem.q, W / 2, H / 2 - 160, W - 320, 280);
    }
    const texQ = new THREE.CanvasTexture(cQ);
    texQ.anisotropy = 16;
    const sprMat = new THREE.SpriteMaterial({ map: texQ });
    const spr = new THREE.Sprite(sprMat);
    spr.scale.set(4, 2, 1);
    spr.position.y = 4.0;
    grp.add(spr);

    return grp;
  }

  spawnSingle(targetMode, questMode) {
    const filteredBank = QUESTION_BANK.filter((q) => q.type === questMode);
    const problem =
      filteredBank[Math.floor(Math.random() * filteredBank.length)];
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

    // --- FITUR BARU: PASANG SPEAKER 3D DI BADAN MONSTER ---
    if (this.audioListener) {
      const sound = new THREE.PositionalAudio(this.audioListener);
      sound.setBuffer(this.humBuffer);
      sound.setRefDistance(5); // Jarak suara terdengar keras
      sound.setLoop(true);
      sound.setVolume(1.0);
      sound.play();
      grp.add(sound); // Tempelkan di badan monster
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
    });
  }

  hasLineOfSight(ex, ez, px, pz) {
    const dist = Math.hypot(px - ex, pz - ez);
    if (dist > 35) return false; // Jarak pandang maksimal 35 meter

    const steps = Math.ceil(dist / 1.0); // Cek setiap 1 meter
    const dx = (px - ex) / steps;
    const dz = (pz - ez) / steps;

    for (let i = 1; i < steps; i++) {
      let cx = ex + dx * i;
      let cz = ez + dz * i;
      // Jika sinar mengenai rintangan di tengah jalan, pandangan terhalang
      for (let obs of this.obstacles) {
        if (this.checkCollision(cx, cz, 0.1, obs)) return false;
      }
    }
    return true; // Pandangan bersih tanpa halangan!
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

  update(delta, playerPos, playerObj) {
    const L = this.arenaSize - 5;
    const time = performance.now() * 0.005;
    const enemyRadius = 1.2;
    const playerRadius = 1.0;

    this.targets.forEach((t, index) => {
      t.mesh.position.y = t.baseY + Math.sin(time + index) * 0.15;

      // Kurangi cooldown serangan setiap frame
      if (t.attackCooldown > 0) t.attackCooldown -= delta;

      if (t.mode === "MOVING") {
        const ePos = t.mesh.position;
        const distToPlayer = Math.hypot(
          playerPos.x - ePos.x,
          playerPos.z - ePos.z,
        );

        // --- OTAK AI (STATE MACHINE) ---
        if (this.hasLineOfSight(ePos.x, ePos.z, playerPos.x, playerPos.z)) {
          // Pemain terlihat!
          if (distToPlayer <= enemyRadius + playerRadius + 0.5) {
            // Jarak dekat: SERANG!
            t.aiState = "ATTACK";
            if (t.attackCooldown <= 0) {
              const isDead = playerObj.takeDamage(1);
              t.attackCooldown = 2.0; // Cooldown 2 detik sebelum serang lagi
            }
          } else {
            // Jarak jauh: KEJAR!
            t.aiState = "CHASE";
            const dx = playerPos.x - ePos.x;
            const dz = playerPos.z - ePos.z;
            t.dir.set(dx / distToPlayer, 0, dz / distToPlayer); // Ubah arah ke pemain
          }
        } else {
          // Pemain tersembunyi di balik tembok/pohon
          t.aiState = "WANDER";
        }

        // Tentukan Kecepatan: Lari lebih cepat saat mengejar
        const currentSpeed =
          t.aiState === "CHASE" ? t.baseSpeed * 2.5 : t.baseSpeed;

        // Jika sedang menyerang, berhenti berjalan sesaat
        if (t.aiState !== "ATTACK") {
          const nextX = ePos.x + t.dir.x * currentSpeed * delta;
          const nextZ = ePos.z + t.dir.z * currentSpeed * delta;

          let isColliding = false;

          if (!isColliding) {
            for (let obs of this.obstacles) {
              if (this.checkCollision(nextX, nextZ, enemyRadius, obs)) {
                isColliding = true;
                break;
              }
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
                  enemyRadius * 2.5
                ) {
                  isColliding = true;
                  break;
                }
              }
            }
          }

          // Jika mode Wander dan nabrak, putar arah acak
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

        // Animasi: Mengamuk saat menyerang, berayun cepat saat lari
        const armL = t.mesh.getObjectByName("armL");
        const armR = t.mesh.getObjectByName("armR");
        if (armL && armR) {
          if (t.aiState === "ATTACK") {
            armL.rotation.x = -Math.PI / 2 + Math.sin(time * 10) * 0.5; // Tangan ke atas memukul
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
    this.targets = this.targets.filter((t) => t.mesh !== mesh);
    this.targetCount--;
    return this.targetCount;
  }
}
