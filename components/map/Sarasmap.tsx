"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { distance, area } from "@turf/turf";
import { SquareDashed, Trash2, CheckCircle2 } from "lucide-react";
import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { TerraDrawRectangleMode, TerraDrawSelectMode } from "terra-draw";
import type { Feature, Polygon } from "geojson";

export interface SearchAreaBoundaryPoint {
  latitude: number;
  longitude: number;
}

export interface SearchAreaInfo {
  boundary: [
    SearchAreaBoundaryPoint, // south-west
    SearchAreaBoundaryPoint, // south-east
    SearchAreaBoundaryPoint, // north-east
    SearchAreaBoundaryPoint  // north-west
  ];
  north: number;
  south: number;
  east: number;
  west: number;
  widthMeters: number;
  heightMeters: number;
  areaSquareMeters: number;
}

export interface SarasMapProps {
  latitude?: number | null;
  longitude?: number | null;
  onSearchAreaSelect?: (area: SearchAreaInfo | null) => void;
}

function parseSearchAreaFromFeature(feature: Feature): SearchAreaInfo | null {
  if (!feature || feature.geometry.type !== "Polygon") return null;
  const poly = feature.geometry as Polygon;
  const ring = poly.coordinates[0];
  if (!ring || ring.length < 4) return null;

  const lats = ring.map((p) => p[1]);
  const lngs = ring.map((p) => p[0]);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);

  // Structure: [south-west, south-east, north-east, north-west]
  const boundary: [
    SearchAreaBoundaryPoint,
    SearchAreaBoundaryPoint,
    SearchAreaBoundaryPoint,
    SearchAreaBoundaryPoint
  ] = [
    { latitude: south, longitude: west },
    { latitude: south, longitude: east },
    { latitude: north, longitude: east },
    { latitude: north, longitude: west },
  ];

  const widthM = distance([west, south], [east, south], { units: "meters" });
  const heightM = distance([west, south], [west, north], { units: "meters" });
  const areaM2 = area(feature);

  if (widthM < 0.5 || heightM < 0.5) return null;

  return {
    boundary,
    north,
    south,
    east,
    west,
    widthMeters: Math.round(widthM * 100) / 100,
    heightMeters: Math.round(heightM * 100) / 100,
    areaSquareMeters: Math.round(areaM2 * 100) / 100,
  };
}

function applyTerraDrawLayerStyles(m: maplibregl.Map | null) {
  if (!m) return;
  try {
    if (m.getLayer("td-polygon")) {
      m.setPaintProperty("td-polygon", "fill-color", "#ef4444");
      m.setPaintProperty("td-polygon", "fill-opacity", 0.22);
    }
    if (m.getLayer("td-polygon-outline")) {
      m.setPaintProperty("td-polygon-outline", "line-color", "#dc2626");
      m.setPaintProperty("td-polygon-outline", "line-width", 3);
      m.setPaintProperty("td-polygon-outline", "line-opacity", 1);
    }
  } catch {
    // Ignore if style is reloading
  }
}

