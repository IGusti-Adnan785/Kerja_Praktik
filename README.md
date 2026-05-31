# 🎮 OPERASI RIMBA - Game Design Document

## 📋 Ringkasan Eksekutif

**Operasi Rimba** adalah sebuah game edukatif berbasis **Matematika FPS (First-Person Shooter)** yang menggabungkan pembelajaran matematika dengan mekanik permainan yang engaging dan interaktif. Pemain dikirim ke dalam dimensi virtual untuk menyelesaikan soal-soal matematika dengan cara menembak target yang bergerak, sambil menghindari musuh yang cerdas.

**Target Audiens**: Siswa SMA/SMK (14-18 tahun) yang ingin belajar matematika dengan cara yang menyenangkan.

**Platform**: Web-based, responsif di Desktop, Tablet, dan Mobile.

---

## 🎯 Game Overview

### Konsep Inti
Pemain berperan sebagai seorang "Ranger" yang dikirim ke sistem "Operasi Rimba" untuk menetralisir anomali pada AI Pembelajaran Matematika. Setiap target musuh menampilkan soal matematika, dan pemain harus menembak target dengan jawaban yang benar sambil menghindari penyerangan balik.

### Cerita (Narrative)
```
Tahun 2045. Sebuah bug fatal pada AI Pembelajaran Matematika telah 
menciptakan dimensi virtual yang mengurung kesadaran para siswa.

Kamu dikirim ke dalam sistem "Operasi Rimba" untuk menetralisir anomali ini. 
Selesaikan persamaannya, hindari penjaga sistem yang error, dan 
bersihkan dimensi ini!
```

---

## 🎮 Game Mechanics

### 1. Sistem Pertanyaan & Target
Setiap target dalam game menampilkan soal matematika dengan 3 pilihan jawaban:

#### Tipe Soal:
- **BASIC** (10 soal): Operasi aritmatika, persamaan linear sederhana
  - Contoh: "2 + 3 x 4 = ?", "2x = 10, x = ?"
  
- **TEXT** (10 soal): Soal cerita, aplikasi fungsi linear dalam kehidupan
  - Contoh: "Taksi awal 8000 + 4000/km. Rumusnya?", "Parkir 2000 + 1000/jam"
  
- **GRAPH** (5+ soal): Identifikasi persamaan dari grafik linear
  - Contoh: "Tentukan persamaan garis: y = 2x + 1"

### 2. Mekanik Shooting & Combat
- **Weapons**: Plasma rifle futuristik dengan visual 3D yang detail
- **Aiming**: Zoom sniper scope dengan tombol BIDIK (F key atau tombol mobile)
- **Crosshair**: Penanda visual di tengah layar untuk akurasi
- **Damage System**: 
  - Pemain memiliki 3 HP (dapat dikonfigurasi)
  - Setiap terkena serangan musuh = -1 HP
  - Game Over jika HP ≤ 0

### 3. Sistem AI Musuh (Target)
Setiap target adalah entitas musuh yang:
- Menampilkan soal pada tubuhnya (CanvasTexture)
- Bergerak dengan **State Machine** (3 state):
  - **Wander**: Berjalan acak di arena
  - **Chase**: Mengejar pemain jika terdeteksi
  - **Attack**: Menyerang jika jarak dekat
  
- Menggunakan **Raymarching Line-of-Sight** untuk deteksi pemain
- Mengeluarkan suara intimidatif (low-frequency bass & dengungan)

### 4. Sistem Kolisi (Collision Detection)
Menggunakan pendekatan **Hybrid Collision** tanpa library fisika eksternal:

#### Radial Collision (Circle-based)
- Digunakan untuk objek bulat: Pohon (radius 1.2), Batu, Musuh
- Kalkulasi: `Math.hypot(dx, dz) < radius`

#### AABB Collision (Axis-Aligned Bounding Box)
- Digunakan untuk objek bersudut: Tembok, Bangunan
- Memungkinkan pemain untuk "sliding" di dinding
- Implementasi: Pengecekan koordinat Min/Max pada X dan Z

### 5. Player Movement & Controls
#### Desktop (Mouse + Keyboard):
- **Mouse**: Look around (Pointer Lock API)
- **WASD**: Gerak maju/mundur/kiri/kanan
- **Mouse Click**: Tembak
- **F**: Toggle Sniper Scope
- **ESC**: Pause menu

