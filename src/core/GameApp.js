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

    this.isActive = false;
    this.isGameOverProcessed = false;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Pixel ratio max 2 untuk hemat GPU
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    const container = document.getElementById("container");
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.renderer.domElement);
    }

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );

    this.player = new Player(
      this.camera,
      document.getElementById("touch-controls") || document.body,
      () => this.shoot(),
      this.ui,
    );

    this.ui.checkPlatform();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    if (this.ui.btnPlay) {
      this.ui.btnPlay.onclick = () => {
        this.audio.ensureContextResumed();
        this.playerName = document.getElementById("playerName").value;
        if (!this.playerName || this.playerName.trim() === "") {
          this.showCustomAlert(
            "AKSES DITOLAK",
            "Kamu belum memasukkan nama!\n\nMohon masukkan nama Ranger terlebih dahulu sebelum memulai misi.",
          );
          return;
        }

        this.ui.hideMenu();
        const storyOverlay = document.getElementById("story-overlay");
        if (storyOverlay) storyOverlay.classList.remove("hidden");
      };
    }

    const btnStartGame = document.getElementById("btn-start-game");
    if (btnStartGame) {
      btnStartGame.onclick = () => {
        this.audio.ensureContextResumed();
        const storyOverlay = document.getElementById("story-overlay");
        if (storyOverlay) storyOverlay.classList.add("hidden");
        const opts = this.ui.getOptions();
        this.startGame(opts);
      };
    }

    document.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && this.isActive) {
        this.triggerPause();
      }
    });

    const btnPauseMobile = document.getElementById("btn-pause-mobile");
    if (btnPauseMobile) {
      btnPauseMobile.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.isActive) this.triggerPause();
        },
        { passive: false },
      );
    }

    const btnResume = document.getElementById("btn-resume");
    if (btnResume) {
      btnResume.onclick = () => {
        document.getElementById("pause-menu").classList.add("hidden");
        if (document.getElementById("btn-aim"))
          document.getElementById("btn-aim").classList.remove("hidden");
        if (document.getElementById("btn-pause-mobile"))
          document
            .getElementById("btn-pause-mobile")
            .classList.remove("hidden");

        try {
          document.body.requestPointerLock();
        } catch (err) {}
        this.isActive = true;
      };
    }

    const btnQuit = document.getElementById("btn-quit");
    if (btnQuit) {
      btnQuit.onclick = () => location.reload();
    }
  }

  showCustomAlert(title, message, onConfirm = null) {
    try {
      if (document.pointerLockElement) document.exitPointerLock();
    } catch (e) {}

    const modal = document.getElementById("custom-alert-modal");
    if (modal) {
      document.getElementById("alert-title").innerText = title;
      document.getElementById("alert-desc").innerText = message;
      modal.classList.remove("hidden");

      document.getElementById("btn-alert-ok").onclick = () => {
        modal.classList.add("hidden");
        if (onConfirm) onConfirm();
      };
    } else {
      alert(`${title}\n\n${message}`);
      if (onConfirm) onConfirm();
    }
  }

  triggerPause() {
    try {
      if (document.pointerLockElement) document.exitPointerLock();
    } catch (e) {}
    const pauseMenu = document.getElementById("pause-menu");
    if (pauseMenu) pauseMenu.classList.remove("hidden");
    this.isActive = false;

    if (document.getElementById("btn-aim"))
      document.getElementById("btn-aim").classList.add("hidden");
    if (document.getElementById("btn-pause-mobile"))
      document.getElementById("btn-pause-mobile").classList.add("hidden");
  }

  cleanupPreviousSession() {
    if (this.targetSystem) {
      this.targetSystem.clearTargets();
    }
    if (this.world) {
      this.world.dispose();
    }
  }

  startGame(opts) {
    this.audio.playGameMode(opts.theme);

    if (!this.listener) {
      this.listener = new THREE.AudioListener();
      this.camera.add(this.listener);
    }

    if (this.listener.context && this.listener.context.state === "suspended") {
      this.listener.context.resume().catch(() => {});
    }

    // Pembersihan scene & memory lama
    this.cleanupPreviousSession();

    this.world = new World(100, opts.theme);
    this.world.scene.add(this.camera);

    this.particleSystem = new ParticleSystem(this.world.scene);

    this.targetSystem = new TargetSystem(this.world.scene, 100, this.listener);
    this.targetSystem.spawnTargets(
      5,
      this.world.obstacles,
      opts.targetMode,
      opts.questMode,
    );

    this.player.reset();
    this.camera.position.set(0, 1.7, 0);
    this.camera.add(this.player.gunMesh);

    if (document.getElementById("btn-aim"))
      document.getElementById("btn-aim").classList.remove("hidden");
    if (document.getElementById("btn-pause-mobile"))
      document.getElementById("btn-pause-mobile").classList.remove("hidden");

    document.body.classList.add("is-playing");
    this.isActive = true;
    this.isGameOverProcessed = false;
    this.startTime = performance.now();
    this.prevTime = performance.now();

    try {
      document.body.requestPointerLock();
    } catch (e) {}
  }

  shoot() {
    if (!this.isActive || this.isGameOverProcessed) return;
    this.audio.playGunShot();

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    // Dioptimalkan: Raycast dilakukan pada objek scene
    const hits = ray.intersectObjects(this.world.scene.children, true);

    for (let hit of hits) {
      const obj = hit.object;

      if (!obj.userData || !obj.userData.isTarget) {
        this.particleSystem.spawn(hit.point, false);
        break;
      }

      if (obj.userData && obj.userData.isTarget) {
        this.particleSystem.spawn(hit.point, true);

        if (obj.userData.val === obj.userData.corr) {
          this.audio.playHitSound();
          const parent = obj.userData.parent;
          let s = 1.0;
          const fade = setInterval(() => {
            s -= 0.1;
            if (parent && parent.scale) parent.scale.set(s, s, s);
            if (s <= 0) clearInterval(fade);
          }, 20);

          if (this.player.heal) this.player.heal(1);
          if (this.ui.showFloatingText)
            this.ui.showFloatingText("+1 HP | BENAR!", "#2ecc71");

          const sisa = this.targetSystem.removeTarget(parent);
          if (sisa <= 0 && !this.isGameOverProcessed) {
            this.gameOver("MISI SELESAI", true);
          }
        } else {
          if (obj.material && obj.material.emissive) {
            obj.material.emissive.setHex(0xff0000);
            setTimeout(() => {
              if (obj.material && obj.material.emissive) {
                obj.material.emissive.setHex(0x330000);
              }
            }, 300);
          }
        }
        break;
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    const time = performance.now();
    const rawDelta = (time - (this.prevTime || time)) / 1000;
    const delta = Math.min(rawDelta, 0.1); // Capping delta time untuk kestabilan FPS
    this.prevTime = time;

    if (this.isActive && this.world && !this.isGameOverProcessed) {
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
      this.particleSystem.update(delta);

      this.renderer.render(this.world.scene, this.camera);

      // Single Responsibility check untuk pencegahan panggilan ganda gameOver
      if (this.targetSystem.targets.length === 0 && !this.isGameOverProcessed) {
        this.gameOver("MISI SELESAI", true);
      }

      if (this.player.isDead && !this.isGameOverProcessed) {
        this.gameOver("DIBUNUH MONSTER!", false);
      }
    }
  }

  gameOver(reason = "MISI SELESAI", isVictory = false) {
    if (this.isGameOverProcessed) return;
    this.isGameOverProcessed = true;

    document.body.classList.remove("is-playing");
    this.isActive = false;

    try {
      if (document.pointerLockElement) document.exitPointerLock();
    } catch (e) {}

    if (document.getElementById("btn-aim"))
      document.getElementById("btn-aim").classList.add("hidden");
    if (document.getElementById("btn-pause-mobile"))
      document.getElementById("btn-pause-mobile").classList.add("hidden");

    if (this.audio && this.audio.playMenuMode) this.audio.playMenuMode();

    const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(2);

    if (isVictory) {
      try {
        if (this.ui.showVictoryCertificate) {
          this.ui.showVictoryCertificate(this.playerName, elapsed);
        } else {
          throw new Error("Sertifikat Modal Error");
        }
      } catch (err) {
        this.showCustomAlert(
          "MISI SELESAI!",
          `Ranger: ${this.playerName}\nWaktu: ${elapsed} detik`,
          () => location.reload(),
        );
      }
    } else {
      try {
        if (this.ui.showGameOver) {
          this.ui.showGameOver(this.playerName, reason, elapsed);
        } else {
          throw new Error("Modal Kalah Error");
        }
      } catch (err) {
        this.showCustomAlert(
          "GAME OVER!",
          `Penyebab: ${reason}\nWaktu Bertahan: ${elapsed} detik`,
          () => location.reload(),
        );
      }
    }
  }
}
