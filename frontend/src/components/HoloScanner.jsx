import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const H = Math.PI / 2;

// Anatomical humanoid in T-pose, built from primitives.
const PARTS = [
  { g: "sphere", args: [0.17, 24, 24], pos: [0, 1.55, 0], scale: [1, 1.1, 1] },
  { g: "capsule", args: [0.07, 0.1, 6, 12], pos: [0, 1.38, 0] },
  { g: "capsule", args: [0.24, 0.42, 10, 22], pos: [0, 1.02, 0], scale: [1, 1, 0.6] },
  { g: "capsule", args: [0.19, 0.24, 8, 18], pos: [0, 0.66, 0], scale: [1, 1, 0.58] },
  { g: "capsule", args: [0.22, 0.2, 8, 18], pos: [0, 0.42, 0], scale: [1, 1, 0.58] },
  { g: "sphere", args: [0.1, 16, 16], pos: [-0.28, 1.2, 0] },
  { g: "sphere", args: [0.1, 16, 16], pos: [0.28, 1.2, 0] },
  { g: "capsule", args: [0.07, 0.32, 6, 14], pos: [-0.5, 1.2, 0], rot: [0, 0, H] },
  { g: "capsule", args: [0.07, 0.32, 6, 14], pos: [0.5, 1.2, 0], rot: [0, 0, H] },
  { g: "sphere", args: [0.06, 14, 14], pos: [-0.72, 1.2, 0] },
  { g: "sphere", args: [0.06, 14, 14], pos: [0.72, 1.2, 0] },
  { g: "capsule", args: [0.055, 0.34, 6, 14], pos: [-0.94, 1.2, 0], rot: [0, 0, H] },
  { g: "capsule", args: [0.055, 0.34, 6, 14], pos: [0.94, 1.2, 0], rot: [0, 0, H] },
  { g: "sphere", args: [0.08, 14, 14], pos: [-1.19, 1.2, 0], scale: [1.2, 0.7, 0.5] },
  { g: "sphere", args: [0.08, 14, 14], pos: [1.19, 1.2, 0], scale: [1.2, 0.7, 0.5] },
  { g: "sphere", args: [0.09, 16, 16], pos: [-0.13, 0.32, 0] },
  { g: "sphere", args: [0.09, 16, 16], pos: [0.13, 0.32, 0] },
  { g: "capsule", args: [0.11, 0.42, 6, 14], pos: [-0.14, 0.0, 0] },
  { g: "capsule", args: [0.11, 0.42, 6, 14], pos: [0.14, 0.0, 0] },
  { g: "sphere", args: [0.08, 14, 14], pos: [-0.14, -0.3, 0] },
  { g: "sphere", args: [0.08, 14, 14], pos: [0.14, -0.3, 0] },
  { g: "capsule", args: [0.085, 0.44, 6, 14], pos: [-0.14, -0.6, 0] },
  { g: "capsule", args: [0.085, 0.44, 6, 14], pos: [0.14, -0.6, 0] },
  { g: "capsule", args: [0.07, 0.14, 6, 12], pos: [-0.14, -0.92, 0.07], rot: [H, 0, 0] },
  { g: "capsule", args: [0.07, 0.14, 6, 12], pos: [0.14, -0.92, 0.07], rot: [H, 0, 0] },
];

// smooth geometry (no visible facets)
function Geo({ g, args }) {
  if (g === "sphere") return <sphereGeometry args={[args[0], 36, 28]} />;
  return <capsuleGeometry args={[args[0], args[1], 16, 32]} />;
}

const vertexShader = `
  varying vec3 vN;
  varying vec3 vView;
  varying float vWorldY;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldY = world.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

// smooth filled hologram: fresnel rim + translucent core + moving scan bands
const fragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uBands;
  varying vec3 vN;
  varying vec3 vView;
  varying float vWorldY;
  void main() {
    float d = abs(dot(normalize(vN), normalize(vView)));
    float fres = pow(1.0 - d, uPower);
    float bands = 0.5 + 0.5 * sin(vWorldY * 42.0 - uTime * 3.0);
    bands = smoothstep(0.55, 1.0, bands) * uBands;
    vec3 col = mix(uCore, uColor, fres);
    col += bands * 0.22 * uColor;
    float alpha = 0.08 + fres * 0.7 + bands * 0.08;
    gl_FragColor = vec4(col * uIntensity, clamp(alpha, 0.0, 1.0));
  }
`;

function HoloMat({ power, intensity, bands, side = THREE.FrontSide, matRef }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#FF6A3D") },
      uCore: { value: new THREE.Color("#DF350D") },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uTime: { value: 0 },
      uBands: { value: bands },
    }),
    [power, intensity, bands]
  );
  return (
    <shaderMaterial
      ref={matRef}
      args={[{ uniforms, vertexShader, fragmentShader, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side }]}
    />
  );
}

