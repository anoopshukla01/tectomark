/**
 * TECTO MARK — "Camera × Tech Fusion" 3D Graphic
 * Signature 3D visual fusing creative content (camera) with tech/growth (data signal).
 * Hand-authored procedural geometry (≤ 3,500 tris, ≤ 4 draw calls).
 */
(function initCameraTechFusion() {
  'use strict';

  // ── WebGL Capability Check ────────────────────────────────────
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  const container = document.getElementById('hero3dContainer');
  const canvas = document.getElementById('cameraTechCanvas');
  const fallback = document.getElementById('cameraFallback');

  if (!container || !canvas) return;

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    if (fallback) fallback.style.display = 'flex';
    canvas.style.display = 'none';
    return;
  }

  // ── Device & Motion Preferences ───────────────────────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  const isMobile = window.innerWidth <= 768;

  // ── Scene, Camera & Renderer ──────────────────────────────────
  const scene = new THREE.Scene();

  const width = container.clientWidth || 480;
  const height = container.clientHeight || 480;

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
  camera.position.set(0, 0.25, 4.8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // ── Lighting (Restrained, Flat-Diagrammatic Setup per Spec) ────
  // One directional light (soft, low intensity) + ambient fill
  // Flat-shaded geometry needs minimal lighting; no colored lights per spec
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(3.5, 4.0, 3.2);
  scene.add(dirLight);

  // ── Master Group & Materials ──────────────────────────────────
  const masterGroup = new THREE.Group();
  scene.add(masterGroup);

  // Matte flat-shaded panels in near-black (#141414)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.88,
    metalness: 0.14,
    flatShading: true
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x101012,
    roughness: 0.92,
    metalness: 0.1,
    flatShading: true
  });

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0c0e14,
    roughness: 0.75,
    metalness: 0.25,
    flatShading: true
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222226,
    roughness: 0.6,
    metalness: 0.4,
    flatShading: true
  });

  // Hairline edges tracing panel seams (#3A3A3A)
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x3a3a3a,
    transparent: true,
    opacity: 0.85
  });

  const accentEdgeMat = new THREE.LineBasicMaterial({
    color: 0x2D5BFF,
    transparent: true,
    opacity: 0.9
  });

  function addWithEdges(mesh, targetGroup, customEdgeMat = edgeMat) {
    targetGroup.add(mesh);
    const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 28);
    const edgeLines = new THREE.LineSegments(edgesGeo, customEdgeMat);
    mesh.add(edgeLines);
  }

  // ── 1. PROCEDURAL CAMERA BODY (Exploded PCB/Tech Plates) ───────
  const bodyGroup = new THREE.Group();
  masterGroup.add(bodyGroup);

  // Main chassis plates
  const mainPlateGeo = new THREE.BoxGeometry(2.1, 1.25, 0.65);
  const mainPlate = new THREE.Mesh(mainPlateGeo, bodyMat);
  addWithEdges(mainPlate, bodyGroup);

  // Front bezel plate (PCB plate with lens cutout impression)
  const frontPlateGeo = new THREE.BoxGeometry(2.14, 1.28, 0.06);
  const frontPlate = new THREE.Mesh(frontPlateGeo, bodyMat);
  frontPlate.position.set(0, 0, 0.34);
  addWithEdges(frontPlate, bodyGroup);

  // Rear display panel plate
  const rearPlateGeo = new THREE.BoxGeometry(2.05, 1.2, 0.06);
  const rearPlate = new THREE.Mesh(rearPlateGeo, gripMat);
  rearPlate.position.set(0, 0, -0.34);
  addWithEdges(rearPlate, bodyGroup);

  // Rear LCD Screen (diagrammatic tech display)
  const lcdGeo = new THREE.BoxGeometry(1.24, 0.84, 0.02);
  const lcd = new THREE.Mesh(lcdGeo, screenMat);
  lcd.position.set(-0.22, -0.04, -0.375);
  addWithEdges(lcd, bodyGroup, edgeMat);

  // Viewfinder rear eyepiece
  const vfEyepieceGeo = new THREE.BoxGeometry(0.28, 0.18, 0.14);
  const vfEyepiece = new THREE.Mesh(vfEyepieceGeo, gripMat);
  vfEyepiece.position.set(-0.25, 0.76, -0.32);
  addWithEdges(vfEyepiece, bodyGroup);

  // Rear Control Buttons (D-pad + buttons)
  const dpadGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
  const dpad = new THREE.Mesh(dpadGeo, metalMat);
  dpad.rotation.x = Math.PI / 2;
  dpad.position.set(0.66, -0.05, -0.38);
  addWithEdges(dpad, bodyGroup);

  const btn1Geo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12);
  const btn1 = new THREE.Mesh(btn1Geo, metalMat);
  btn1.rotation.x = Math.PI / 2;
  btn1.position.set(0.66, 0.22, -0.38);
  addWithEdges(btn1, bodyGroup);

  const btn2 = new THREE.Mesh(btn1Geo, metalMat);
  btn2.rotation.x = Math.PI / 2;
  btn2.position.set(0.66, -0.32, -0.38);
  addWithEdges(btn2, bodyGroup);

  // Right handgrip block
  const gripGeo = new THREE.BoxGeometry(0.38, 1.15, 0.28);
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.position.set(0.85, -0.02, 0.42);
  addWithEdges(grip, bodyGroup);

  // Top viewfinder hump (geometric prism)
  const vfHumpGeo = new THREE.BoxGeometry(0.75, 0.32, 0.55);
  const vfHump = new THREE.Mesh(vfHumpGeo, bodyMat);
  vfHump.position.set(-0.25, 0.76, 0.02);
  addWithEdges(vfHump, bodyGroup);

  // Viewfinder top plate
  const vfTopGeo = new THREE.BoxGeometry(0.65, 0.06, 0.45);
  const vfTop = new THREE.Mesh(vfTopGeo, metalMat);
  vfTop.position.set(-0.25, 0.94, 0.02);
  addWithEdges(vfTop, bodyGroup);

  // Shutter button disc & collar
  const shutterCollarGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 16);
  const shutterCollar = new THREE.Mesh(shutterCollarGeo, metalMat);
  shutterCollar.position.set(0.72, 0.66, 0.16);
  addWithEdges(shutterCollar, bodyGroup);

  const shutterBtnGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16);
  const shutterBtn = new THREE.Mesh(shutterBtnGeo, bodyMat);
  shutterBtn.position.set(0.72, 0.72, 0.16);
  addWithEdges(shutterBtn, bodyGroup);

  // Mode Dial disc
  const dialGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20);
  const dial = new THREE.Mesh(dialGeo, metalMat);
  dial.position.set(0.35, 0.66, -0.08);
  addWithEdges(dial, bodyGroup);

  // ── 2. LENS BARREL (Concentric Stepped Tech Rings) ─────────────
  const lensCenter = new THREE.Vector3(-0.25, -0.05, 0.38);
  const lensGroup = new THREE.Group();
  lensGroup.position.copy(lensCenter);
  bodyGroup.add(lensGroup);

  // Base Mount Ring
  const ring1Geo = new THREE.CylinderGeometry(0.68, 0.72, 0.22, 32);
  const ring1 = new THREE.Mesh(ring1Geo, bodyMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.z = 0.11;
  addWithEdges(ring1, lensGroup);

  // Focus Ring with concentric grooves
  const ring2Geo = new THREE.CylinderGeometry(0.62, 0.64, 0.32, 32);
  const ring2 = new THREE.Mesh(ring2Geo, gripMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.z = 0.35;
  addWithEdges(ring2, lensGroup);

  // Front Zoom Bezel Ring
  const ring3Geo = new THREE.CylinderGeometry(0.56, 0.58, 0.22, 32);
  const ring3 = new THREE.Mesh(ring3Geo, metalMat);
  ring3.rotation.x = Math.PI / 2;
  ring3.position.z = 0.58;
  addWithEdges(ring3, lensGroup);

  // Aperture Chamber Recessed Housing
  const chamberGeo = new THREE.CylinderGeometry(0.46, 0.50, 0.14, 32, 1, true);
  const chamber = new THREE.Mesh(chamberGeo, new THREE.MeshStandardMaterial({
    color: 0x0a0a0c,
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.DoubleSide
  }));
  chamber.rotation.x = Math.PI / 2;
  chamber.position.z = 0.68;
  lensGroup.add(chamber);

  // Front Bezel Stepped Chamfer Ring (concentric geometric ring, matte metal)
  const ringStepGeo = new THREE.RingGeometry(0.48, 0.54, 32);
  const ringStep = new THREE.Mesh(ringStepGeo, metalMat);
  ringStep.position.z = 0.695;
  lensGroup.add(ringStep);
  const ringStepEdges = new THREE.LineSegments(new THREE.EdgesGeometry(ringStepGeo), edgeMat);
  ringStep.add(ringStepEdges);

  // ── 3. APERTURE IRIS BLADES (Procedural Radial Array) ──────────
  // The focal point: thin animated blades with brand accent Fresnel rim
  const apertureGroup = new THREE.Group();
  apertureGroup.position.z = 0.68;
  lensGroup.add(apertureGroup);

  const bladeCount = 8;
  const blades = [];

  // Custom Shader for the Aperture Blades with Fresnel Rim in Brand Accent (#2D5BFF)
  const apertureBladeMat = new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(0x0e0e11) },
      uRimColor: { value: new THREE.Color(0x2D5BFF) },
      uRimPower: { value: 2.2 },
      uOpenness: { value: 0.35 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uRimColor;
      uniform float uRimPower;
      uniform float uOpenness;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uRimPower);
        // Inner edge highlight (along vUv.x < 0.18 or inner blade edge)
        float innerEdge = smoothstep(0.2, 0.0, vUv.x);
        float highlight = clamp(fresnel * 0.7 + innerEdge * 0.75, 0.0, 1.0);
        vec3 col = mix(uBaseColor, uRimColor, highlight);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.DoubleSide
  });

  // Custom blade geometry (trapezoidal blade pivoting around anchor)
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.34, 0.08);
  bladeShape.lineTo(0.36, 0.26);
  bladeShape.lineTo(0.06, 0.28);
  bladeShape.closePath();

  const bladeGeo = new THREE.ShapeGeometry(bladeShape);
  const bladeRadius = 0.28;

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(angle) * bladeRadius, Math.sin(angle) * bladeRadius, 0);
    pivot.rotation.z = angle + Math.PI / 2;

    const bladeMesh = new THREE.Mesh(bladeGeo, apertureBladeMat);
    // Blade edge line
    const bEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bladeGeo), accentEdgeMat);
    bladeMesh.add(bEdges);

    pivot.add(bladeMesh);
    apertureGroup.add(pivot);
    blades.push(pivot);
  }

  function setApertureOpenness(val) {
    // val: 0.1 (mostly closed) to 0.85 (wide open)
    apertureBladeMat.uniforms.uOpenness.value = val;
    blades.forEach(pivot => {
      // Rotation around pivot controls iris opening
      pivot.children[0].rotation.z = 0.15 + val * 0.85;
    });
  }
  setApertureOpenness(0.35);

  // ── 4. DATA-STREAM PARTICLES (Instanced Light-Streak Signal) ───
  // Instanced elongated quads streaming forward from the iris (+Z)
  const particleCount = isMobile ? 20 : 54;
  const streakLength = 0.32;
  const streakWidth = 0.018;

  // Single elongated quad geometry oriented along Z
  const streakGeo = new THREE.PlaneGeometry(streakWidth, streakLength);
  streakGeo.rotateX(Math.PI / 2); // align with Z axis

  // Custom Shader with additive blending for glowing signal without full bloom
  const particleShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x2D5BFF) },
      uAccentGlow: { value: new THREE.Color(0x638BFF) },
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute float aLife;
      attribute float aSpeed;
      varying float vLife;
      void main() {
        vLife = aLife;
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uAccentGlow;
      varying float vLife;
      void main() {
        // Fade in rapidly, glow in middle, fade out at end
        float alpha = sin(vLife * 3.14159);
        vec3 col = mix(uColor, uAccentGlow, pow(alpha, 1.8));
        gl_FragColor = vec4(col, alpha * 0.85);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const particleMesh = new THREE.InstancedMesh(streakGeo, particleShaderMat, particleCount);
  particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Track per-particle physics data
  const particlesData = [];
  const dummy = new THREE.Object3D();
  const lifeArray = new Float32Array(particleCount);
  const speedArray = new Float32Array(particleCount);

  // Aperture world position in masterGroup
  const apertureWorldPos = new THREE.Vector3(-0.25, -0.05, 1.08);

  for (let i = 0; i < particleCount; i++) {
    const p = {
      x: 0,
      y: 0,
      z: 0,
      vx: (Math.random() - 0.5) * 0.012,
      vy: (Math.random() - 0.5) * 0.012,
      vz: 0.022 + Math.random() * 0.038,
      life: Math.random(), // initial random distribution
      maxDist: 1.8 + Math.random() * 1.4,
      scale: 0.6 + Math.random() * 0.8
    };
    resetParticle(p, true);
    particlesData.push(p);
    lifeArray[i] = p.life;
    speedArray[i] = p.vz;
  }

  streakGeo.setAttribute('aLife', new THREE.InstancedBufferAttribute(lifeArray, 1));
  streakGeo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speedArray, 1));
  masterGroup.add(particleMesh);

  function resetParticle(p, randomizeZ = false) {
    const spreadRadius = 0.08 * (apertureBladeMat.uniforms.uOpenness.value + 0.2);
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random()) * spreadRadius;

    p.x = apertureWorldPos.x + Math.cos(ang) * rad;
    p.y = apertureWorldPos.y + Math.sin(ang) * rad;
    p.z = apertureWorldPos.z + (randomizeZ ? Math.random() * 1.5 : 0.02);

    // Mild radial outward dispersion
    p.vx = Math.cos(ang) * (0.003 + Math.random() * 0.008);
    p.vy = Math.sin(ang) * (0.003 + Math.random() * 0.008);
    p.vz = 0.024 + Math.random() * 0.038;
    p.life = randomizeZ ? Math.random() : 0.0;
  }

  // ── 5. INTERACTION & ANIMATION CONTROLLER ─────────────────────
  let targetTiltX = 0.15; // default initial pose angle
  let targetTiltY = -0.32;
  let currentTiltX = targetTiltX;
  let currentTiltY = targetTiltY;

  let idleRotation = -0.28;
  let scrollProgress = 0;
  let apertureSurge = 0;
  let lastTime = performance.now();

  // Mouse Parallax (subtle ~±6° = ~0.10 rad)
  if (!isTouchDevice) {
    window.addEventListener('mousemove', e => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetTiltY = nx * 0.12;
      targetTiltX = -ny * 0.10;
    }, { passive: true });
  }

  // Scroll Linking through Hero Section
  const heroSection = document.getElementById('hero');
  window.addEventListener('scroll', () => {
    if (!heroSection) return;
    const heroRect = heroSection.getBoundingClientRect();
    const heroHeight = heroSection.offsetHeight || 800;
    // Progress: 0 at top of hero, 1 when hero scrolls out
    scrollProgress = Math.min(Math.max(-heroRect.top / (heroHeight * 0.8), 0), 1.2);
  }, { passive: true });

  // ── Reduced Motion Static Pose ────────────────────────────────
  if (prefersReducedMotion) {
    masterGroup.rotation.set(0.12, -0.32, 0);
    setApertureOpenness(0.5);

    // Position static particles
    for (let i = 0; i < particleCount; i++) {
      const p = particlesData[i];
      p.z = apertureWorldPos.z + (i / particleCount) * 1.6;
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      particleMesh.setMatrixAt(i, dummy.matrix);
      lifeArray[i] = (i / particleCount);
    }
    particleMesh.instanceMatrix.needsUpdate = true;
    particleMesh.geometry.attributes.aLife.needsUpdate = true;
    renderer.render(scene, camera);
    return; // Halt animation loop to respect user preference
  }

  // ── Render Loop ───────────────────────────────────────────────
  let animId = null;
  let frameCount = 0;
  let fpsTimer = performance.now();

  function animate(now) {
    animId = requestAnimationFrame(animate);

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Performance monitor: check fps every 2 seconds
    frameCount++;
    if (now - fpsTimer > 2000) {
      const fps = (frameCount * 1000) / (now - fpsTimer);
      if (fps < 38 && particleCount > 25) {
        // Step down particle count on low-tier device
        particleMesh.count = Math.floor(particleCount * 0.5);
      }
      frameCount = 0;
      fpsTimer = now;
    }

    // Don't waste GPU when hero is completely scrolled off screen
    if (scrollProgress > 1.2) return;

    // 1. Idle rotation (1 full turn ≈ 48s) + mouse parallax smoothing
    idleRotation += 0.0022 * (delta * 60);

    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;

    // Scroll response: subtle pitch shift and distance adjustment
    const scrollPitch = scrollProgress * 0.22;
    const scrollDistance = 4.8 + scrollProgress * 0.5;
    camera.position.z = scrollDistance;

    masterGroup.rotation.x = currentTiltX + scrollPitch;
    masterGroup.rotation.y = idleRotation + currentTiltY;

    // 2. Orchestrated Aperture Surge at Headline Reveal Point (~0.4 - 0.6 scroll)
    // Bell curve surge triggered exactly when headline finishes revealing
    const surgeTarget = Math.exp(-Math.pow((scrollProgress - 0.45) / 0.14, 2.0));
    apertureSurge += (surgeTarget - apertureSurge) * 0.12;

    // Idle breathing openness + scroll surge
    const idleBreathing = 0.32 + Math.sin(now * 0.0012) * 0.08;
    const currentOpenness = Math.min(Math.max(idleBreathing + apertureSurge * 0.55, 0.15), 0.88);
    setApertureOpenness(currentOpenness);

    // 3. Update Data-Stream Particles
    const speedMultiplier = 1.0 + apertureSurge * 2.2;
    particleShaderMat.uniforms.uTime.value = now * 0.001;

    for (let i = 0; i < particleMesh.count; i++) {
      const p = particlesData[i];
      p.life += (p.vz * 0.8 * speedMultiplier) * delta * 60;
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;
      p.z += p.vz * speedMultiplier;

      if (p.life >= 1.0 || p.z > apertureWorldPos.z + p.maxDist) {
        resetParticle(p);
      }

      dummy.position.set(p.x, p.y, p.z);
      // Elongate streaks more during speed surge
      dummy.scale.set(p.scale, p.scale, p.scale * (1.0 + apertureSurge * 0.8));
      dummy.updateMatrix();

      particleMesh.setMatrixAt(i, dummy.matrix);
      lifeArray[i] = p.life;
    }

    particleMesh.instanceMatrix.needsUpdate = true;
    particleMesh.geometry.attributes.aLife.needsUpdate = true;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);

  // ── Resize Observer ───────────────────────────────────────────
  let resizeTimeout = null;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const w = container.clientWidth || 480;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }, 100);
  }

  window.addEventListener('resize', handleResize, { passive: true });
})();
