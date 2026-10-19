"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SessionMapProps {
  venueLat: number;
  venueLng: number;
  venueName?: string | null;
  radiusM: number;
  checkinCoords?: Array<{ checked_in_member_id: string; latitude: number; longitude: number }>;
}

export function SessionMap({
  venueLat,
  venueLng,
  venueName,
  radiusM,
  checkinCoords = [],
}: SessionMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [venueLat, venueLng],
      zoom: 17,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Dark Tile Layer from CartoDB or OpenStreetMap
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Venue Radius Circle
    L.circle([venueLat, venueLng], {
      color: "#00E5FF",
      fillColor: "#00E5FF",
      fillOpacity: 0.15,
      radius: radiusM,
      weight: 2,
    }).addTo(map);

    // Venue Center Marker
    const venueIcon = L.divIcon({
      className: "custom-venue-icon",
      html: `<div style="background-color: #00E5FF; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #0C0E13; box-shadow: 0 0 10px #00E5FF;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker([venueLat, venueLng], { icon: venueIcon })
      .addTo(map)
      .bindPopup(`<b>Venue: ${venueName || "Event Location"}</b><br/>Allowed Radius: ${radiusM}m`);

    // Check-in Point Pins
    checkinCoords.forEach((coord, idx) => {
      const pinIcon = L.divIcon({
        className: "custom-checkin-pin",
        html: `<div style="background-color: #10B981; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #0C0E13;"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      L.marker([coord.latitude, coord.longitude], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`Check-in #${idx + 1}`);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [venueLat, venueLng, radiusM, checkinCoords, venueName]);

  return (
    <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden border border-zinc-800 shadow-xl relative">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#0C0E13]" />
    </div>
  );
}
