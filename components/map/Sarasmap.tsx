"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

interface SarasMapProps {
  latitude: number;
  longitude: number;
}

export default function SarasMap({
  latitude,
  longitude,
}: SarasMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialLatitude = Number.isFinite(latitude)
      ? latitude
      : 22.5726;

    const initialLongitude = Number.isFinite(longitude)
      ? longitude
      : 88.3639;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              "© OpenStreetMap contributors",
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

    map.current.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    map.current.on("load", () => {
      console.log("SARAS MAP LOADED");

      if (!mapContainer.current || !map.current) return;

      marker.current = new maplibregl.Marker({
        color: "#22c55e",
      })
        .setLngLat([initialLongitude, initialLatitude])
        .addTo(map.current);
    });

    return () => {
      marker.current?.remove();
      marker.current = null;

      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !marker.current) return;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const newPosition: [number, number] = [
      longitude,
      latitude,
    ];

    marker.current.setLngLat(newPosition);

    map.current.flyTo({
      center: newPosition,
      duration: 800,
    });
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "480px",
      }}
    />
  );
}