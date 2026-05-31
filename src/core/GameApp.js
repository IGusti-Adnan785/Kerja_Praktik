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
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    });

    if (this.ui.btnPlay) {
      this.ui.btnPlay.onclick = () => {
        // Validasi Nama Menggunakan Alert Kustom
        this.playerName = document.getElementById("playerName").value;
        if (!this.playerName || this.playerName.trim() === "") {
            this.showCustomAlert("AKSES DITOLAK", "Kamu belum memasukkan nama!\n\nMohon masukkan nama Ranger terlebih dahulu sebelum memulai misi.");
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
        document.getElementById("story-overlay").classList.add("hidden");
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
      btnPauseMobile.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isActive) this.triggerPause();
      }, { passive: false });
    }

    const btnResume = document.getElementById("btn-resume");
    if (btnResume) {
      btnResume.onclick = () => {
        document.getElementById("pause-menu").classList.add("hidden");
        if (document.getElementById("btn-aim")) document.getElementById("btn-aim").classList.remove("hidden");
        if (document.getElementById("btn-pause-mobile")) document.getElementById("btn-pause-mobile").classList.remove("hidden");
        
        document.body.requestPointerLock();
        this.isActive = true; 
      };
    }

    const btnQuit = document.getElementById("btn-quit");
    if (btnQuit) {
      btnQuit.onclick = () => location.reload();
    }
  }

  // ===============================================
  // FUNGSI ALERT KUSTOM (Menggantikan window.alert)
  // ===============================================
  showCustomAlert(title, message, onConfirm = null) {
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch(e) {}
    
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
      // Jika HTML lupa dipasang, jadikan bawaan browser sebagai cadangan terakhir
      alert(`${title}\n\n${message}`);
      if (onConfirm) onConfirm();
    }
  }

  triggerPause() {
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch(e) {}
    const pauseMenu = document.getElementById("pause-menu");
    if (pauseMenu) pauseMenu.classList.remove("hidden");
    this.isActive = false; 
    
    if(document.getElementById("btn-aim")) document.getElementById("btn-aim").classList.add("hidden");
    if(document.getElementById("btn-pause-mobile")) document.getElementById("btn-pause-mobile").classList.add("hidden");
  }

  startGame(opts) {
    this.audio.playGameMode(opts.theme);

    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    if (this.listener.context.state === "suspended") {
      this.listener.context.resume();
    }

    if (this.world) {
      while (this.world.scene.children.length > 0) {
        this.world.scene.remove(this.world.scene.children[0]);
      }
    }

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

    this.camera.position.set(0, 1.7, 0);
    this.player.pitch = 0;
    this.player.yaw = 0;
    this.camera.add(this.player.gunMesh);

    if (document.getElementById("btn-aim")) document.getElementById("btn-aim").classList.remove("hidden");
    if (document.getElementById("btn-pause-mobile")) document.getElementById("btn-pause-mobile").classList.remove("hidden");

    this.isActive = true;
    this.startTime = performance.now();
    try { document.body.requestPointerLock(); } catch(e) {}
  }

  shoot() {
    if (!this.isActive) return;
    this.audio.playGunShot();

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
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
            parent.scale.set(s, s, s);
            if (s <= 0) clearInterval(fade);
          }, 20);

          if (this.player.heal) this.player.heal(1);
          if (this.ui.showFloatingText) this.ui.showFloatingText("+1 HP | BENAR!", "#2ecc71");

          const sisa = this.targetSystem.removeTarget(parent);
          if (sisa <= 0) this.gameOver("MISI SELESAI", true); 
        } else {
          obj.material.emissive.setHex(0xff0000);
          setTimeout(() => obj.material.emissive.setHex(0x330000), 300);
        }
        break;
      }
    }
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

      this.particleSystem.update(delta);

      this.renderer.render(this.world.scene, this.camera);

      if (this.targetSystem.targets.length === 0 && this.isActive) {
        this.gameOver("MISI SELESAI", true);
      }

      if (this.player.isDead && this.isActive) {
        this.gameOver("DI BUNUH MONSTER!", false);
      }
    }
  }

  gameOver(reason = "MISI SELESAI", isVictory = false) {
    this.isActive = false; 
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch(e) {}

    if (document.getElementById("btn-aim")) document.getElementById("btn-aim").classList.add("hidden");
    if (document.getElementById("btn-pause-mobile")) document.getElementById("btn-pause-mobile").classList.add("hidden");

    if (this.audio && this.audio.playMenuMode) this.audio.playMenuMode();

    const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(2);

    // MENGGUNAKAN ALERT KUSTOM JIKA UI GAGAL DIMUAT
    if (isVictory) {
      try {
        if (this.ui.showVictoryCertificate) {
          this.ui.showVictoryCertificate(this.playerName, elapsed);
        } else {
          throw new Error("Sertifikat");
        }
      } catch (err) {
        this.showCustomAlert(
          "MISI SELESAI!", 
          `Ranger: ${this.playerName}\nWaktu: ${elapsed} detik\n\n(Catatan: UI Sertifikat belum terpasang di UIManager)`, 
          () => location.reload()
        );
      }
    } else {
      try {
        if (this.ui.showGameOver) {
          this.ui.showGameOver(this.playerName, reason, elapsed);
        } else {
          throw new Error("Modal Kalah");
        }
      } catch (err) {
        this.showCustomAlert(
          "GAME OVER!", 
          `Penyebab: ${reason}\nWaktu Bertahan: ${elapsed} detik`, 
          () => location.reload()
        );
      }
    }
  }
}