function NeonPart({ p }) {
  const m1 = useRef();
  const m2 = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (m1.current) m1.current.uniforms.uTime.value = t;
    if (m2.current) m2.current.uniforms.uTime.value = t;
  });
  return (
    <group position={p.pos} rotation={p.rot || [0, 0, 0]} scale={p.scale || 1}>
      {/* core filled hologram with scan bands */}
      <mesh>
        <Geo g={p.g} args={p.args} />
        <HoloMat matRef={m1} power={2.6} intensity={0.94} bands={0.77} />
      </mesh>
      {/* soft outer halo (back side) */}
      <mesh scale={1.16}>
        <Geo g={p.g} args={p.args} />
        <HoloMat matRef={m2} power={1.6} intensity={0.33} bands={0.0} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function Humanoid() {
  const group = useRef();
  const scan = useRef();
  const scanGlow = useRef();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.28;
      group.current.position.y = -0.1 + Math.sin(t * 0.7) * 0.04;
    }
    if (scan.current) {
      const y = 0.25 + Math.sin(t * 0.6) * 1.25;
      scan.current.position.y = y;
      if (scanGlow.current) scanGlow.current.position.y = y;
    }
  });

  return (
    <group ref={group} scale={0.74}>
      {PARTS.map((p, i) => (
        <NeonPart key={i} p={p} />
      ))}

      <mesh ref={scan} rotation={[H, 0, 0]}>
        <torusGeometry args={[1.15, 0.008, 8, 90]} />
        <meshBasicMaterial color="#FFE88A" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={scanGlow} rotation={[H, 0, 0]}>
        <torusGeometry args={[1.15, 0.06, 8, 90]} />
        <meshBasicMaterial color="#DF350D" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, -1.15, 0]} rotation={[H, 0, 0]}>
        <torusGeometry args={[0.9, 0.012, 8, 90]} />
        <meshBasicMaterial color="#DF350D" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ScanParticles({ count = 55 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 3.0;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 3.6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.05;
    ref.current.material.opacity = 0.28 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#DF350D" size={0.028} sizeAttenuation transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export default function HoloScanner({ subject = "UNREGISTERED", status = "AWAITING SIMULATION" }) {
  return (
    <div className="relative w-full" data-testid="holo-scanner">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden panel-clip-primary border border-bronze/60 panel-scanlines"
        style={{ background: "radial-gradient(120% 90% at 50% 45%, #0A0710 0%, #060409 70%, #030207 100%)" }}
      >
        <Canvas
          camera={{ position: [0, 0.25, 4.6], fov: 42 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ position: "absolute", inset: 0 }}
        >
          <ambientLight intensity={0.3} />
          <Suspense fallback={null}>
            <Humanoid />
            <ScanParticles count={55} />
          </Suspense>
        </Canvas>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-red/10" />
          <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-red/10" />

          <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" width="320" height="320" viewBox="0 0 320 320">
            <circle cx="160" cy="160" r="140" fill="none" stroke="#DF350D" strokeWidth="1" strokeDasharray="3 14" opacity="0.35" />
          </svg>

          <div
            className="absolute left-0 top-0 h-full w-24"
            style={{ background: "linear-gradient(90deg,transparent,rgba(223,53,13,0.12),transparent)", animation: "scan-x 3.6s cubic-bezier(0.4,0,0.2,1) infinite" }}
          />

          <div className="absolute left-3 top-3 tech-label text-red">ASCENDANCY SCAN</div>
          <div className="absolute right-3 top-3 tech-label text-sage">SYS::ONLINE</div>
          <div className="absolute bottom-3 left-3 font-mono text-[10px] text-cream/70">MESH · HUMANOID.V1</div>
          <div className="absolute bottom-3 right-3 flex items-center gap-2 tech-label text-red">
            <span className="h-1.5 w-1.5 animate-pulse-ring bg-red" /> ACTIVE
          </div>

          <span className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 border-l-2 border-t-2 border-red/70" />
          <span className="absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 border-b-2 border-r-2 border-red/70" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-px border border-bronze/40 bg-bronze/40 sm:grid-cols-4">
        {[
          ["SUBJECT", subject, "text-cream"],
          ["STATUS", status, "text-red"],
          ["SYSTEM", "ONLINE", "text-sage"],
          ["SECURITY", "ACTIVE", "text-gold-bright"],
        ].map(([k, v, c]) => (
          <div key={k} className="bg-navy-dark px-3 py-2">
            <div className="tech-label text-highlight">{k}</div>
            <div className={`mt-1 font-mono text-[11px] ${c}`}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
