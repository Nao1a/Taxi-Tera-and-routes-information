import React from 'react';
import RouteMap from './RouteMap';

const RouteDetails = ({ route, title }) => {
  if (!route) return null;

  return (
    <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--text))' }}>
      <h3 className="text-xl font-bold" style={{ color: 'rgb(var(--text))' }}>{title}</h3>
      <p className="mt-2" style={{ color: 'rgb(var(--muted))' }}>
        <strong style={{ color: 'rgb(var(--text))' }}>Path:</strong> {route.path.join(' → ')}
      </p>
      <p style={{ color: 'rgb(var(--muted))' }}>
        <strong style={{ color: 'rgb(var(--text))' }}>Total Fare:</strong> {route.totalFare} ETB
      </p>
      <p style={{ color: 'rgb(var(--muted))' }}>
        <strong style={{ color: 'rgb(var(--text))' }}>Total Time:</strong> {route.totalTime} minutes
      </p>
      {Array.isArray(route.coordinates) && route.coordinates.length > 0 && (
        <RouteMap coordinates={route.coordinates} names={route.path} />
      )}
    </div>
  );
};

export default RouteDetails;