export default function SarasMap({
  latitude,
  longitude,
  onSearchAreaSelect,
}: SarasMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const drawControlRef = useRef<MaplibreTerradrawControl | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedArea, setSelectedArea] = useState<SearchAreaInfo | null>(null);

  const isSelectingRef = useRef(false);
  const onSearchAreaSelectRef = useRef(onSearchAreaSelect);
  const hasCenteredOnGpsRef = useRef(false);

  useEffect(() => {
    isSelectingRef.current = isSelecting;
  }, [isSelecting]);

  useEffect(() => {
    onSearchAreaSelectRef.current = onSearchAreaSelect;
  }, [onSearchAreaSelect]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const hasInitialCoords =
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

    if (hasInitialCoords) {
      hasCenteredOnGpsRef.current = true;
    }

    const initialLatitude = hasInitialCoords ? latitude : 22.5726;
    const initialLongitude = hasInitialCoords ? longitude : 88.3639;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [initialLongitude, initialLatitude],
      zoom: 15,
    });

    map.current = mapInstance;
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._map = mapInstance;
    }
    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");

    mapInstance.on("load", () => {
      console.log("SARAS MAP LOADED");
      applyTerraDrawLayerStyles(mapInstance);

      if (!mapContainer.current || !map.current) return;

      // Rover position marker - only create when valid GPS coordinates exist
      if (hasInitialCoords) {
        marker.current = new maplibregl.Marker({
          color: "#22c55e",
        })
          .setLngLat([initialLongitude, initialLatitude])
          .addTo(map.current);
      }
    });

    // Configure Terra Draw with preferred SARAS styling:
    // fill #ef4444 (opacity 0.22), boundary #dc2626 (width 3)
    const drawControl = new MaplibreTerradrawControl({
      modes: ["rectangle", "select", "delete-selection", "delete"],
      open: false,
      modeOptions: {
        rectangle: new TerraDrawRectangleMode({
          drawInteraction: "click-drag",
          styles: {
            fillColor: "#ef4444",
            fillOpacity: 0.22,
            outlineColor: "#dc2626",
            outlineWidth: 3,
            outlineOpacity: 1,
          },
        }),
        select: new TerraDrawSelectMode({
          flags: {
            rectangle: {
              feature: {
                draggable: true,
                rotateable: false,
                scaleable: true,
                coordinates: {
                  midpoints: false,
                  draggable: true,
                  deletable: false,
                },
              },
            },
          },
          styles: {
            selectedPolygonColor: "#ef4444",
            selectedPolygonFillOpacity: 0.22,
            selectedPolygonOutlineColor: "#dc2626",
            selectedPolygonOutlineWidth: 3,
            selectedPolygonOutlineOpacity: 1,
          },
        }),
      },
    });

    mapInstance.addControl(drawControl, "top-left");
    drawControlRef.current = drawControl;

    // Hide default Terra Draw toolbar buttons so only SARAS UI buttons control drawing
    const ctrlEl = (drawControl as unknown as { controlContainer?: HTMLElement }).controlContainer;
    if (ctrlEl) {
      ctrlEl.style.display = "none";
    }

    const td = drawControl.getTerraDrawInstance();
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._td = td;
    }
    if (td) {
      td.on("finish", (id) => {
        map.current?.dragPan.enable();
        map.current?.boxZoom.enable();

        const snapshot = td.getSnapshot() as Feature[];
        const currentFeature =
          snapshot.find((f) => f.id === id) || snapshot[snapshot.length - 1];
        if (!currentFeature) return;

        // Single search area rule: replace any older rectangles
        const olderIds = snapshot
          .filter((f) => f.id !== currentFeature.id && f.id !== undefined)
          .map((f) => f.id as string | number);
        if (olderIds.length > 0) {
          td.removeFeatures(olderIds);
        }

        const areaInfo = parseSearchAreaFromFeature(currentFeature);
        if (areaInfo) {
          setSelectedArea(areaInfo);
          setIsSelecting(false);
          onSearchAreaSelectRef.current?.(areaInfo);
          // Switch to select mode to keep rectangle visible and editable
          td.setMode("select");
          applyTerraDrawLayerStyles(map.current);
          map.current?.triggerRepaint();
        } else {
          td.removeFeatures([currentFeature.id as string | number]);
        }


        // ==========================================
        // TEMPORARY RUNTIME DIAGNOSTIC INSPECTION
        // ==========================================
        try {
          const m = map.current;
          if (m) {
            const src = m.getSource("td-polygon");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const srcData = src ? (src as any)._data : undefined;
            const polyLayer = m.getLayer("td-polygon");
            const outlineLayer = m.getLayer("td-polygon-outline");
            const fillColor = m.getPaintProperty("td-polygon", "fill-color");
            const fillOpacity = m.getPaintProperty("td-polygon", "fill-opacity");
            const outlineColor = m.getPaintProperty("td-polygon-outline", "line-color");
            const outlineWidth = m.getPaintProperty("td-polygon-outline", "line-width");
            const outlineOpacity = m.getPaintProperty("td-polygon-outline", "line-opacity");
            const snap = td.getSnapshot();
            const mode = td.getMode();
            const layers = m.getStyle().layers;
            const layerIds = layers.map((l) => l.id);
            const osmIndex = layerIds.indexOf("osm");
            const tdPolyIndex = layerIds.indexOf("td-polygon");
            const tdOutlineIndex = layerIds.indexOf("td-polygon-outline");

            const diagResult = {
              1: { sourceExists: !!src },
              2: { sourceData: srcData },
              3: { polyLayer: !!polyLayer, outlineLayer: !!outlineLayer },
              4: { fillColor, fillOpacity, outlineColor, outlineWidth, outlineOpacity },
              5: { snapshotLength: snap.length, snapshot: snap },
              6: { mode },
              7: { currentFeature },
              8: { layerIds },
              9: { osmIndex, tdPolyIndex, tdOutlineIndex },
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).__SARAS_DIAGNOSTICS__ = diagResult;
            console.log("=== SARAS RUNTIME DIAGNOSTICS ===", JSON.stringify(diagResult, null, 2));
          }
        } catch (diagErr) {
          console.error("Diagnostic error:", diagErr);
        }
      });



      td.on("change", (ids, type) => {
        if (type === "update") {
          applyTerraDrawLayerStyles(map.current);
          map.current?.triggerRepaint();
          const snapshot = td.getSnapshot() as Feature[];
          const updated = snapshot.find((f) => f.id !== undefined && ids.includes(f.id as string | number));
          if (updated) {
            const areaInfo = parseSearchAreaFromFeature(updated);
            if (areaInfo) {
              setSelectedArea(areaInfo);
              onSearchAreaSelectRef.current?.(areaInfo);
            }
          }
        } else if (type === "delete") {
          const snapshot = td.getSnapshot();
          if (snapshot.length === 0) {
            setSelectedArea(null);
            setIsSelecting(false);
            onSearchAreaSelectRef.current?.(null);
          }
        }
      });
    }

    return () => {
      map.current?.dragPan.enable();
      map.current?.boxZoom.enable();

      if (drawControlRef.current && map.current) {
        try {
          map.current.removeControl(drawControlRef.current);
        } catch {
          // Ignore control removal error during unmount
        }
        drawControlRef.current = null;
      }

      marker.current?.remove();
      marker.current = null;

      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update rover marker position when live coordinates update
  useEffect(() => {
    if (!map.current) return;

    const hasValidCoords =
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

    if (!hasValidCoords) {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      return;
    }

    const newPosition: [number, number] = [longitude, latitude];

    if (!marker.current) {
      marker.current = new maplibregl.Marker({
        color: "#22c55e",
      })
        .setLngLat(newPosition)
        .addTo(map.current);
    } else {
      marker.current.setLngLat(newPosition);
    }

    // Center map only once on the first valid GPS fix without interrupting manual pan/zoom
    if (!hasCenteredOnGpsRef.current) {
      hasCenteredOnGpsRef.current = true;
      if (!isSelectingRef.current) {
        map.current.easeTo({
          center: newPosition,
          duration: 600,
        });
      }
    }
  }, [latitude, longitude]);

  const handleStartSelection = () => {
    map.current?.dragPan.disable();
    map.current?.boxZoom.disable();
    const td = drawControlRef.current?.getTerraDrawInstance();
    if (td) {
      if (!td.enabled) {
        td.start();
      }
      td.clear();
      td.setMode("rectangle");
      applyTerraDrawLayerStyles(map.current);
    }
    setSelectedArea(null);
    setIsSelecting(true);
    onSearchAreaSelectRef.current?.(null);
  };


  const handleCancelSelection = () => {
    map.current?.dragPan.enable();
    map.current?.boxZoom.enable();
    const td = drawControlRef.current?.getTerraDrawInstance();
    if (td) {
      td.clear();
      td.setMode("select");
    }
    setSelectedArea(null);
    setIsSelecting(false);
    onSearchAreaSelectRef.current?.(null);
  };

  const handleClearArea = () => {
    map.current?.dragPan.enable();
    map.current?.boxZoom.enable();
    const td = drawControlRef.current?.getTerraDrawInstance();
    if (td) {
      td.clear();
      td.setMode("select");
    }
    setSelectedArea(null);
    setIsSelecting(false);
    onSearchAreaSelectRef.current?.(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelecting) {
        handleCancelSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelecting]);

  return (
    <div className="relative h-full w-full min-h-[480px]">
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "480px",
        }}
      />

      {/* Map Interactive Control Overlay */}
      <div className="saras-map-ui absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        {!isSelecting && !selectedArea && (
          <button
            type="button"
            onClick={handleStartSelection}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-[#080D18]/90 px-3 py-2 text-xs font-semibold text-cyan-400 shadow-xl backdrop-blur-md transition hover:border-cyan-400 hover:bg-cyan-500/10 active:scale-95"
            title="Click and drag on the map to define an axis-aligned search rectangle"
          >
            <SquareDashed size={14} className="text-cyan-400" />
            Select Area
          </button>
        )}

        {isSelecting && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/70 bg-cyan-950/80 px-3 py-2 text-xs font-semibold text-cyan-300 shadow-xl backdrop-blur-md">
              <SquareDashed size={14} className="animate-pulse text-cyan-400" />
              <span>Drawing... (drag on map)</span>
            </div>

            <button
              type="button"
              onClick={handleCancelSelection}
              className="rounded-lg border border-slate-700 bg-[#080D18]/90 px-2.5 py-2 text-xs font-medium text-slate-300 shadow-xl backdrop-blur-md transition hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        )}

        {selectedArea && !isSelecting && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClearArea}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-[#080D18]/90 px-3 py-2 text-xs font-semibold text-red-400 shadow-xl backdrop-blur-md transition hover:border-red-400 hover:bg-red-500/10 active:scale-95"
            >
              <Trash2 size={13} />
              Clear Area
            </button>

            <button
              type="button"
              onClick={handleStartSelection}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#080D18]/90 px-2.5 py-2 text-xs font-medium text-slate-300 shadow-xl backdrop-blur-md transition hover:border-cyan-500/40 hover:text-cyan-400"
              title="Replace current selection with a new search area"
            >
              <SquareDashed size={13} />
              Redraw
            </button>

            {/* Quick Metrics Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800/90 bg-[#080D18]/90 px-3 py-2 text-[11px] text-slate-400 shadow-xl backdrop-blur-md">
              <CheckCircle2 size={12} className="text-green-400" />
              <span className="font-mono font-medium text-cyan-400">
                {Math.round(selectedArea.widthMeters)}m ×{" "}
                {Math.round(selectedArea.heightMeters)}m
              </span>
              <span className="text-slate-600">•</span>
              <span>
                {selectedArea.areaSquareMeters >= 10000
                  ? `${(selectedArea.areaSquareMeters / 10000).toFixed(2)} ha`
                  : `${Math.round(selectedArea.areaSquareMeters)} m²`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}