#### Mobile (Touch):
- **Virtual Joystick**: Gerakan karakter
- **TEMBAK Button**: Tembak target
- **BIDIK Button**: Zoom scope
- **Gyroscope Support**: Look around dengan memiringkan device

### 6. Sistem Kamera
- **FOV Dinamis**: 70° normal, 25° saat scope (zoom optik)
- **Head Bobbing**: Animasi kepala yang bobbing saat berjalan
- **Recoil Effect**: Kamera bergetar saat menembak
- **Perspective**: First-Person View untuk immersion maksimal

---

## 🌍 Level Design & Environment

### Arena Utama
- **Ukuran**: 100x100 unit 3D
- **Tema Dinamis**: 
  - **WARM** (Sore): Warna kuning/oranye, fog hangat, terrain terang
  - **COOL** (Dingin): Warna biru, fog exponential, terrain gelap

### Elemen Lingkungan
1. **Tanah & Jalan**:
   - Tekstur procedural (Canvas-generated), tidak memuat file eksternal
   - Jalan aspal crossroad dengan marka kuning

2. **Rintangan Statis**:
   - **Pohon**: Cylinder dengan tekstur bark (collision radial)
   - **Bangunan**: Box besar yang bisa dimasuki (AABB collision)
   - **Tembok**: Pembatas arena untuk sliding mechanism
   - **Batu**: Obstacle kecil untuk diversity

3. **Pencahayaan**:
   - Ambient Light: Pencahayaan dasar
   - Hemisphere Light: Simulasi cahaya langit
   - Directional Light: Bayangan dinamis (shadow mapping)
   - Real-time shadows di 60 FPS bahkan di mobile

### Optimasi Rendering
- **Procedural Textures**: Rumput, jalan, dan teks soal di-generate via `<canvas>` (no file loading)
- **Sprite-based Questions**: Papan soal menggunakan `THREE.Sprite` (always face camera)
- **Low-poly Assets**: BoxGeometry, CylinderGeometry untuk performa
- **Anisotropic Filtering**: Kualitas tekstur di viewing angle ekstrem
- **Adaptive Rendering**: Pixel ratio adaptif berdasarkan device

---

## 🎨 Visual & Audio Design

