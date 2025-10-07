import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Small, focused Leaflet map that lets users pick a single point.
// Props:
// - value: { lat: number, lng: number } | [number, number]
// - onChange: (coords: { lat: number, lng: number }) => void
// - height?: number (px)
// - disabled?: boolean
export default function LocationPicker({ value, onChange, height = 300, disabled = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const current = useMemo(() => {
    if (Array.isArray(value) && value.length === 2) return { lat: Number(value[0]), lng: Number(value[1]) };
    if (value && typeof value === 'object' && 'lat' in value && 'lng' in value) return { lat: Number(value.lat), lng: Number(value.lng) };
    return null;
  }, [value]);

  // init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const defaultCenter = current ? [current.lat, current.lng] : [8.9806, 38.7578]; // Addis Ababa fallback
    const map = L.map(mapRef.current, { center: defaultCenter, zoom: current ? 15 : 13, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      maxZoom: 19,
    }).addTo(map);
    map.on('click', (e) => {
      if (disabled) return;
      const { lat, lng } = e.latlng;
      setMarker(map, lat, lng);
      onChange && onChange({ lat: round(lat), lng: round(lng) });
    });
    mapInstanceRef.current = map;

    // If initial value exists, place marker
    if (current) {
      setMarker(map, current.lat, current.lng);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // update view/marker when value changes externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (current && !Number.isNaN(current.lat) && !Number.isNaN(current.lng)) {
      setMarker(map, current.lat, current.lng);
      try { map.setView([current.lat, current.lng], Math.max(map.getZoom(), 15)); } catch {}
    }
  }, [current]);

  const setMarker = (map, lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      // Use circle marker to avoid asset path issues
      markerRef.current = L.circleMarker([lat, lng], { radius: 7, color: '#047857', fillColor: '#10b981', fillOpacity: 0.95, weight: 2 }).addTo(map);
    }
  };

  const round = (n) => Math.round(Number(n) * 1e6) / 1e6; // 6dp

  const useMyLocation = () => {
    const map = mapInstanceRef.current;
    if (!map || disabled) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarker(map, lat, lng);
        onChange && onChange({ lat: round(lat), lng: round(lng) });
        try { map.setView([lat, lng], 16); } catch {}
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {current ? (
            <span>Selected: lat {current.lat}, lng {current.lng}</span>
          ) : (
            <span>Click on the map to choose a location</span>
          )}
        </div>
        <button type="button" onClick={useMyLocation} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white disabled:opacity-50" disabled={disabled}>
          Use my location
        </button>
      </div>
      <div ref={mapRef} style={{ height, width: '100%' }} className="overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700" />
    </div>
  );
}
