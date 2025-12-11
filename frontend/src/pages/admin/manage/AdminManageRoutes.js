import React, { useState, useEffect, useMemo } from 'react';
import { adminManage } from '../../../services/submissionService';
import Autocomplete from '../../../components/Autocomplete';
import { API_BASE_URL } from '../../../config/apiConfig';

const AdminManageRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [searchRoutes, setSearchRoutes] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const r = await adminManage.listRoutes();
      setRoutes(r);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load routes');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const routeList = useMemo(() => {
    const q = searchRoutes.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(
      (r) =>
        `${r.fromTera?.name || ''} ${r.toTera?.name || ''} ${r._id}`
          .toLowerCase()
          .includes(q)
    );
  }, [routes, searchRoutes]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Manage Routes</h1>

      {notice && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Route</h2>
          <RouteForm
            busy={busy}
            onSubmit={async (obj) => {
              try {
                setBusy(true);
                setError('');
                await adminManage.createRoute(obj);
                setNotice('Route created successfully');
                setTimeout(() => setNotice(''), 3000);
                await load();
              } catch (e) {
                setError(e?.response?.data?.message || 'Failed to create route');
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Existing Routes</h2>
            <input
              value={searchRoutes}
              onChange={(e) => setSearchRoutes(e.target.value)}
              placeholder="Search routes..."
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-4">
            {routeList.map((r) => (
              <div
                key={r._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="font-medium text-lg text-gray-900 dark:text-white">
                      {r.fromTera?.name || 'Unknown'} → {r.toTera?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{r._id}</div>
                  </div>
                </div>
                <RouteForm
                  busy={busy}
                  route={r}
                  onSubmit={async (obj) => {
                    try {
                      setBusy(true);
                      setError('');
                      await adminManage.updateRoute(r._id, obj);
                      setNotice('Route updated successfully');
                      setTimeout(() => setNotice(''), 3000);
                      await load();
                    } catch (e) {
                      setError(e?.response?.data?.message || 'Failed to update route');
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this route?')) {
                        setBusy(true);
                        try {
                          await adminManage.deleteRoute(r._id);
                          setNotice('Route deleted successfully');
                          setTimeout(() => setNotice(''), 3000);
                          await load();
                        } catch (e) {
                          setError(e?.response?.data?.message || 'Failed to delete route');
                        } finally {
                          setBusy(false);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function RouteForm({ route, onSubmit, busy }) {
  const [fare, setFare] = useState(route?.fare ?? '');
  const [estimatedTimeMin, setEstimatedTimeMin] = useState(route?.estimatedTimeMin ?? '');
  const [distance, setDistance] = useState(route?.distance ?? '');
  const [roadCondition, setRoadCondition] = useState(route?.roadCondition || 'good');
  const [availabilityMin, setAvailabilityMin] = useState(route?.availabilityMin ?? '');

  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [teraOptions, setTeraOptions] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/search/teras`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setTeraOptions)
      .catch(() => {});
  }, []);

  const isCreate = !route;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { fare, estimatedTimeMin, distance, roadCondition, availabilityMin };
    if (isCreate) {
      Object.assign(payload, { fromTera: fromName, toTera: toName });
    }
    onSubmit(payload);
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-7 gap-4">
        {isCreate && (
          <>
            <Autocomplete
              options={teraOptions}
              value={fromName}
              onChange={setFromName}
              placeholder="From (name or ID)"
            />
            <Autocomplete
              options={teraOptions}
              value={toName}
              onChange={setToName}
              placeholder="To (name or ID)"
            />
          </>
        )}
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Fare"
          value={fare}
          onChange={(e) => setFare(e.target.value)}
          type="number"
        />
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Time (min)"
          value={estimatedTimeMin}
          onChange={(e) => setEstimatedTimeMin(e.target.value)}
          type="number"
        />
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Distance"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          type="number"
        />
        <select
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          value={roadCondition}
          onChange={(e) => setRoadCondition(e.target.value)}
        >
          <option value="good">Good</option>
          <option value="average">Average</option>
          <option value="poor">Poor</option>
        </select>
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Availability (min)"
          value={availabilityMin}
          onChange={(e) => setAvailabilityMin(e.target.value)}
          type="number"
        />
      </div>
      <button
        disabled={busy}
        className="p-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
      >
        {busy && (
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        )}
        {route ? 'Update Route' : 'Create Route'}
      </button>
    </form>
  );
}

export default AdminManageRoutes;



