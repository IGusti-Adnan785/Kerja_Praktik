import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";
import UIManager from "../ui/UIManager.js";
import AudioController from "../systems/AudioController.js";
import World from "../environment/World.js";
import Player from "../entities/Player.js";
import TargetSystem from "../entities/TargetSystem.js";
import ParticleSystem from "../systems/ParticleSystem.js";

export default class GameApp {
  constructor() {
    this.ui = new UIManager();
    this.audio = new AudioController();
    this.audio.playMenuMode();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    document.getElementById("container").appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );

    this.player = new Player(
      this.camera,
      document.getElementById("touch-controls"),
      () => this.shoot(),
      this.ui,
    );

    this.ui.btnPlay.onclick = () => {
      const opts = this.ui.getOptions();
      this.startGame(opts);
    };

    window.addEventListener("resize", () => this.onResize());
    this.ui.checkPlatform();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  startGame(opts) {
    const name = this.ui.getPlayerName();
    if (!name) {
      alert("MOHON MASUKKAN NAMA RANGER!");
      return;
    }

    this.ui.hideMenu();
    this.audio.playGameMode(opts.theme);

    // Bikin "Telinga" pemain untuk 3D Audio
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    if (this.listener.context.state === "suspended") {
      this.listener.context.resume(); // Aktifkan Audio Browser
    }

    if (this.world) {
      while (this.world.scene.children.length > 0) {
        this.world.scene.remove(this.world.scene.children[0]);
      }
    }

    this.world = new World(100, opts.theme);
    this.world.scene.add(this.camera);

    // Inisialisasi Particle System
    this.particleSystem = new ParticleSystem(this.world.scene);

    // Kirim Telinga ke TargetSystem
    this.targetSystem = new TargetSystem(this.world.scene, 100, this.listener);
    this.targetSystem.spawnTargets(
      5,
      this.world.obstacles,
      opts.targetMode,
      opts.questMode,
    );

    // ... (kode posisi kamera dsb tetap sama) ...
    this.camera.position.set(0, 1.7, 0);
    this.player.pitch = 0;
    this.player.yaw = 0;
    this.camera.add(this.player.gunMesh);

    this.isActive = true;
    this.startTime = performance.now();
    document.body.requestPointerLock();
  }

  shoot() {
    if (!this.isActive) return;
    this.audio.playGunShot();

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = ray.intersectObjects(this.world.scene.children, true);

    for (let hit of hits) {
      const obj = hit.object;

      // Efek Partikel Meleset (Kena Pohon/Tanah)
      if (!obj.userData || !obj.userData.isTarget) {
        // Munculkan percikan api di titik tembakan
        this.particleSystem.spawn(hit.point, false);
        break;
      }

      // Jika kena Monster
      if (obj.userData && obj.userData.isTarget) {
        // Munculkan percikan darah!
        this.particleSystem.spawn(hit.point, true);

        if (obj.userData.val === obj.userData.corr) {
          this.audio.playHitSound();
          const parent = obj.userData.parent;
          let s = 1.0;
          const fade = setInterval(() => {
            s -= 0.1;
            parent.scale.set(s, s, s);
            if (s <= 0) {
              clearInterval(fade);
            }
          }, 20);

          const sisa = this.targetSystem.removeTarget(parent);
          if (sisa <= 0) this.gameOver();
        } else {
          obj.material.emissive.setHex(0xff0000);
          setTimeout(() => obj.material.emissive.setHex(0x330000), 300);
        }
        break;
      }
    }
  }

  gameOver() {
    this.isActive = false;
    document.exitPointerLock();
    this.audio.playMenuMode();
    setTimeout(() => {
      const time = ((performance.now() - this.startTime) / 1000).toFixed(2);
      alert(
        `MISI SELESAI!\nRanger: ${this.ui.getPlayerName()}\nWaktu: ${time} detik`,
      );
      location.reload();
    }, 500);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  }

  animate() {
    requestAnimationFrame(this.animate);
    const time = performance.now();
    const delta = (time - (this.prevTime || time)) / 1000;
    this.prevTime = time;

    if (this.isActive && this.world) {
      const elapsed = ((time - this.startTime) / 1000).toFixed(2);
      this.ui.updateStats(elapsed, this.targetSystem.targetCount);
      this.ui.updateCompass(this.camera, this.targetSystem.targets);

      this.player.update(
        delta,
        100,
        this.world.obstacles,
        this.targetSystem.targets,
      );
      this.targetSystem.update(delta, this.camera.position, this.player);

      // UPDATE PARTIKEL
      this.particleSystem.update(delta);

      this.renderer.render(this.world.scene, this.camera);

      if (this.player.isDead) {
        this.gameOver("DI BUNUH MONSTER!");
      }
    }
  }

  // UPDATE fungsi gameOver untuk menerima alasan mati
  gameOver(reason = "MISI SELESAI") {
    this.isActive = false;
    document.exitPointerLock();
    this.audio.playMenuMode();

    // Memunculkan Modal Custom (Tanpa setTimeout agar muncul seketika)
    const time = ((performance.now() - this.startTime) / 1000).toFixed(2);
    const isVictory = reason === "MISI SELESAI";

    this.ui.showResultModal(reason, this.ui.getPlayerName(), time, isVictory);
  }
}
