"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { distance, area, polygon } from "@turf/turf";
import { SquareDashed, Trash2, CheckCircle2 } from "lucide-react";

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

const SOURCE_ID = "saras-search-area-source";
const LAYER_FILL_ID = "saras-search-area-fill";
const LAYER_STROKE_ID = "saras-search-area-stroke";

function buildRectanglePolygon(
  p1: { lng: number; lat: number },
  p2: { lng: number; lat: number }
) {
  const south = Math.min(p1.lat, p2.lat);
  const north = Math.max(p1.lat, p2.lat);
  const west = Math.min(p1.lng, p2.lng);
  const east = Math.max(p1.lng, p2.lng);

  return {
    south,
    north,
    west,
    east,
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ] as [number, number][],
    ],
  };
}

export default function SarasMap({
  latitude,
  longitude,
  onSearchAreaSelect,
}: SarasMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedArea, setSelectedArea] = useState<SearchAreaInfo | null>(null);

  const isSelectingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartLngLatRef = useRef<maplibregl.LngLat | null>(null);
  const dragStartPointRef = useRef<maplibregl.Point | null>(null);
  const lastMoveLngLatRef = useRef<maplibregl.LngLat | null>(null);
  const lastMovePointRef = useRef<maplibregl.Point | null>(null);
  const selectedAreaRef = useRef<SearchAreaInfo | null>(null);
  const onSearchAreaSelectRef = useRef(onSearchAreaSelect);

  useEffect(() => {
    isSelectingRef.current = isSelecting;
  }, [isSelecting]);

  useEffect(() => {
    selectedAreaRef.current = selectedArea;
  }, [selectedArea]);

  useEffect(() => {
    onSearchAreaSelectRef.current = onSearchAreaSelect;
  }, [onSearchAreaSelect]);

  // Manage cursor and drag panning mode when selection mode toggles
  useEffect(() => {
    if (!map.current) return;

    if (isSelecting) {
      map.current.dragPan.disable();
      map.current.boxZoom.disable();
      map.current.getCanvas().style.cursor = "crosshair";
    } else {
      map.current.dragPan.enable();
      map.current.boxZoom.enable();
      map.current.getCanvas().style.cursor = "";
    }
  }, [isSelecting]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const hasInitialCoords =
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

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

    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");

    mapInstance.on("load", () => {
      console.log("SARAS MAP LOADED");

      if (!mapContainer.current || !map.current) return;

      // Rover position marker - only create when valid GPS coordinates exist
      if (hasInitialCoords) {
        marker.current = new maplibregl.Marker({
          color: "#22c55e",
        })
          .setLngLat([initialLongitude, initialLatitude])
          .addTo(map.current);
      }

      // Search area GeoJSON source
      if (!mapInstance.getSource(SOURCE_ID)) {
        mapInstance.addSource(SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        // Semi-transparent tactical cyan fill
        mapInstance.addLayer({
          id: LAYER_FILL_ID,
          type: "fill",
          source: SOURCE_ID,
          paint: {
            "fill-color": "#06b6d4",
            "fill-opacity": 0.22,
          },
        });

        // Bright tactical cyan dashed boundary
        mapInstance.addLayer({
          id: LAYER_STROKE_ID,
          type: "line",
          source: SOURCE_ID,
          paint: {
            "line-color": "#22d3ee",
            "line-width": 2,
            "line-dasharray": [2, 1],
          },
        });
      }
    });

    const onMouseDown = (
      e: maplibregl.MapMouseEvent & { originalEvent: MouseEvent }
    ) => {
      if (!isSelectingRef.current) return;
      if (e.originalEvent.button !== 0) return;

      // Robustness: Ignore clicks targeting controls or UI buttons
      const target = e.originalEvent.target as HTMLElement | null;
      if (target && target.closest(".maplibregl-ctrl, button, .saras-map-ui")) {
        return;
      }

      dragStartLngLatRef.current = e.lngLat;
      dragStartPointRef.current = e.point;
      lastMoveLngLatRef.current = e.lngLat;
      lastMovePointRef.current = e.point;
      isDraggingRef.current = true;
      e.originalEvent.preventDefault();
    };

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (
        !isSelectingRef.current ||
        !isDraggingRef.current ||
        !dragStartLngLatRef.current
      ) {
        return;
      }

      lastMoveLngLatRef.current = e.lngLat;
      lastMovePointRef.current = e.point;

      const rect = buildRectanglePolygon(dragStartLngLatRef.current, e.lngLat);
      const source = map.current?.getSource(
        SOURCE_ID
      ) as maplibregl.GeoJSONSource | undefined;

      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: rect.coordinates,
              },
            },
          ],
        });
      }
    };

    const finalizeSelection = (
      endLngLat: maplibregl.LngLat,
      endPoint: maplibregl.Point
    ) => {
      if (
        !isDraggingRef.current ||
        !dragStartLngLatRef.current ||
        !dragStartPointRef.current
      ) {
        return;
      }

      const dx = endPoint.x - dragStartPointRef.current.x;
      const dy = endPoint.y - dragStartPointRef.current.y;
      const pixelDist = Math.hypot(dx, dy);

      isDraggingRef.current = false;

      // Guard against accidental micro-clicks (< 8px)
      if (pixelDist < 8) {
        const source = map.current?.getSource(
          SOURCE_ID
        ) as maplibregl.GeoJSONSource | undefined;
        if (source) {
          if (selectedAreaRef.current) {
            const existingPoly = polygon([
              [
                [selectedAreaRef.current.west, selectedAreaRef.current.south],
                [selectedAreaRef.current.east, selectedAreaRef.current.south],
                [selectedAreaRef.current.east, selectedAreaRef.current.north],
                [selectedAreaRef.current.west, selectedAreaRef.current.north],
                [selectedAreaRef.current.west, selectedAreaRef.current.south],
              ],
            ]);
            source.setData({
              type: "FeatureCollection",
              features: [existingPoly],
            });
          } else {
            source.setData({
              type: "FeatureCollection",
              features: [],
            });
          }
        }
        return;
      }

      const rect = buildRectanglePolygon(dragStartLngLatRef.current, endLngLat);

      // Structure: [south-west, south-east, north-east, north-west]
      const boundary: [
        SearchAreaBoundaryPoint,
        SearchAreaBoundaryPoint,
        SearchAreaBoundaryPoint,
        SearchAreaBoundaryPoint
      ] = [
        { latitude: rect.south, longitude: rect.west },
        { latitude: rect.south, longitude: rect.east },
        { latitude: rect.north, longitude: rect.east },
        { latitude: rect.north, longitude: rect.west },
      ];

      // Use @turf/turf for accurate geodesic geographic measurements
      const polyFeature = polygon(rect.coordinates);
      const widthM = distance(
        [rect.west, rect.south],
        [rect.east, rect.south],
        { units: "meters" }
      );
      const heightM = distance(
        [rect.west, rect.south],
        [rect.west, rect.north],
        { units: "meters" }
      );
      const areaM2 = area(polyFeature);

      const areaInfo: SearchAreaInfo = {
        boundary,
        north: rect.north,
        south: rect.south,
        east: rect.east,
        west: rect.west,
        widthMeters: Math.round(widthM * 100) / 100,
        heightMeters: Math.round(heightM * 100) / 100,
        areaSquareMeters: Math.round(areaM2 * 100) / 100,
      };

      // Retain finalized rectangle on the map
      const source = map.current?.getSource(
        SOURCE_ID
      ) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: rect.coordinates,
              },
            },
          ],
        });
      }

      selectedAreaRef.current = areaInfo;
      setSelectedArea(areaInfo);
      setIsSelecting(false);
      dragStartLngLatRef.current = null;
      dragStartPointRef.current = null;

      onSearchAreaSelectRef.current?.(areaInfo);
    };

    const onMouseUp = (e: maplibregl.MapMouseEvent) => {
      finalizeSelection(e.lngLat, e.point);
    };

    const onWindowMouseUp = () => {
      if (
        isDraggingRef.current &&
        lastMoveLngLatRef.current &&
        lastMovePointRef.current
      ) {
        finalizeSelection(
          lastMoveLngLatRef.current,
          lastMovePointRef.current
        );
      }
    };

    mapInstance.on("mousedown", onMouseDown);
    mapInstance.on("mousemove", onMouseMove);
    mapInstance.on("mouseup", onMouseUp);
    window.addEventListener("mouseup", onWindowMouseUp);

    return () => {
      window.removeEventListener("mouseup", onWindowMouseUp);

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

    map.current.flyTo({
      center: newPosition,
      duration: 800,
    });
  }, [latitude, longitude]);

  const handleStartSelection = () => {
    setIsSelecting(true);
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    isDraggingRef.current = false;
    dragStartLngLatRef.current = null;
    dragStartPointRef.current = null;

    const source = map.current?.getSource(
      SOURCE_ID
    ) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      if (selectedAreaRef.current) {
        const poly = polygon([
          [
            [selectedAreaRef.current.west, selectedAreaRef.current.south],
            [selectedAreaRef.current.east, selectedAreaRef.current.south],
            [selectedAreaRef.current.east, selectedAreaRef.current.north],
            [selectedAreaRef.current.west, selectedAreaRef.current.north],
            [selectedAreaRef.current.west, selectedAreaRef.current.south],
          ],
        ]);
        source.setData({
          type: "FeatureCollection",
          features: [poly],
        });
      } else {
        source.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }
  };

  const handleClearArea = () => {
    const source = map.current?.getSource(
      SOURCE_ID
    ) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }

    selectedAreaRef.current = null;
    setSelectedArea(null);
    setIsSelecting(false);
    isDraggingRef.current = false;
    dragStartLngLatRef.current = null;
    dragStartPointRef.current = null;

    if (map.current) {
      map.current.dragPan.enable();
      map.current.boxZoom.enable();
      map.current.getCanvas().style.cursor = "";
    }

    onSearchAreaSelectRef.current?.(null);
  };

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
              <span>Click &amp; drag on map</span>
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