import * as THREE from 'three';
import { latLonToVector3 } from './countryService.js';
import { sounds } from './audio.js';

export class TravelerCharacter {
  constructor(globeRadius = 20) {
    this.globeRadius = globeRadius;
    this.lat = 39.0; // Start in Turkey!
    this.lon = 35.0;
    this.heading = 0; // Degrees (0 = North, 90 = East, 180 = South, 270 = West)
    this.isWalking = false;
    this.walkCycle = 0;
    this.speed = 1.0;
    this.currentCountry = null;
    this.isCelebrating = false;
    this.celebrateTime = 0;

    this.flagCache = new Map();

    // Create Canvas for T-Shirt Texture
    this.tshirtCanvas = document.createElement('canvas');
    this.tshirtCanvas.width = 512;
    this.tshirtCanvas.height = 512;
    this.tshirtCtx = this.tshirtCanvas.getContext('2d');
    this.tshirtTexture = new THREE.CanvasTexture(this.tshirtCanvas);
    this.tshirtTexture.anisotropy = 8;

    // Create 3D Character Mesh Hierarchy
    this.group = new THREE.Group();
    this.buildMesh();

    // Initial render of T-shirt
    this.renderTShirt(null);
    this.updatePosition();
  }

  buildMesh() {
    // Character root container
    this.modelRoot = new THREE.Group();
    this.group.add(this.modelRoot);

    // --- MATERIALS ---
    // T-shirt material uses our dynamic CanvasTexture on the chest
    this.tshirtMaterial = new THREE.MeshStandardMaterial({
      map: this.tshirtTexture,
      roughness: 0.6,
      metalness: 0.1
    });

    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd1a4,
      roughness: 0.7
    });

    const pantsMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Cool Blue Jeans
      roughness: 0.8
    });

    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red sneakers
      roughness: 0.5
    });

    const hairCapMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark navy cap
      roughness: 0.5
    });

    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // --- TORSO (T-SHIRT) ---
    // Using a box for the torso with 6 materials: front has tshirtMaterial
    const plainTshirtMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.7
    });

    const torsoMaterials = [
      plainTshirtMaterial, // right
      plainTshirtMaterial, // left
      plainTshirtMaterial, // top
      plainTshirtMaterial, // bottom
      this.tshirtMaterial, // front (+Z)
      plainTshirtMaterial  // back (-Z)
    ];

    const torsoGeo = new THREE.BoxGeometry(0.5, 0.58, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, torsoMaterials);
    this.torso.position.y = 0.95;
    this.torso.castShadow = true;
    this.modelRoot.add(this.torso);

    // --- NECK & HEAD ---
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.1, 12);
    const neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.position.y = 0.33;
    this.torso.add(neck);

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.52;
    this.torso.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.2, 20, 20);
    this.head = new THREE.Mesh(headGeo, skinMaterial);
    this.head.castShadow = true;
    this.headGroup.add(this.head);

    // Cap / Hair
    const capGeo = new THREE.SphereGeometry(0.21, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const cap = new THREE.Mesh(capGeo, hairCapMaterial);
    cap.position.y = 0.02;
    this.headGroup.add(cap);

    // Cap Visor
    const visorGeo = new THREE.BoxGeometry(0.22, 0.03, 0.16);
    const visor = new THREE.Mesh(visorGeo, hairCapMaterial);
    visor.position.set(0, 0.07, 0.18);
    visor.rotation.x = 0.15;
    this.headGroup.add(visor);

    // Cute stylized eyes
    const eyeGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMaterial);
    eyeL.position.set(-0.065, 0.01, 0.17);
    this.headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMaterial);
    eyeR.position.set(0.065, 0.01, 0.17);
    this.headGroup.add(eyeR);

    // Friendly smile
    const smileGeo = new THREE.TorusGeometry(0.04, 0.012, 8, 12, Math.PI);
    const smile = new THREE.Mesh(smileGeo, eyeMaterial);
    smile.rotation.x = Math.PI * 0.9;
    smile.position.set(0, -0.07, 0.18);
    this.headGroup.add(smile);

    // --- SHOULDERS & ARMS ---
    // Left Arm
    this.armPivotL = new THREE.Group();
    this.armPivotL.position.set(-0.32, 0.2, 0);
    this.torso.add(this.armPivotL);

    const sleeveGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.16, 12);
    const sleeveL = new THREE.Mesh(sleeveGeo, plainTshirtMaterial);
    sleeveL.position.y = -0.06;
    this.armPivotL.add(sleeveL);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.32, 12);
    const armL = new THREE.Mesh(armGeo, skinMaterial);
    armL.position.y = -0.22;
    this.armPivotL.add(armL);

    const handGeo = new THREE.SphereGeometry(0.075, 12, 12);
    const handL = new THREE.Mesh(handGeo, skinMaterial);
    handL.position.y = -0.4;
    this.armPivotL.add(handL);

    // Right Arm
    this.armPivotR = new THREE.Group();
    this.armPivotR.position.set(0.32, 0.2, 0);
    this.torso.add(this.armPivotR);

    const sleeveR = new THREE.Mesh(sleeveGeo, plainTshirtMaterial);
    sleeveR.position.y = -0.06;
    this.armPivotR.add(sleeveR);

    const armR = new THREE.Mesh(armGeo, skinMaterial);
    armR.position.y = -0.22;
    this.armPivotR.add(armR);

    const handR = new THREE.Mesh(handGeo, skinMaterial);
    handR.position.y = -0.4;
    this.armPivotR.add(handR);

    // --- LEGS & SHOES ---
    // Left Leg
    this.legPivotL = new THREE.Group();
    this.legPivotL.position.set(-0.14, -0.28, 0);
    this.torso.add(this.legPivotL);

    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.42, 12);
    const legL = new THREE.Mesh(legGeo, pantsMaterial);
    legL.position.y = -0.2;
    legL.castShadow = true;
    this.legPivotL.add(legL);

    // Left Shoe
    const shoeGeo = new THREE.BoxGeometry(0.14, 0.1, 0.24);
    const shoeL = new THREE.Mesh(shoeGeo, shoeMaterial);
    shoeL.position.set(0, -0.44, 0.04);
    this.legPivotL.add(shoeL);

    const shoeSoleGeo = new THREE.BoxGeometry(0.145, 0.03, 0.25);
    const shoeSoleL = new THREE.Mesh(shoeSoleGeo, whiteMaterial);
    shoeSoleL.position.set(0, -0.49, 0.04);
    this.legPivotL.add(shoeSoleL);

    // Right Leg
    this.legPivotR = new THREE.Group();
    this.legPivotR.position.set(0.14, -0.28, 0);
    this.torso.add(this.legPivotR);

    const legR = new THREE.Mesh(legGeo, pantsMaterial);
    legR.position.y = -0.2;
    legR.castShadow = true;
    this.legPivotR.add(legR);

    // Right Shoe
    const shoeR = new THREE.Mesh(shoeGeo, shoeMaterial);
    shoeR.position.set(0, -0.44, 0.04);
    this.legPivotR.add(shoeR);

    const shoeSoleR = new THREE.Mesh(shoeSoleGeo, whiteMaterial);
    shoeSoleR.position.set(0, -0.49, 0.04);
    this.legPivotR.add(shoeSoleR);

    // --- GROUND SHADOW DISC ---
    const shadowGeo = new THREE.CircleGeometry(0.42, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050510,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowDisc.rotation.x = -Math.PI / 2;
    this.shadowDisc.position.y = 0.02;
    this.modelRoot.add(this.shadowDisc);

    // --- FLOATING DESTINATION / STATUS PIN ---
    const ringGeo = new THREE.RingGeometry(0.45, 0.52, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    this.pulseRing = new THREE.Mesh(ringGeo, ringMat);
    this.pulseRing.rotation.x = -Math.PI / 2;
    this.pulseRing.position.y = 0.03;
    this.modelRoot.add(this.pulseRing);
  }

  // Render T-shirt graphics onto 512x512 Canvas
  renderTShirt(country) {
    const ctx = this.tshirtCtx;
    const w = this.tshirtCanvas.width;
    const h = this.tshirtCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!country) {
      // Ocean / International Waters design
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Waves illustration
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 6;
      for (let y = 140; y <= 380; y += 50) {
        ctx.beginPath();
        for (let x = 40; x <= 470; x += 30) {
          ctx.quadraticCurveTo(x + 15, y - 18, x + 30, y);
        }
        ctx.stroke();
      }

      // Compass / Nautical Badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌊 AÇIK DENİZ', w / 2, 230);

      ctx.font = '500 24px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Uluslararası Sular', w / 2, 280);

      // Collar trim
      this.drawTShirtCollar(ctx, w, '#0284c7');
      this.tshirtTexture.needsUpdate = true;
      return;
    }

    // Country Flag Design
    const iso = country.id ? country.id.toLowerCase() : 'un';

    // T-shirt base background (clean modern dark navy/black or white frame)
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    baseGrad.addColorStop(0, '#18181b');
    baseGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Fabric Texture / Mesh effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Draw Flag Badge Frame
    const badgeX = 56;
    const badgeY = 90;
    const badgeW = w - 112;
    const badgeH = 260;
    const cornerR = 24;

    // Outer glow
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, badgeX - 4, badgeY - 4, badgeW + 8, badgeH + 8, cornerR + 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Check flag cache
    if (this.flagCache.has(iso)) {
      const img = this.flagCache.get(iso);
      ctx.save();
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, cornerR);
      ctx.clip();
      ctx.drawImage(img, badgeX, badgeY, badgeW, badgeH);
      ctx.restore();
    } else {
      // Procedural flag placeholder while downloading
      ctx.save();
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, cornerR);
      ctx.clip();
      ctx.fillStyle = '#27272a';
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(iso.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH / 2 + 25);
      ctx.restore();

      // Load Flag Image asynchronously
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        this.flagCache.set(iso, img);
        // If this country is still current, re-render!
        if (this.currentCountry && this.currentCountry.id.toLowerCase() === iso) {
          this.renderTShirt(this.currentCountry);
        }
      };
      img.src = `https://flagcdn.com/w320/${iso}.png`;
    }

    // Country Title below Flag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    const displayName = (country.name_tr || country.name || '').toUpperCase();
    ctx.fillText(displayName, w / 2, 400);

    // Capital & Continent tag
    ctx.font = '600 22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(country.capital || '', w / 2, 440);

    // Collar
    this.drawTShirtCollar(ctx, w, '#e4e4e7');
    this.tshirtTexture.needsUpdate = true;
  }

  drawTShirtCollar(ctx, w, color) {
    ctx.beginPath();
    ctx.arc(w / 2, -20, 90, 0, Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  setCountry(country) {
    const prevId = this.currentCountry ? this.currentCountry.id : null;
    const newId = country ? country.id : null;

    if (prevId !== newId) {
      this.currentCountry = country;
      this.renderTShirt(country);
      if (country) {
        sounds.playCountryChime();
      } else {
        sounds.playOceanBreeze();
      }
    }
  }

  celebrate() {
    this.isCelebrating = true;
    this.celebrateTime = 0;
    sounds.playCelebration();
  }

  updatePosition() {
    // 3D position on the sphere surface
    const pos = latLonToVector3(this.lat, this.lon, this.globeRadius);
    this.group.position.copy(pos);

    // Normal vector pointing outward from globe center
    const normal = pos.clone().normalize();

    // Compute North tangent vector at current position
    // As lat increases, we move North:
    const northPos = latLonToVector3(this.lat + 0.1, this.lon, this.globeRadius);
    const northTangent = northPos.sub(pos).projectOnPlane(normal).normalize();

    // Compute East tangent vector (normal x north)
    const eastTangent = new THREE.Vector3().crossVectors(northTangent, normal).normalize();

    // Combine according to heading angle:
    // heading = 0 -> North, 90 -> East, 180 -> South, 270 -> West
    const rad = this.heading * (Math.PI / 180);
    const forward = new THREE.Vector3()
      .addScaledVector(northTangent, Math.cos(rad))
      .addScaledVector(eastTangent, -Math.sin(rad))
      .normalize();

    // Orient character:
    // character +Y = normal (up), character +Z = forward
    const matrix = new THREE.Matrix4();
    const right = new THREE.Vector3().crossVectors(normal, forward).normalize();
    matrix.makeBasis(right, normal, forward);
    this.group.quaternion.setFromRotationMatrix(matrix);
  }

  update(delta, time) {
    // Walking animation
    if (this.isWalking) {
      this.walkCycle += delta * 8 * this.speed;

      // Leg swings
      const legAngle = Math.sin(this.walkCycle) * 0.55;
      this.legPivotL.rotation.x = legAngle;
      this.legPivotR.rotation.x = -legAngle;

      // Arm swings opposite to legs
      const armAngle = -Math.sin(this.walkCycle) * 0.45;
      this.armPivotL.rotation.x = armAngle;
      this.armPivotR.rotation.x = -armAngle;

      // Torso bobbing
      this.torso.position.y = 0.95 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;

      // Head slight bounce
      this.headGroup.rotation.z = Math.sin(this.walkCycle) * 0.04;

      // Audio footstep
      if (Math.sin(this.walkCycle) > 0.95 || Math.sin(this.walkCycle) < -0.95) {
        sounds.playFootstep();
      }
    } else if (this.isCelebrating) {
      this.celebrateTime += delta;
      // Happy dance: arms raised, jumping
      this.armPivotL.rotation.z = 2.4 + Math.sin(this.celebrateTime * 10) * 0.2;
      this.armPivotR.rotation.z = -2.4 - Math.sin(this.celebrateTime * 10) * 0.2;
      this.armPivotL.rotation.x = 0;
      this.armPivotR.rotation.x = 0;
      this.torso.position.y = 0.95 + Math.abs(Math.sin(this.celebrateTime * 8)) * 0.15;
      this.headGroup.rotation.y = Math.sin(this.celebrateTime * 6) * 0.3;

      if (this.celebrateTime > 2.5) {
        this.isCelebrating = false;
        this.armPivotL.rotation.z = 0;
        this.armPivotR.rotation.z = 0;
      }
    } else {
      // Idle animation: smooth return and gentle breathing
      this.legPivotL.rotation.x *= 0.85;
      this.legPivotR.rotation.x *= 0.85;
      this.armPivotL.rotation.x *= 0.85;
      this.armPivotR.rotation.x *= 0.85;
      this.armPivotL.rotation.z *= 0.85;
      this.armPivotR.rotation.z *= 0.85;
      this.torso.position.y = 0.95 + Math.sin(time * 2.5) * 0.015;
      this.headGroup.rotation.z = 0;
      this.headGroup.rotation.y = Math.sin(time * 1.2) * 0.08;
    }

    // Pulse ring animation
    const scale = 1.0 + Math.sin(time * 4) * 0.15;
    this.pulseRing.scale.set(scale, scale, scale);
  }
}