### Visual Style
- **3D Modern**: Clean, minimalist design dengan neon accents
- **Color Scheme**:
  - Yellow/Gold (#f1c40f): Highlight, scoring, UI accent
  - Red (#ff0000): Crosshair, damage feedback
  - Dark Gray (#1a1a1a): Weapon body, background

### User Interface
1. **HUD (Heads-Up Display)**:
   - Crosshair di tengah (red glow)
   - HP Bar (top-left): Visual health representation
   - Target Counter & Timer (top-center): Progress tracking
   - Compass Arrow: Orientasi pemain

2. **Menus**:
   - **Main Menu**: Player name input, difficulty options (theme, target count, quest type)
   - **Story Overlay**: Narrative introduction
   - **Pause Menu**: Resume/Quit options
   - **Game Over Screen**: Score & ranking
   - **Certificate Modal**: Sertifikat digital dengan ranking (S - DEWA KALKULUS)

3. **Mobile UI**:
   - **Joystick**: Virtual analog stick (left-bottom)
   - **Fire Button**: Tembak (right-bottom)
   - **Aim Button**: Scope toggle
   - **Music Toggle**: Global audio control

### Audio Design
- **BGM (Background Music)**:
  - Menu: Backsound.webm (uplifting)
  - Game (Warm): Forest.mp3 (ambient nature)
  - Game (Cool): Dingin.mp3 (eerie, tension)
  - Dynamic switching berdasarkan theme

- **SFX (Sound Effects)**:
  - **Gun Shot**: White noise burst (procedural synth)
  - **Enemy Hum**: 50Hz bass + dengungan intimidatif (procedural)
  - **Damage Alert**: Audio feedback tanpa file eksternal
  - All generated via Web Audio API

- **Audio Context**: 
  - Procedurally generated untuk performa
  - Buffering real-time
  - Optimized untuk mobile playback

---

## 🛠️ Teknis Architecture

### Stack Teknologi
| Aspek | Teknologi |
|-------|-----------|
| **Bahasa** | JavaScript ES6+ Modules |
| **Graphics Engine** | Three.js (v0.126.0) |
| **Rendering** | WebGL 2.0 |
| **Audio** | Web Audio API |
| **Platform** | Web (Desktop + Mobile) |
| **FPS Target** | 60 FPS |

### Struktur Kode (OOP)
```
src/
├── core/
│   └── GameApp.js              # Entry point, game loop, scene manager
├── entities/
│   ├── Player.js               # Character controller, weapon, input
│   └── TargetSystem.js         # Enemy AI, question rendering
├── environment/
│   └── World.js                # Map generator, obstacles, lighting
├── systems/
│   ├── AudioController.js      # Music & SFX management
│   ├── InputController.js      # Input handler (empty/reserved)
│   └── ParticleSystem.js       # Particle effects (blood, sparks)
├── ui/
│   └── UIManager.js            # DOM manipulation, HUD updates
└── config/
    └── questions.js            # Question bank (BASIC, TEXT, GRAPH)
```

### Hierarki Class Utama

#### **GameApp.js** - Entry Point & Game Loop
- Inisialisasi WebGL renderer
- Setup scene, camera, lighting
- Spawn player dan entities
- Handle game state (active, paused, game over)
- Coordinate update cycles

#### **Player.js** - Character Controller
- First-person camera manipulation
- Raycaster untuk shooting detection
- Input handling (keyboard, mouse, touch, gyroscope)
- Collision detection terhadap obstacles
- Health management
- Weapon visuals & recoil animation

#### **TargetSystem.js** - Enemy AI Manager
- Parse soal dari QUESTION_BANK
- Render soal ke CanvasTexture
- State Machine: Wander → Chase → Attack
- Raymarching Line-of-Sight untuk deteksi
- Spawning & cleanup targets

#### **World.js** - Environment Generator
- Create ground dengan procedural texture
- Generate obstacles (trees, buildings, walls, rocks)
- Setup lighting (ambient, hemisphere, directional)
- Manage fog & atmosphere
- Store collision boundaries

#### **UIManager.js** - HUD & Menu Manager
- Update HP bar, timer, target count
- Toggle scope overlay
- Show/hide menus
- Platform detection (desktop vs mobile)
- Certificate generation

#### **AudioController.js** - Audio Management
- Web Audio Context initialization
- BGM switching (menu ↔ game)
- Procedural SFX generation
- Volume control

#### **ParticleSystem.js** - Visual Effects
- Spawn particle (blood for enemy hits, sparks for walls)
- Update physics: gravity, decay, scaling
- Cleanup lifecycle management

### Algoritma Deteksi Kolisi

#### Radial Collision (Spherical)
```javascript
distance = Math.hypot(dx, dz);
if (distance < collisionRadius) {
  // Collision detected
}
```

#### AABB Collision (Box-based)
```javascript
if (px > boxMinX && px < boxMaxX &&
    pz > boxMinZ && pz < boxMaxZ) {
  // Collision detected
}
```

### AI Pathfinding

#### Line-of-Sight (LoS) Detection
```
Raymarching: 1 meter step intervals
For each step from enemy to player:
  If step intersects obstacle:
    LoS = false (enemy can't see)
    return
LoS = true (enemy can see player, chase!)
```

#### Steering Behaviors
- **Wander**: Random direction changes
- **Chase**: Direct vector toward player
- **Attack**: Close-range damage + retreat
- **Obstacle Avoidance**: Random direction if collision

---

## 🎮 Game Flow

### Main Loop (60 FPS)
```
1. Input Processing
   └─ Keyboard, Mouse, Touch, Gyroscope

2. Update Entities
   ├─ Player movement & collision
   ├─ AI pathfinding & behavior
   ├─ Particle physics
   └─ Camera FOV interpolation

3. Collision Detection
   ├─ Player ↔ Obstacles (AABB + Radial)
   ├─ Raycaster → Target detection
   └─ Enemy ↔ Obstacles

4. Shooting Resolution
   ├─ Check raycast hit
   ├─ Verify answer correctness
   ├─ Spawn particles & SFX
   └─ Update target count

5. Rendering
   ├─ Update camera transform
   ├─ Render 3D scene
   ├─ Update HUD/UI
   └─ Request next frame
```

### Game State Machine
```
MENU
  ↓ [Play clicked]
STORY (narrative)
  ↓ [Start clicked]
GAME (active play)
  ├─ ESC → PAUSED
  │        ↓ Resume → GAME
  │        ↓ Quit → MENU
  ├─ All targets killed → WIN (Game Over)
  └─ HP ≤ 0 → LOSS (Game Over)
  ↓
CERTIFICATE (score screen)
  ↓ [Download / Replay]
MENU (restart cycle)
```

---

## 🎯 Game Modes & Difficulty Options

### Difficulty Configuration
Pemain dapat memilih sebelum memulai:

#### 1. Theme (Tema Lingkungan)
- **WARM** (Sore): Pencahayaan hangat, fog linear, suara ambient
- **COOL** (Dingin): Pencahayaan dingin, fog exponential, suara eerie

#### 2. Target Count
- **5** (Easy): 5 musuh untuk dikalahkan
- **10** (Normal): 10 musuh
- **15** (Hard): 15 musuh (banyak chaos!)

#### 3. Quest Type
- **BASIC**: Soal aritmatika & persamaan linear
- **MIXED**: Kombinasi semua tipe soal
- **GRAPH**: Fokus pada identifikasi grafik

---

## 🏆 Scoring & Ranking System

### Victory Conditions
- Hancurkan semua target dengan menjawab soal dengan benar
- Jangan sampai HP habis
- Selesaikan dalam waktu sesingkat mungkin

### Certificate Ranking
Berdasarkan waktu penyelesaian:
```
< 30 detik   → S - DEWA KALKULUS 🏆
30-60 detik  → A - AHLI HITUNG
60-120 detik → B - RANGER HANDAL
120-300 detik → C - PETUALANG
> 300 detik  → D - PEMULA
```

### Reward
- Digital certificate dengan nama pemain
- Downloadable sebagai PNG image
- Share-friendly format

---

## 📊 Technical Performance

### Target Specifications
- **Frame Rate**: 60 FPS di desktop, 30-60 FPS di mobile
- **Resolution**: Responsive (HD hingga 4K)
- **Load Time**: < 5 detik pada koneksi 4G
- **Memory**: < 100 MB runtime (optimized assets)

### Optimization Techniques
1. **Asset Generation**: 
   - Procedural texture generation via Canvas
   - No external image loading
   - On-the-fly text rendering

2. **Geometry Optimization**:
   - Low-poly primitives (BoxGeometry, CylinderGeometry)
   - Minimal vertex count
   - Efficient shadow mapping

3. **Culling & LOD**:
   - Frustum culling (Three.js automatic)
   - Fog-based draw distance
   - Particle cleanup lifecycle

4. **Device Adaptation**:
   - Adaptive pixel ratio capping
   - Mobile-specific UI scaling
   - Touch-friendly button sizing

---

## 🎓 Educational Value

### Learning Objectives
Siswa akan mempelajari:
- ✅ Operasi aritmatika dasar (PEMDAS/BODMAS)
- ✅ Persamaan linear (variable isolation)
- ✅ Fungsi linear & aplikasinya
- ✅ Grafik linear & interpretasi
- ✅ Problem-solving dengan pressure (timed gameplay)

### Engagement Strategy
- **Gamification**: Scoring, ranking, certificates
- **Narrative**: Story-driven motivation
- **Progression**: Difficulty scaling
- **Immediate Feedback**: Instant answer validation + visual effects
- **Multi-sensory**: Audio + visual + haptic (vibration)

---

## 🚀 Future Enhancements

### Planned Features
1. **Leaderboard**: Online scoring (backend required)
2. **Multiplayer**: Competitive duel mode
3. **More Question Types**: Geometry, trigonometry, calculus
4. **Customizable Questions**: Teacher dashboard
5. **Achievement System**: Badges & milestones
6. **Difficulty Progression**: Campaign mode dengan chapter
7. **Enemy Varieties**: Different AI personalities
8. **Weapon Upgrades**: Power-ups & special abilities
9. **Mobile App**: Wrapper untuk iOS/Android
10. **Analytics**: Learning progress tracking

---

## 🛠️ Development Stack

### Dependencies
- **Three.js** v0.126.0 - 3D Graphics Engine
- **Web APIs**: Canvas, WebGL, Web Audio, Pointer Lock, Gyroscope
- **HTML5/CSS3**: Responsive UI
- **Modern JavaScript**: ES6+ modules, Arrow functions, Classes

### Build & Deployment
- Pure JavaScript modules (no build step needed!)
- Works directly in browser with HTTP server
- CORS-free (all assets procedural or local)

### Version Control
- Git repository structure ready
- Modular code for easy contribution

---

## 📄 License & Credits

**Operasi Rimba** © 2026  
Created as an Educational Game for Mathematics Learning.

### Open Source Libraries
- Three.js by Ricardo Cabello (Mr. Doob)
- Web Audio API (W3C Standard)

---

## 📞 Support & Contact

Untuk pertanyaan atau feedback, silakan submit issue di repository project ini.
