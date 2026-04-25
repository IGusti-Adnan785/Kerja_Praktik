1. Arsitektur Proyek
Bahasa: JavaScript Modern (ES6+ Modules).

Engine/Library: Three.js (v0.126.0) untuk rendering 3D WebGL. Web Audio API untuk tata suara.

Struktur Kode: Object-Oriented Programming (OOP) yang ketat untuk modularitas dan skalabilitas.

2. Hierarki Class Utama
Proyek dibagi menjadi beberapa modul independen:

GameApp.js: Entry point dan Game Loop utama. Mengatur renderer, menyinkronkan update dari semua entitas, dan mengecek kondisi Game Over.

World.js: Environment Generator. Menghasilkan tekstur Canvas (jalan aspal) dan membuat rintangan 3D (Pohon, Bangunan, Tembok, Batu) serta mendaftarkan batas kolisinya (bounding area).

Player.js: Controller. Menangani Raycaster untuk shooting, input mouse/keyboard/touch, transisi FOV untuk Sniper Scope, dan Headbobbing. Mengkalkulasi kolisi pemain terhadap map.

TargetSystem.js: AI & Entity Manager. Mem-parsing soal dari questions.js, menggambarnya ke CanvasTexture, dan mengeksekusi logika State Machine (Wander, Chase, Attack) berbasis kalkulasi jarak.

UIManager.js: DOM Interface. Mengatur interaksi HTML/CSS (Modal Game Over, Bar HP, Kompas, overlay Scope).

AudioController.js & ParticleSystem.js: Modul sistem feedback (efek suara dan partikel fisik).

3. Sistem Kolisi (Collision Detection)
Menggunakan pendekatan hibrida (Hybrid Collision) buatan sendiri tanpa library eksternal fisika berat untuk menjaga FPS tetap 60:

Radial Collision (Circle/Cylinder): Menggunakan Math.hypot() untuk mendeteksi tabrakan pada objek bulat seperti Pohon (radius 1.2), Batu, dan Monster.

AABB Collision (Axis-Aligned Bounding Box): Menggunakan pengecekan koordinat Minimum & Maksimum (X dan Z) untuk objek bersudut seperti Tembok dan Bangunan agar pemain bisa meluncur (sliding) di dinding dan masuk melalui pintu.

4. Sistem AI & Pathfinding
Karena A* (A-Star) terlalu berat untuk WebGL tanpa NavMesh, AI menggunakan kombinasi:

Raymarching Line-of-Sight (LoS): Menembakkan iterasi koordinat imajiner (langkah per 1 meter) dari monster ke pemain. Jika ada koordinat Obstacle yang berpotongan, LoS putus (pemain aman).

Steering Behaviors: Jika menabrak, arah diacak (dir.x += Math.random()). Jika melihat pemain, vektor arah langsung di-set ke vektor posisi pemain.

5. Optimasi Rendering & Memori
Pembuatan tekstur rumput, jalan, dan teks soal tidak memuat file .jpg/.png dari luar, melainkan di- generate secara langsung (on-the-fly) menggunakan HTML5 <canvas>.

Menggunakan THREE.Sprite untuk papan soal agar selalu menghadap ke arah kamera pemain tanpa perlu kalkulasi rotasi manual.

Low-poly primitives (BoxGeometry, CylinderGeometry) digunakan untuk menekan jumlah vertices, memungkinkan shadow map (bayangan) diaktifkan bahkan pada peramban seluler.