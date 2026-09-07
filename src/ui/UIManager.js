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

    this.scopeOverlay = document.getElementById("scope-overlay");
    this.resultModal = document.getElementById("result-modal");
    this.modalTitle = document.getElementById("modal-title");
    this.modalBody = document.getElementById("modal-body");
    this.btnRestart = document.getElementById("btn-restart");

    if (this.btnRestart) {
      this.btnRestart.onclick = () => location.reload();
    }
    this.btnAim = document.getElementById("btn-aim");
  }

  escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  hideMenu() {
    if (this.menu) this.menu.classList.add("hidden");
  }

  showMenu() {
    if (this.menu) this.menu.classList.remove("hidden");
  }

  updateStats(time, left) {
    if (this.timerEl) this.timerEl.innerText = time;
    if (this.countEl) this.countEl.innerText = left;
  }

  checkPlatform() {}

  updateHP(hp, maxHp) {
    if (!this.hpFill || !this.hpText) return;
    const pct = Math.max(0, (hp / maxHp) * 100);
    this.hpFill.style.width = pct + "%";
    this.hpText.innerText = `HP: ${hp}/${maxHp}`;
  }

  flashDamage() {
    if (!this.damageOverlay) return;
    this.damageOverlay.style.opacity = 1;
    setTimeout(() => {
      if (this.damageOverlay) this.damageOverlay.style.opacity = 0;
    }, 300);
  }

  toggleScopeUI(isScoped) {
    const crosshair = document.getElementById("crosshair");
    if (isScoped) {
      if (this.scopeOverlay) this.scopeOverlay.classList.remove("hidden");
      if (crosshair) crosshair.style.display = "none";
    } else {
      if (this.scopeOverlay) this.scopeOverlay.classList.add("hidden");
      if (crosshair) crosshair.style.display = "block";
    }
  }

  showGameOver(playerName, reason, time) {
    if (!this.resultModal) return;

    const safeName = this.escapeHTML(playerName || "RANGER");
    const safeReason = this.escapeHTML(reason || "MISI GAGAL");

    this.resultModal.classList.remove("hidden");
    const content = this.resultModal.querySelector(".modal-content");

    if (content) content.className = "modal-content game-over";
    if (this.modalTitle) this.modalTitle.innerText = "GAME OVER";
    if (this.modalBody) {
      this.modalBody.innerHTML = `Ranger <b>${safeName}</b> telah gugur.<br>Penyebab: <b>${safeReason}</b><br>Waktu Bertahan: <b>${time} detik</b>.`;
    }
  }

  updateCompass(camera, targets) {
    if (!this.compass) return;

    if (!targets || targets.length === 0) {
      this.compass.style.opacity = 0;
      return;
    }

    this.compass.style.opacity = 0.8;
    let closestDist = Infinity;
    let closestTarget = null;
    const camPos = camera.position;

    targets.forEach((t) => {
      if (t.mesh) {
        const dist = camPos.distanceTo(t.mesh.position);
        if (dist < closestDist) {
          closestDist = dist;
          closestTarget = t.mesh;
        }
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
      this.compass.style.transform = `translate(-50%, -100%) rotate(${
        angle * (180 / Math.PI)
      }deg)`;
    }
  }

  getPlayerName() {
    return this.inputName ? this.inputName.value.trim() : "RANGER";
  }

  getOptions() {
    return {
      theme: this.optTheme ? this.optTheme.value : "WARM",
      targetMode: this.optTarget ? this.optTarget.value : "STATIC",
      questMode: this.optQuest ? this.optQuest.value : "BASIC",
    };
  }

  showFloatingText(text, color = "#2ecc71") {
    const container = document.getElementById("floating-text-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "floating-text";
    el.style.color = color;
    el.innerText = text;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  showVictoryCertificate(playerName, time) {
    const certModal = document.getElementById("certificate-modal");
    if (!certModal) return;

    certModal.classList.remove("hidden");

    const safeName = this.escapeHTML(playerName || "RANGER TANPA NAMA");
    const nameEl = document.getElementById("cert-name");
    const timeEl = document.getElementById("cert-time");

    if (nameEl) nameEl.innerText = safeName;
    if (timeEl) timeEl.innerText = time + " Detik";

    let rank = "C - SURVIVOR";
    let color = "#e74c3c";
    const t = parseFloat(time);

    if (t < 30) {
      rank = "SSS - DEWA MATEMATIKA";
      color = "#9b59b6";
    } else if (t < 60) {
      rank = "S - JENIUS RIMBA";
      color = "#f1c40f";
    } else if (t < 90) {
      rank = "A - RANGER ELIT";
      color = "#2ecc71";
    } else if (t < 120) {
      rank = "B - RANGER TANGGUH";
      color = "#3498db";
    }

    const rankEl = document.getElementById("cert-rank");
    if (rankEl) {
      rankEl.innerText = rank;
      rankEl.style.color = color;
    }

    const btnDownload = document.getElementById("btn-download-cert");
    if (btnDownload && typeof html2canvas !== "undefined") {
      btnDownload.onclick = () => {
        html2canvas(document.getElementById("certificate-box")).then(
          (canvas) => {
            const link = document.createElement("a");
            link.download = `Sertifikat_${safeName}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
          },
        );
      };
    }

    const btnHome = document.getElementById("btn-cert-home");
    if (btnHome) {
      btnHome.onclick = () => location.reload();
    }
  }
}