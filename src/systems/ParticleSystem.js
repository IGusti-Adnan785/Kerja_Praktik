import * as THREE from 'https://unpkg.com/three@0.126.0/build/three.module.js';

export default class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        
        // Geometri kotak kecil untuk partikel
        this.geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        
        // Material merah (untuk darah/musuh) dan kuning/abu (untuk tembok/api)
        this.matBlood = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
        this.matSparks = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    }

    spawn(position, isEnemyHit) {
        const count = isEnemyHit ? 15 : 8; // Darah lebih banyak dari percikan api
        const mat = isEnemyHit ? this.matBlood : this.matSparks;

        for(let i=0; i<count; i++) {
            const p = new THREE.Mesh(this.geo, mat);
            p.position.copy(position);
            
            // Beri kecepatan lemparan acak ke segala arah
            p.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 8,
                (Math.random() - 0.5) * 8
            );
            
            p.life = 1.0; // Umur partikel 1 detik
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    update(delta) {
        for(let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life -= delta;
            
            if(p.life <= 0) {
                // Hapus partikel jika umurnya habis
                this.scene.remove(p);
                this.particles.splice(i, 1);
            } else {
                // Terapkan Gravitasi (turun ke bawah)
                p.velocity.y -= 20.0 * delta; 
                
                // Pindahkan posisi
                p.position.addScaledVector(p.velocity, delta);
                
                // Mengecil seiring waktu
                p.scale.setScalar(p.life); 
            }
        }
    }
}