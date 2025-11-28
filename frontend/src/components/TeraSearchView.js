import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

const TeraSearchView = ({ teraData }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map on first render
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const center = teraData?.tera?.coordinates || [8.9806, 38.7578];
    const map = L.map(mapRef.current, { center, zoom: 13, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // Update markers when teraData changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !teraData) return;

    // Clear previous markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const { tera, directDestinations } = teraData;

    if (!tera?.coordinates) return;

    // Add main tera marker (large red)
    const mainIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const mainMarker = L.marker(tera.coordinates, { icon: mainIcon }).addTo(map);
    mainMarker.bindPopup(`
      <div style="font-family: sans-serif;">
        <strong style="font-size: 16px;">${tera.name}</strong><br/>
        ${tera.address ? `<span style="color: #666;">${tera.address}</span><br/>` : ''}
        ${tera.condition ? `<span style="color: #666;">Condition: ${tera.condition}</span><br/>` : ''}
        <strong style="color: #2563eb;">Direct destinations: ${directDestinations.length}</strong>
      </div>
    `);
    markersRef.current.push(mainMarker);

    // Add destination markers (blue)
    const destIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    directDestinations.forEach(dest => {
      if (dest.coordinates && dest.coordinates.length === 2) {
        const destMarker = L.marker(dest.coordinates, { icon: destIcon }).addTo(map);
        destMarker.bindPopup(`
          <div style="font-family: sans-serif;">
            <strong>${dest.name}</strong><br/>
            <span style="color: #666;">Fare: ${dest.fare}</span><br/>
            <span style="color: #666;">Time: ${dest.estimatedTimeMin} min</span>
          </div>
        `);
        markersRef.current.push(destMarker);

        // Draw line from main tera to destination
        const line = L.polyline([tera.coordinates, dest.coordinates], {
          color: '#2563eb',
          weight: 2,
          opacity: 0.5,
          dashArray: '5, 5'
        }).addTo(map);
        markersRef.current.push(line);
      }
    });

    // Fit map to show all markers
    const allCoords = [tera.coordinates, ...directDestinations.filter(d => d.coordinates).map(d => d.coordinates)];
    if (allCoords.length > 1) {
      try {
        map.fitBounds(allCoords, { padding: [50, 50] });
      } catch (e) {
        map.setView(tera.coordinates, 13);
      }
    } else {
      map.setView(tera.coordinates, 13);
    }
  }, [teraData]);

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

  if (!teraData) {
    return null;
  }

  const { tera, directDestinations, totalDestinations } = teraData;

  return (
    <div className="mt-6">
      {/* Tera Info Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">{tera.name}</h2>
        {tera.address && (
          <p className="text-gray-600 dark:text-gray-400 mb-2">📍 {tera.address}</p>
        )}
        {tera.condition && (
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Condition: <span className={`font-semibold ${
              tera.condition === 'good' ? 'text-green-600' :
              tera.condition === 'average' ? 'text-yellow-600' :
              'text-red-600'
            }`}>{tera.condition}</span>
          </p>
        )}
        {tera.notes && (
          <p className="text-gray-600 dark:text-gray-400 mb-2">📝 {tera.notes}</p>
        )}
        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-3">
          {totalDestinations} direct destination{totalDestinations !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Map */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-700 shadow-lg">
        <div ref={mapRef} style={{ height: 450, width: '100%' }} />
      </div>

      {/* Destinations List */}
      {directDestinations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Direct Destinations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {directDestinations.map((dest, idx) => (
              <div
                key={dest.id || idx}
                className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-lg text-black dark:text-white">{dest.name}</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💰 Fare: <span className="font-semibold text-green-600 dark:text-green-400">{dest.fare} Birr</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ⏱️ Time: <span className="font-semibold">{dest.estimatedTimeMin} min</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeraSearchView;






