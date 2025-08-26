import React from 'react';
import RouteMap from './RouteMap';

const RouteDetails = ({ route, title }) => {
  if (!route) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white">
      <h3 className="text-xl font-bold text-black dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">
        <strong>Path:</strong> {route.path.join(' -> ')}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        <strong>Total Fare:</strong> {route.totalFare}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        <strong>Total Time:</strong> {route.totalTime} minutes
      </p>
      {Array.isArray(route.coordinates) && route.coordinates.length > 0 && (
        <RouteMap coordinates={route.coordinates} names={route.path} />
      )}
    </div>
  );
};

export default RouteDetails;
