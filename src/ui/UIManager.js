import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";

export default class UIManager {
  constructor() {
    this.menu = document.getElementById("menu");
    this.timerEl = document.getElementById("timer");
    this.countEl = document.getElementById("targetCount");
    this.compass = document.getElementById("compass-arrow");
    this.inputName = document.getElementById("playerName");
    this.optTheme = document.getElementById("opt-theme");
    this.optTarget = document.getElementById("opt-target");
    this.optQuest = document.getElementById("opt-quest");
    this.btnPlay = document.getElementById("btn-play");

    this.hpFill = document.getElementById("hp-fill");
    this.hpText = document.getElementById("hp-text");
    this.damageOverlay = document.getElementById("damage-overlay");

    // Element Baru untuk Scope & Modal
    this.scopeOverlay = document.getElementById("scope-overlay");
    this.resultModal = document.getElementById("result-modal");
    this.modalTitle = document.getElementById("modal-title");
    this.modalBody = document.getElementById("modal-body");
    this.btnRestart = document.getElementById("btn-restart");

    // Reload halaman saat tombol kembali ditekan
    this.btnRestart.onclick = () => location.reload();
  }

  hideMenu() {
    this.menu.classList.add("hidden");
  }
  showMenu() {
    this.menu.classList.remove("hidden");
  }
  updateStats(time, left) {
    this.timerEl.innerText = time;
    this.countEl.innerText = left;
  }
  checkPlatform() {}

  updateHP(hp, maxHp) {
    const pct = (hp / maxHp) * 100;
    this.hpFill.style.width = pct + "%";
    this.hpText.innerText = `HP: ${hp}/${maxHp}`;
  }

  flashDamage() {
    this.damageOverlay.style.opacity = 1;
    setTimeout(() => {
      this.damageOverlay.style.opacity = 0;
    }, 300);
  }

  // FUNGSI BARU: Efek UI saat Scope
  toggleScopeUI(isScoped) {
    if (isScoped) {
      this.scopeOverlay.classList.remove("hidden");
      document.getElementById("crosshair").style.display = "none";
    } else {
      this.scopeOverlay.classList.add("hidden");
      document.getElementById("crosshair").style.display = "block";
    }
  }

  // FUNGSI BARU: Custom Modal Notification
  showResultModal(reason, playerName, time, isVictory) {
    this.resultModal.classList.remove("hidden");
    const content = this.resultModal.querySelector(".modal-content");

    if (isVictory) {
      content.className = "modal-content victory";
      this.modalTitle.innerText = "MISI SELESAI";
      this.modalBody.innerHTML = `Luar biasa, Ranger <b>${playerName}</b>!<br>Waktu Eksekusi: <b>${time} detik</b><br><br>Status: Seluruh target berhasil dinetralkan.`;
    } else {
      content.className = "modal-content game-over";
      this.modalTitle.innerText = "GAME OVER";
      this.modalBody.innerHTML = `Ranger <b>${playerName}</b> telah gugur.<br>Penyebab: <b>${reason}</b><br>Waktu Bertahan: <b>${time} detik</b>.`;
    }
  }

  updateCompass(camera, targets) {
    if (targets.length === 0) {
      this.compass.style.opacity = 0;
      return;
    }
    this.compass.style.opacity = 0.8;
    let closestDist = Infinity;
    let closestTarget = null;
    const camPos = camera.position;
    targets.forEach((t) => {
      const dist = camPos.distanceTo(t.mesh.position);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = t.mesh;
      }
    });
    if (closestTarget) {
      const targetPos = closestTarget.position.clone();
      const dir = new THREE.Vector3().subVectors(targetPos, camPos);
      const camEuler = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "YXZ",
      );
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -camEuler.y);
      let angle = Math.atan2(dir.x, -dir.z);
      this.compass.style.transform = `translate(-50%, -100%) rotate(${angle * (180 / Math.PI)}deg)`;
    }
  }

  getPlayerName() {
    return this.inputName.value.trim();
  }
  getOptions() {
    return {
      theme: this.optTheme.value,
      targetMode: this.optTarget.value,
      questMode: this.optQuest.value,
    };
  }
}
