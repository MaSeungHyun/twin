import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Object3D,
} from "three";

import type { CctvAlarmSeverity } from "@/lib/cctvAlarm";
import { isCctvAlarmSeverity } from "@/lib/cctvAlarm";
import { useOfficeStore } from "@/stores/officeStore";
import { getCctvCameraStatus } from "@/stores/cctvCameraStatusStore";
import type { CctvMarkerSource } from "@/three/cctvMarkers";
import {
  HEATMAP_EMISSIVE_HEX,
  HEATMAP_Y_EPS,
  collectHeatmapStampsForFloor,
  resolveFloorHeatmapBounds,
  type HeatmapStamp,
} from "@/three/cctvFloorHeatmap";
import { getOfficeFloorInstanceRegistry } from "@/three/officeFloorInstancing";
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

const FLOOR_KEYS: OfficeFloorObjectKey[] = ["1F", "2F", "3F", "4F"];

/** Bloom threshold(1)을 넘기도록 피크 emissiveIntensity */
const EMISSIVE_PEAK: Record<CctvAlarmSeverity, number> = {
  warning: 1,
  critical: 2,
};
const EMISSIVE_BASE = 0.1;
const PULSE_SPEED: Record<CctvAlarmSeverity, number> = {
  warning: 2.4,
  critical: 3.6,
};

type CctvFloorHeatmapProps = {
  sceneRoot: Object3D;
  markers: readonly CctvMarkerSource[];
  floorObjects: ReadonlyMap<OfficeFloorObjectKey, Object3D>;
};

type DiscEntry = {
  stamp: HeatmapStamp;
  mesh: Mesh;
  material: MeshStandardMaterial;
};

type FloorEntry = {
  key: OfficeFloorObjectKey;
  holder: Group;
  discs: DiscEntry[];
};

function createDisc(stamp: HeatmapStamp, y: number, geometry: PlaneGeometry) {
  const material = new MeshStandardMaterial({
    color: 0x000000,
    emissive: new Color(HEATMAP_EMISSIVE_HEX.warning),
    emissiveIntensity: EMISSIVE_PEAK.warning,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    toneMapped: false,
    roughness: 1,
    metalness: 0,
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "CctvHeatmapPlane";
  mesh.position.set(stamp.x, y, stamp.z);
  mesh.scale.set(stamp.sizeX, 1, stamp.sizeZ);
  mesh.renderOrder = 50;
  mesh.frustumCulled = false;
  mesh.visible = false;

  return { mesh, material, stamp };
}

/**
 * 카메라 발밑 emissive Plane.
 * 카메라 상태가 warning/critical일 때만 표시·깜빡임.
 */
export default function CctvFloorHeatmap({
  sceneRoot,
  markers,
  floorObjects,
}: CctvFloorHeatmapProps) {
  const activeFloorAction = useOfficeStore((s) => s.activeFloorAction);
  const floorCommand = useOfficeStore((s) => s.floorCommand);
  const entriesRef = useRef<FloorEntry[]>([]);
  const sharedGeoRef = useRef<PlaneGeometry | null>(null);

  const referenceFloor = floorObjects.get("1F") ?? null;

  const floorTopY = useMemo(() => {
    if (!referenceFloor) return HEATMAP_Y_EPS;
    sceneRoot.updateMatrixWorld(true);
    const bounds = resolveFloorHeatmapBounds(sceneRoot, referenceFloor);
    return (bounds?.topY ?? 0) + HEATMAP_Y_EPS;
  }, [sceneRoot, referenceFloor]);

  const stampsByFloor = useMemo(() => {
    const map = new Map<OfficeFloorObjectKey, HeatmapStamp[]>();
    if (!referenceFloor || markers.length === 0) return map;

    sceneRoot.updateMatrixWorld(true);
    referenceFloor.updateMatrixWorld(true);

    for (const key of FLOOR_KEYS) {
      if (!floorObjects.has(key)) continue;
      const stamps = collectHeatmapStampsForFloor(
        markers,
        key,
        referenceFloor,
      );
      if (stamps.length > 0) map.set(key, stamps);
    }
    return map;
  }, [floorObjects, markers, referenceFloor, sceneRoot]);

  useEffect(() => {
    const entries = entriesRef.current;
    for (const { holder, discs } of entries) {
      holder.removeFromParent();
      for (const { material } of discs) material.dispose();
    }
    entries.length = 0;

    sharedGeoRef.current?.dispose();
    sharedGeoRef.current = null;

    if (stampsByFloor.size === 0 || !referenceFloor) return;

    const geometry = new PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    sharedGeoRef.current = geometry;

    const registry = getOfficeFloorInstanceRegistry(sceneRoot);
    const parent = registry?.instancesRoot ?? sceneRoot;

    for (const [key, stamps] of stampsByFloor) {
      if (!floorObjects.has(key)) continue;

      const holder = new Group();
      holder.name = `CctvHeatmapHolder_${key}`;
      const discs: DiscEntry[] = [];

      for (const stamp of stamps) {
        const { mesh, material } = createDisc(stamp, floorTopY, geometry);
        holder.add(mesh);
        discs.push({ stamp, mesh, material });
      }

      parent.add(holder);
      entries.push({ key, holder, discs });
    }

    return () => {
      for (const { holder, discs } of entries) {
        holder.removeFromParent();
        for (const { material } of discs) material.dispose();
      }
      entries.length = 0;
      sharedGeoRef.current?.dispose();
      sharedGeoRef.current = null;
    };
  }, [floorObjects, floorTopY, referenceFloor, sceneRoot, stampsByFloor]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const animating = floorCommand !== null;
    const showAll =
      activeFloorAction == null || activeFloorAction === "Default";

    for (const { key, holder, discs } of entriesRef.current) {
      const anchor = floorObjects.get(key);
      if (!anchor) {
        holder.visible = false;
        continue;
      }

      holder.position.copy(anchor.position);
      holder.quaternion.copy(anchor.quaternion);
      holder.scale.copy(anchor.scale);

      const floorShow = !animating && (showAll || activeFloorAction === key);
      holder.visible = floorShow;
      if (!floorShow) continue;

      for (const { stamp, mesh, material } of discs) {
        const status = getCctvCameraStatus(stamp.cameraName);
        if (!isCctvAlarmSeverity(status)) {
          mesh.visible = false;
          continue;
        }

        mesh.visible = true;
        material.emissive.setHex(HEATMAP_EMISSIVE_HEX[status]);
        const speed = PULSE_SPEED[status];
        const peak = EMISSIVE_PEAK[status];
        const wave = 0.5 + 0.5 * Math.sin(t * speed + stamp.phase);
        material.emissiveIntensity =
          EMISSIVE_BASE + (peak - EMISSIVE_BASE) * wave;
      }
    }
  });

  return null;
}
