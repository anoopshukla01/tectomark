/**
 * TECTO MARK — "Interactive 3D Growth Network"
 * Topology visualizer in the About / Philosophy section.
 * Fuses a central geometric faceted core with an orbiting constellation
 * of interconnected data nodes and traveling signal pulses.
 */
(function initGrowthNetwork3D() {
  'use strict';

  // ── WebGL Capability Check ────────────────────────────────────
  function isWebGLAvailable() {
    try {
      const testCanvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl2') ||
          testCanvas.getContext('webgl') ||
          testCanvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  function setup() {
    const container = document.getElementById('aboutGrowthContainer');
    const canvas = document.getElementById('aboutGrowthCanvas');
    if (!container || !canvas) return;

    if (!isWebGLAvailable() || typeof THREE === 'undefined') {
      canvas.style.display = 'none';
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Scene, Camera & Renderer ──────────────────────────────────
    const scene = new THREE.Scene();

    const getWidth = () => canvas.parentElement ? canvas.parentElement.clientWidth : 500;
    const getHeight = () => canvas.parentElement ? canvas.parentElement.clientHeight : 280;

    let width = getWidth();
    let height = getHeight();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Lighting ──────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight1.position.set(3, 4, 3.5);
    scene.add(dirLight1);

    const blueLight = new THREE.DirectionalLight(0x2D5BFF, 1.4);
    blueLight.position.set(-3, -2, -1.5);
    scene.add(blueLight);

    // ── Network Group ─────────────────────────────────────────────
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // 1. Central Faceted Polyhedron Core
    const coreGeom = new THREE.IcosahedronGeometry(0.85, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x111319,
      metalness: 0.85,
      roughness: 0.25,
      flatShading: true
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    networkGroup.add(coreMesh);

    // Core Wireframe Edges
    const coreEdgesGeom = new THREE.EdgesGeometry(coreGeom);
    const coreEdgesMat = new THREE.LineBasicMaterial({
      color: 0x3B82F6,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const coreWireframe = new THREE.LineSegments(coreEdgesGeom, coreEdgesMat);
    networkGroup.add(coreWireframe);

    // Outer Geodesic Cage
    const cageGeom = new THREE.IcosahedronGeometry(1.22, 1);
    const cageEdgesGeom = new THREE.EdgesGeometry(cageGeom);
    const cageEdgesMat = new THREE.LineBasicMaterial({
      color: 0x60A5FA,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const cageWireframe = new THREE.LineSegments(cageEdgesGeom, cageEdgesMat);
    networkGroup.add(cageWireframe);

    // 2. Constellation of Orbiting Satellite Nodes
    const NODE_COUNT = 14;
    const nodeSpheres = [];
    const nodeBaseRadii = [];
    const nodeSpeeds = [];
    const nodeAngles = [];

    const nodeGeom = new THREE.SphereGeometry(0.048, 12, 12);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x60A5FA,
      emissive: 0x2D5BFF,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    for (let i = 0; i < NODE_COUNT; i++) {
      const mesh = new THREE.Mesh(nodeGeom, nodeMat);
      const radius = 1.45 + (i % 4) * 0.22;
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const inclination = ((i % 5) - 2) * 0.32;

      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(inclination) * radius * 0.7,
        Math.sin(angle) * radius
      );

      networkGroup.add(mesh);
      nodeSpheres.push(mesh);
      nodeBaseRadii.push(radius);
      nodeSpeeds.push(0.35 + (i % 3) * 0.15);
      nodeAngles.push(angle);
    }

    // 3. Dynamic Connecting Links Between Nodes
    const maxLinks = 40;
    const linkPositions = new Float32Array(maxLinks * 2 * 3);
    const linkGeom = new THREE.BufferGeometry();
    linkGeom.setAttribute('position', new THREE.BufferAttribute(linkPositions, 3));

    const linkMat = new THREE.LineBasicMaterial({
      color: 0x3B82F6,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const linkLines = new THREE.LineSegments(linkGeom, linkMat);
    networkGroup.add(linkLines);

    // 4. Signal Pulse Packets
    const PULSE_COUNT = 8;
    const pulsePositions = new Float32Array(PULSE_COUNT * 3);
    const pulseTargets = [];
    const pulseProgress = [];

    for (let i = 0; i < PULSE_COUNT; i++) {
      pulseTargets.push({
        fromNode: i % NODE_COUNT,
        toNode: (i + 3) % NODE_COUNT,
        speed: 0.012 + Math.random() * 0.015
      });
      pulseProgress.push(Math.random());
    }

    const pulseGeom = new THREE.BufferGeometry();
    pulseGeom.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));

    const pulseMat = new THREE.PointsMaterial({
      color: 0x93C5FD,
      size: 0.12,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const pulsePoints = new THREE.Points(pulseGeom, pulseMat);
    networkGroup.add(pulsePoints);

    // ── Interaction & Drag State ──────────────────────────────────
    let targetExpansion = 1.0;
    let currentExpansion = 1.0;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    container.addEventListener('pointerenter', () => {
      targetExpansion = 1.15;
      const stateEl = container.querySelector('.growth-m-val.accent-val');
      if (stateEl) stateEl.textContent = 'INTERACTING';
    });

    container.addEventListener('pointerleave', () => {
      targetExpansion = 1.0;
      targetRotX = 0;
      targetRotY = 0;
      const stateEl = container.querySelector('.growth-m-val.accent-val');
      if (stateEl) stateEl.textContent = 'ORBITING';
    });

    container.addEventListener('pointermove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        dragVelocityY += deltaX * 0.005;
        dragVelocityX += deltaY * 0.005;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotY = nx * 0.45;
        targetRotX = -ny * 0.35;
      }
    });

    canvas.addEventListener('pointerdown', (e) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointerup', (e) => {
      isDragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    });

    canvas.addEventListener('pointercancel', () => {
      isDragging = false;
    });

    // ── Visibility & Resize ───────────────────────────────────────
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    function onResize() {
      width = getWidth();
      height = getHeight();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    window.addEventListener('resize', onResize);

    // ── Animation Loop ────────────────────────────────────────────
    let lastTime = performance.now();

    function animate(now) {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      // Expansion lerp
      currentExpansion += (targetExpansion - currentExpansion) * 0.06;

      // Orbit satellites
      if (!prefersReducedMotion) {
        for (let i = 0; i < NODE_COUNT; i++) {
          nodeAngles[i] += nodeSpeeds[i] * delta * 0.65;
          const angle = nodeAngles[i];
          const radius = nodeBaseRadii[i] * currentExpansion;
          const inclination = ((i % 5) - 2) * 0.32;

          nodeSpheres[i].position.set(
            Math.cos(angle) * radius,
            Math.sin(inclination) * radius * 0.7,
            Math.sin(angle) * radius
          );
        }
      }

      // Update links between close nodes & core
      let linkIdx = 0;
      const positionsArr = linkGeom.attributes.position.array;
      const distThreshold = 1.6 * currentExpansion;

      for (let i = 0; i < NODE_COUNT && linkIdx < maxLinks; i++) {
        // Connect to core occasionally
        if (i % 2 === 0 && linkIdx < maxLinks) {
          positionsArr[linkIdx * 6 + 0] = 0;
          positionsArr[linkIdx * 6 + 1] = 0;
          positionsArr[linkIdx * 6 + 2] = 0;
          positionsArr[linkIdx * 6 + 3] = nodeSpheres[i].position.x;
          positionsArr[linkIdx * 6 + 4] = nodeSpheres[i].position.y;
          positionsArr[linkIdx * 6 + 5] = nodeSpheres[i].position.z;
          linkIdx++;
        }

        for (let j = i + 1; j < NODE_COUNT && linkIdx < maxLinks; j++) {
          const d = nodeSpheres[i].position.distanceTo(nodeSpheres[j].position);
          if (d < distThreshold) {
            positionsArr[linkIdx * 6 + 0] = nodeSpheres[i].position.x;
            positionsArr[linkIdx * 6 + 1] = nodeSpheres[i].position.y;
            positionsArr[linkIdx * 6 + 2] = nodeSpheres[i].position.z;
            positionsArr[linkIdx * 6 + 3] = nodeSpheres[j].position.x;
            positionsArr[linkIdx * 6 + 4] = nodeSpheres[j].position.y;
            positionsArr[linkIdx * 6 + 5] = nodeSpheres[j].position.z;
            linkIdx++;
          }
        }
      }
      linkGeom.setDrawRange(0, linkIdx * 2);
      linkGeom.attributes.position.needsUpdate = true;

      // Update signal pulses
      const pArr = pulseGeom.attributes.position.array;
      for (let i = 0; i < PULSE_COUNT; i++) {
        const pt = pulseTargets[i];
        pulseProgress[i] += pt.speed * (prefersReducedMotion ? 0 : 1);
        if (pulseProgress[i] > 1) {
          pulseProgress[i] = 0;
          pt.fromNode = Math.floor(Math.random() * NODE_COUNT);
          pt.toNode = Math.floor(Math.random() * NODE_COUNT);
        }

        const p1 = nodeSpheres[pt.fromNode].position;
        const p2 = nodeSpheres[pt.toNode].position;
        const progress = pulseProgress[i];

        pArr[i * 3 + 0] = THREE.MathUtils.lerp(p1.x, p2.x, progress);
        pArr[i * 3 + 1] = THREE.MathUtils.lerp(p1.y, p2.y, progress);
        pArr[i * 3 + 2] = THREE.MathUtils.lerp(p1.z, p2.z, progress);
      }
      pulseGeom.attributes.position.needsUpdate = true;

      // Network Group Rotation & Inertia
      if (!prefersReducedMotion) {
        networkGroup.rotation.y += 0.22 * delta;
        coreWireframe.rotation.x += 0.15 * delta;
        cageWireframe.rotation.y -= 0.12 * delta;
      }

      // Drag inertia
      networkGroup.rotation.y += dragVelocityY;
      networkGroup.rotation.x += dragVelocityX;
      dragVelocityX *= 0.92;
      dragVelocityY *= 0.92;

      // Parallax smoothing
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;
      camera.position.x = currentRotY * 1.5;
      camera.position.y = currentRotX * 1.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
