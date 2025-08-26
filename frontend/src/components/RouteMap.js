import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths in bundlers like CRA/Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

// RouteMap expects coordinates as array of [lat, lng]
export default function RouteMap({ coordinates = [], names = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRefs = useRef({ markers: [], polyline: null });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Initialize map on first render
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const center = coordinates[0] || [8.9806, 38.7578];
    const map = L.map(mapRef.current, { center, zoom: 13, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // Update markers and polyline when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous layers
    const { markers, polyline } = layerRefs.current;
    markers.forEach(m => map.removeLayer(m));
    layerRefs.current.markers = [];
    if (polyline) {
      map.removeLayer(polyline);
      layerRefs.current.polyline = null;
    }

    if (!coordinates || coordinates.length === 0) return;

    // Marker styles
    const redOpts = { radius: 7, color: '#b91c1c', fillColor: '#dc2626', fillOpacity: 0.95, weight: 2 };
    const blueOpts = { radius: 6, color: '#1e3a8a', fillColor: '#2563eb', fillOpacity: 0.95, weight: 2 };

    // Add start marker (red)
    const startMarker = L.circleMarker(coordinates[0], redOpts).addTo(map);
    startMarker.bindPopup(`Start${names[0] ? `: ${names[0]}` : ''}`);
    layerRefs.current.markers.push(startMarker);

    // Add intermediate stops (blue)
    if (coordinates.length > 2) {
      for (let i = 1; i < coordinates.length - 1; i++) {
        const stop = L.circleMarker(coordinates[i], blueOpts).addTo(map);
        const label = names[i] ? `Stop: ${names[i]}` : 'Stop';
        stop.bindPopup(label);
        layerRefs.current.markers.push(stop);
      }
    }

    // Add end marker (red)
    if (coordinates.length > 1) {
      const endMarker = L.circleMarker(coordinates[coordinates.length - 1], redOpts).addTo(map);
      endMarker.bindPopup(`End${names[names.length - 1] ? `: ${names[names.length - 1]}` : ''}`);
      layerRefs.current.markers.push(endMarker);
    }

    // Build a street-following route using OSRM for each leg
    const controller = new AbortController();
    setLoadingRoute(true);
    setRouteError('');

    async function fetchLeg(a, b) {
      const [alat, alng] = a; const [blat, blng] = b;
      const url = `https://router.project-osrm.org/route/v1/driving/${alng},${alat};${blng},${blat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const data = await res.json();
      const coords = data?.routes?.[0]?.geometry?.coordinates;
      if (!coords || !coords.length) throw new Error('No geometry');
      // Convert [lng,lat] -> [lat,lng]
      return coords.map(([lng, lat]) => [lat, lng]);
    }

    (async () => {
      try {
        let aggregated = [];
        for (let i = 0; i < coordinates.length - 1; i++) {
          const leg = await fetchLeg(coordinates[i], coordinates[i + 1]);
          if (aggregated.length) {
            // avoid duplicating joint point
            aggregated = aggregated.concat(leg.slice(1));
          } else {
            aggregated = leg;
          }
        }
        const line = L.polyline(aggregated, { color: '#2563eb', weight: 5, opacity: 0.9 }).addTo(map);
        layerRefs.current.polyline = line;
        try { map.fitBounds(line.getBounds(), { padding: [24, 24] }); } catch {}
      } catch (e) {
        // Fallback: draw straight-line poly if OSRM failed or aborted
        if (controller.signal.aborted) return;
        setRouteError('Could not fetch street route, showing straight lines.');
        const line = L.polyline(coordinates, { color: '#2563eb', weight: 5, opacity: 0.85, dashArray: '6 6' }).addTo(map);
        layerRefs.current.polyline = line;
        try { map.fitBounds(line.getBounds(), { padding: [24, 24] }); } catch {}
      } finally {
        setLoadingRoute(false);
      }
    })();

    return () => controller.abort();
  }, [coordinates, names]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const map = mapInstanceRef.current;
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-700">
      {loadingRoute && (
        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">Loading turn-by-turn route…</div>
      )}
      {routeError && (
        <div className="px-3 py-2 text-sm text-amber-600 dark:text-amber-400">{routeError}</div>
      )}
      <div ref={mapRef} style={{ height: 360, width: '100%' }} />
    </div>
  );
}
