import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";

export default class World {
  constructor(arenaSize, theme) {
    this.arenaSize = arenaSize;
    this.scene = new THREE.Scene();
    this.theme = theme;
    this.obstacles = [];
    this.setupAtmosphere();
    this.setupLights();
    this.createGround();
    this.generateMap();
  }

  setupAtmosphere() {
    const fogColor = this.theme === "WARM" ? 0xffaa55 : 0x88aabb;
    this.scene.background = new THREE.Color(fogColor);
    if (this.theme === "WARM") {
      this.scene.fog = new THREE.Fog(fogColor, 10, 90);
    } else {
      this.scene.fog = new THREE.FogExp2(fogColor, 0.02);
    }
  }

  setupLights() {
    const ambientColor = this.theme === "WARM" ? 0xffddaa : 0x445566;
    const hemiColor = this.theme === "WARM" ? 0xffaa00 : 0x88aaff;
    const dirColor = this.theme === "WARM" ? 0xffaa00 : 0xcceeff;

    this.scene.add(new THREE.AmbientLight(ambientColor, 0.6));
    this.scene.add(new THREE.HemisphereLight(hemiColor, 0x223344, 0.5));

    const dir = new THREE.DirectionalLight(dirColor, 1.5);
    dir.position.set(-80, 50, -60);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -this.arenaSize;
    dir.shadow.camera.right = this.arenaSize;
    dir.shadow.camera.top = this.arenaSize;
    dir.shadow.camera.bottom = -this.arenaSize;
    dir.shadow.camera.far = 200;
    dir.shadow.bias = -0.0005;
    this.scene.add(dir);
  }

  createGround() {
    // Membuat tekstur tanah raksasa 2048px (Tidak di-repeat)
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext("2d");

    // 1. Warna Dasar (Rumput/Tanah)
    ctx.fillStyle = this.theme === "WARM" ? "#1a120d" : "#1a1a22";
    ctx.fillRect(0, 0, 2048, 2048);

    // Noise rumput
    for (let i = 0; i < 30000; i++) {
      ctx.fillStyle =
        Math.random() > 0.5 ? "rgba(0,0,0,0.4)" : "rgba(50,50,60,0.2)";
      ctx.fillRect(Math.random() * 2048, Math.random() * 2048, 3, 3);
    }

    // 2. Gambar Jalan Aspal (Crossroad)
    ctx.fillStyle = "#222222"; // Warna Aspal
    ctx.fillRect(0, 960, 2048, 128); // Jalan Horizontal X
    ctx.fillRect(960, 0, 128, 2048); // Jalan Vertikal Z

    // 3. Marka Jalan (Garis Kuning)
    ctx.fillStyle = "#f1c40f";
    for (let i = 0; i < 2048; i += 60) {
      ctx.fillRect(i, 1020, 30, 8); // Garis X
      ctx.fillRect(1020, i, 8, 30); // Garis Z
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;

    const matColor = this.theme === "WARM" ? 0xffffff : 0xaaaaaa;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.arenaSize * 2, this.arenaSize * 2),
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 1.0,
        metalness: 0.0,
        color: matColor,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  generateMap() {
    this.obstacles = [];

    // Bangunan Utama di Sudut-Sudut (Bisa Dimasuki)
    this.addEnterableBuilding(-25, -25);
    this.addEnterableBuilding(25, 25);
    this.addEnterableBuilding(-35, 30);

    // Sebar Pohon (Jauhi jalan raya)
    for (let i = 0; i < 120; i++) {
      let x, z;
      do {
        x = (Math.random() - 0.5) * this.arenaSize * 1.8;
        z = (Math.random() - 0.5) * this.arenaSize * 1.8;
      } while (Math.abs(x) < 8 || Math.abs(z) < 8); // Area jalan aman

      const tree = this.createTree();
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI;
      this.scene.add(tree);
      this.obstacles.push({ x, z, radius: 1.2 }); // Lingkaran Kolisi
    }

    // Tembok Rintangan Bebas
    for (let i = 0; i < 15; i++) {
      const w = 4 + Math.random() * 6;
      const d = 1;
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      if (Math.abs(x) > 10 && Math.abs(z) > 10) {
        // Jangan halangi jalan
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(w, 2.5, d),
          new THREE.MeshStandardMaterial({ color: 0x5d6d7e, roughness: 0.9 }),
        );
        wall.position.set(x, 1.25, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        this.obstacles.push({
          isBox: true,
          minX: x - w / 2,
          maxX: x + w / 2,
          minZ: z - d / 2,
          maxZ: z + d / 2,
        }); // Kotak Kolisi
      }
    }
  }

  addEnterableBuilding(cx, cz) {
    const grp = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x34495e,
      roughness: 0.9,
    }); // Warna dinding beton
    const h = 4.0; // Tinggi tembok bangunan

    // Helper pembuat tembok satuan yang memiliki AABB Kolisi (Box)
    const addWall = (x, z, w, d) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      grp.add(mesh);

      // Daftarkan dinding ini sebagai halangan fisik
      this.obstacles.push({
        isBox: true,
        minX: cx + x - w / 2,
        maxX: cx + x + w / 2,
        minZ: cz + z - d / 2,
        maxZ: cz + z + d / 2,
      });
    };

    // Membangun rumah ukuran 12x12
    addWall(-6, 0, 1, 12); // Tembok Kiri
    addWall(6, 0, 1, 12); // Tembok Kanan
    addWall(0, -6, 13, 1); // Tembok Belakang
    addWall(-4, 6, 5, 1); // Tembok Depan Kiri (Menyisakan pintu di tengah)
    addWall(4, 6, 5, 1); // Tembok Depan Kanan

    // Atap Bangunan
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 14), roofMat);
    roof.position.set(0, h + 0.25, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    grp.add(roof);

    grp.position.set(cx, 0, cz);
    this.scene.add(grp);
  }

  createTree() {
    const grp = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 3.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x2e1e14, roughness: 1.0 }),
    );
    trunk.position.y = 1.75;
    trunk.castShadow = trunk.receiveShadow = true;
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 5.5, 8),
      new THREE.MeshStandardMaterial({
        color: this.theme === "WARM" ? 0x0d2b0f : 0x0a1a0a,
        roughness: 1.0,
      }),
    );
    leaves.position.y = 4.5;
    leaves.castShadow = leaves.receiveShadow = true;
    grp.add(trunk, leaves);
    grp.scale.setScalar(0.8 + Math.random() * 0.6);
    return grp;
  }
}
