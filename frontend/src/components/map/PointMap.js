import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Displays a single point on a Leaflet map. Read-only.
// Props:
// - coords: { lat: number, lng: number } | [number, number]
// - height?: number
export default function PointMap({ coords, height = 220 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const current = useMemo(() => {
    if (Array.isArray(coords) && coords.length === 2) return { lat: Number(coords[0]), lng: Number(coords[1]) };
    if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) return { lat: Number(coords.lat), lng: Number(coords.lng) };
    return null;
  }, [coords]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const center = current ? [current.lat, current.lng] : [8.9806, 38.7578];
    const map = L.map(mapRef.current, { center, zoom: current ? 15 : 13, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    if (current) {
      setMarker(map, current.lat, current.lng);
    }
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!current) return;
    setMarker(map, current.lat, current.lng);
    try { map.setView([current.lat, current.lng], Math.max(map.getZoom(), 15)); } catch {}
  }, [current]);

  const setMarker = (map, lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.circleMarker([lat, lng], { radius: 7, color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.95, weight: 2 }).addTo(map);
    }
  };

  return <div ref={mapRef} style={{ height, width: '100%' }} className="overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700" />;
}
