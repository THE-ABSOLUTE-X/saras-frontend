"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface RoverViewerProps {
  roll?: number | null; // roll in degrees from MPU6050
  pitch?: number | null; // pitch in degrees from MPU6050
  headAngle?: number; // head servo angle (0-180, default 90)
  armPosition?: string; // "Up" | "Down" | "Left" | "Right" | "Center"
  compact?: boolean; // compact widget mode for dashboard
  className?: string;
}

export default function RoverViewer({
  roll = 0,
  pitch = 0,
  headAngle = 90,
  armPosition = "Center",
  compact = false,
  className = "",
}: RoverViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Target Euler angles (in radians)
  const targetPitchRef = useRef<number>(0);
  const targetRollRef = useRef<number>(0);
  const targetHeadRef = useRef<number>(0);

  // Update target orientation when props change
  useEffect(() => {
    // Pitch & Roll conversion: degrees -> radians
    const safePitch =
      pitch !== null && pitch !== undefined && Number.isFinite(pitch)
        ? (pitch * Math.PI) / 180
        : 0;
    const safeRoll =
      roll !== null && roll !== undefined && Number.isFinite(roll)
        ? (roll * Math.PI) / 180
        : 0;

    targetPitchRef.current = safePitch;
    targetRollRef.current = safeRoll;

    // Head angle: 90 is center (0 rad), 0 is -90 deg (-PI/2), 180 is +90 deg (+PI/2)
    const safeHead =
      headAngle !== undefined && Number.isFinite(headAngle)
        ? ((headAngle - 90) * Math.PI) / 180
        : 0;
    targetHeadRef.current = safeHead;
  }, [pitch, roll, headAngle]);

  const resetViewRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || (compact ? 200 : 360);

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b14);

    // Subtle fog for depth
    scene.fog = new THREE.FogExp2(0x050b14, 0.05);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const initialCamPos = compact
      ? new THREE.Vector3(4.2, 3.2, 5.0)
      : new THREE.Vector3(4.5, 3.6, 5.5);
    camera.position.copy(initialCamPos);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanRimLight = new THREE.PointLight(0x06b6d4, 2.5, 15);
    cyanRimLight.position.set(-5, 2, -4);
    scene.add(cyanRimLight);

    const orangeUnderGlow = new THREE.PointLight(0xf97316, 1.2, 8);
    orangeUnderGlow.position.set(0, -0.4, 0);
    scene.add(orangeUnderGlow);

    // 5. Ground Grid & Gimbal Ring
    const gridHelper = new THREE.GridHelper(10, 20, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -1.0;
    scene.add(gridHelper);

    const ringGeo = new THREE.RingGeometry(2.3, 2.34, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.99;
    scene.add(ringMesh);

    // 6. Rover Root Object
    const roverRoot = new THREE.Group();
    scene.add(roverRoot);

    // Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.25,
    });
    const armorPlateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15,
    });
    const cyanAccentMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      metalness: 0.2,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.3,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });

    // -- Chassis Body --
    const bodyGroup = new THREE.Group();
    roverRoot.add(bodyGroup);

    // Lower chassis
    const lowerBodyGeo = new THREE.BoxGeometry(1.6, 0.45, 2.2);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, chassisMat);
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    bodyGroup.add(lowerBody);

    // Top armor cabin
    const topCabinGeo = new THREE.BoxGeometry(1.2, 0.4, 1.4);
    const topCabin = new THREE.Mesh(topCabinGeo, armorPlateMat);
    topCabin.position.set(0, 0.35, -0.1);
    topCabin.castShadow = true;
    bodyGroup.add(topCabin);

    // SARAS cyan stripes on sides
    const stripeGeo = new THREE.BoxGeometry(0.04, 0.08, 1.8);
    const leftStripe = new THREE.Mesh(stripeGeo, cyanAccentMat);
    leftStripe.position.set(-0.81, 0.05, 0);
    bodyGroup.add(leftStripe);

    const rightStripe = new THREE.Mesh(stripeGeo, cyanAccentMat);
    rightStripe.position.set(0.81, 0.05, 0);
    bodyGroup.add(rightStripe);

    // Battery pack block at rear
    const batteryGeo = new THREE.BoxGeometry(1.0, 0.3, 0.5);
    const batteryPack = new THREE.Mesh(batteryGeo, chassisMat);
    batteryPack.position.set(0, 0.3, 0.75);
    bodyGroup.add(batteryPack);

    // Front headlights
    const headlightGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    headlightGeo.rotateX(Math.PI / 2);
    const leftHeadlight = new THREE.Mesh(headlightGeo, cyanAccentMat);
    leftHeadlight.position.set(-0.55, 0.05, -1.1);
    bodyGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, cyanAccentMat);
    rightHeadlight.position.set(0.55, 0.05, -1.1);
    bodyGroup.add(rightHeadlight);

    // -- Wheels (4 All-Terrain Wheels) --
    const wheelRadius = 0.42;
    const wheelWidth = 0.32;
    const wheelGeo = new THREE.CylinderGeometry(
      wheelRadius,
      wheelRadius,
      wheelWidth,
      24
    );
    wheelGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(
      wheelRadius * 0.55,
      wheelRadius * 0.55,
      wheelWidth + 0.02,
      16
    );
    rimGeo.rotateZ(Math.PI / 2);

    const wheels: THREE.Mesh[] = [];
    const wheelPositions = [
      [-1.05, -0.25, -0.75], // Front Left
      [1.05, -0.25, -0.75], // Front Right
      [-1.05, -0.25, 0.75], // Rear Left
      [1.05, -0.25, 0.75], // Rear Right
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wheelMesh.position.set(x, y, z);
      wheelMesh.castShadow = true;

      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelMesh.add(rim);

      // Cyan axle hub
      const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, wheelWidth + 0.05, 12);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, cyanAccentMat);
      wheelMesh.add(hub);

      bodyGroup.add(wheelMesh);
      wheels.push(wheelMesh);
    });

    // -- Head / Camera Turret (Servo controlled) --
    const headTurret = new THREE.Group();
    headTurret.position.set(0, 0.55, -0.5);
    bodyGroup.add(headTurret);

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 12);
    const mast = new THREE.Mesh(mastGeo, chassisMat);
    mast.position.y = 0.175;
    headTurret.add(mast);

    // Sensor head enclosure
    const headBoxGeo = new THREE.BoxGeometry(0.4, 0.22, 0.28);
    const headBox = new THREE.Mesh(headBoxGeo, armorPlateMat);
    headBox.position.y = 0.42;
    headTurret.add(headBox);

    // Camera lens / sensor aperture (red glowing lens)
    const lensGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16);
    lensGeo.rotateX(Math.PI / 2);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.42, -0.15);
    headTurret.add(lens);

    // Secondary optical sensor
    const secSensorGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12);
    secSensorGeo.rotateX(Math.PI / 2);
    const secSensor = new THREE.Mesh(secSensorGeo, cyanAccentMat);
    secSensor.position.set(0.12, 0.42, -0.14);
    headTurret.add(secSensor);

    // -- Manipulator Arms (Left & Right) --
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.7, 0.15, -0.5);
    bodyGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.7, 0.15, -0.5);
    bodyGroup.add(rightArmGroup);

    const buildArm = (group: THREE.Group, isLeft: boolean) => {
      // Shoulder joint
      const shoulderGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const shoulder = new THREE.Mesh(shoulderGeo, cyanAccentMat);
      group.add(shoulder);

      // Upper arm link
      const armLinkGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
      armLinkGeo.rotateX(Math.PI / 4);
      const armLink = new THREE.Mesh(armLinkGeo, chassisMat);
      armLink.position.set(0, 0.1, -0.2);
      group.add(armLink);

      // Gripper claws
      const clawGeo = new THREE.BoxGeometry(0.03, 0.15, 0.05);
      const claw1 = new THREE.Mesh(clawGeo, rimMat);
      claw1.position.set(isLeft ? -0.05 : 0.05, 0.22, -0.4);
      claw1.rotation.z = isLeft ? 0.3 : -0.3;
      group.add(claw1);

      const claw2 = new THREE.Mesh(clawGeo, rimMat);
      claw2.position.set(isLeft ? 0.05 : -0.05, 0.22, -0.4);
      claw2.rotation.z = isLeft ? -0.3 : 0.3;
      group.add(claw2);
    };

    buildArm(leftArmGroup, true);
    buildArm(rightArmGroup, false);

    // 7. Interactive Orbit Controls (Pointer Drag)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = {
      radius: camera.position.length(),
      theta: Math.atan2(camera.position.x, camera.position.z),
      phi: Math.acos(camera.position.y / camera.position.length()),
    };

    const updateCameraFromSpherical = () => {
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi));
      spherical.radius = Math.max(3.0, Math.min(10.0, spherical.radius));

      camera.position.x =
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z =
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      setIsInteracting(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      container.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= deltaX * 0.008;
      spherical.phi -= deltaY * 0.008;
      updateCameraFromSpherical();
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      setIsInteracting(false);
      try {
        container.releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore if already released
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius += e.deltaY * 0.004;
      updateCameraFromSpherical();
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });

    resetViewRef.current = () => {
      spherical = {
        radius: initialCamPos.length(),
        theta: Math.atan2(initialCamPos.x, initialCamPos.z),
        phi: Math.acos(initialCamPos.y / initialCamPos.length()),
      };
      updateCameraFromSpherical();
    };

    camera.lookAt(0, 0, 0);

    // 8. Animation Loop with Smooth Slerp/Lerp
    let animId: number;
    const clock = new THREE.Clock();

    const currentRotation = new THREE.Euler(0, 0, 0, "YXZ");
    let currentHeadAngle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth interpolation (lerp) toward target pitch and roll
      // Pitch tilts about X-axis, Roll tilts about Z-axis
      const lerpFactor = Math.min(1.0, delta * 8.0);
      currentRotation.x = THREE.MathUtils.lerp(
        currentRotation.x,
        targetPitchRef.current,
        lerpFactor
      );
      currentRotation.z = THREE.MathUtils.lerp(
        currentRotation.z,
        -targetRollRef.current,
        lerpFactor
      );

      // Subtle suspension idle breathing if no severe pitch/roll
      const isLevel =
        Math.abs(targetPitchRef.current) < 0.02 &&
        Math.abs(targetRollRef.current) < 0.02;
      const idleBob = isLevel ? Math.sin(time * 2.0) * 0.015 : 0;

      roverRoot.rotation.x = currentRotation.x;
      roverRoot.rotation.z = currentRotation.z;
      roverRoot.position.y = idleBob;

      // Smooth head turret rotation
      currentHeadAngle = THREE.MathUtils.lerp(
        currentHeadAngle,
        targetHeadRef.current,
        lerpFactor
      );
      headTurret.rotation.y = currentHeadAngle;

      // Arm position animation
      const armTargetAngle =
        armPosition === "Up"
          ? -0.6
          : armPosition === "Down"
            ? 0.5
            : 0.0;
      leftArmGroup.rotation.x = THREE.MathUtils.lerp(
        leftArmGroup.rotation.x,
        armTargetAngle,
        lerpFactor
      );
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(
        rightArmGroup.rotation.x,
        armTargetAngle,
        lerpFactor
      );

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("wheel", onWheel);

      renderer.dispose();
      lowerBodyGeo.dispose();
      topCabinGeo.dispose();
      wheelGeo.dispose();
      rimGeo.dispose();
      chassisMat.dispose();
      armorPlateMat.dispose();
      cyanAccentMat.dispose();
      wheelMat.dispose();
      rimMat.dispose();
      lensMat.dispose();
      gridHelper.dispose();
      ringGeo.dispose();
      ringMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [compact, armPosition]);

  const displayRoll =
    roll !== null && roll !== undefined && Number.isFinite(roll)
      ? `${roll.toFixed(1)}°`
      : "--";
  const displayPitch =
    pitch !== null && pitch !== undefined && Number.isFinite(pitch)
      ? `${pitch.toFixed(1)}°`
      : "--";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-800 bg-[#050B14] select-none ${className}`}
    >
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: compact ? "180px" : "320px" }}
      />

      {/* Top Overlay Badge */}
      <div className="absolute top-2.5 left-2.5 pointer-events-none flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md border border-cyan-500/20 bg-slate-950/80 px-2.5 py-1 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            3D Attitude {compact ? "" : "• MPU6050"}
          </span>
        </div>
      </div>

      {/* Angle Readouts HUD */}
      <div className="absolute top-2.5 right-2.5 pointer-events-none flex items-center gap-2">
        <div className="rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 font-mono text-[10px] text-slate-300 backdrop-blur-sm">
          <span className="text-slate-500">PITCH: </span>
          <span className="font-bold text-white">{displayPitch}</span>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 font-mono text-[10px] text-slate-300 backdrop-blur-sm">
          <span className="text-slate-500">ROLL: </span>
          <span className="font-bold text-white">{displayRoll}</span>
        </div>
      </div>

      {/* Bottom Controls / Helper */}
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
        <span className="font-mono text-[9px] text-slate-500">
          {isInteracting ? "Rotating View" : "Drag to orbit • Scroll to zoom"}
        </span>

        <button
          type="button"
          onClick={() => resetViewRef.current?.()}
          className="rounded border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[9px] font-medium text-slate-400 hover:border-slate-700 hover:text-white transition backdrop-blur-sm"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
