import React, { useState, useEffect, useMemo } from 'react';
import { adminManage } from '../../../services/submissionService';
import Autocomplete from '../../../components/Autocomplete';
import LocationPicker from '../../../components/map/LocationPicker';
import { API_BASE_URL } from '../../../config/apiConfig';

const AdminManageTeras = () => {
  const [teras, setTeras] = useState([]);
  const [searchTeras, setSearchTeras] = useState('');
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const t = await adminManage.listTeras();
      setTeras(t);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load teras');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const teraList = useMemo(() => {
    const q = searchTeras.trim().toLowerCase();
    if (!q) return teras;
    return teras.filter(t => `${t.name} ${t._id}`.toLowerCase().includes(q));
  }, [teras, searchTeras]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Manage Teras</h1>

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
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Tera</h2>
          <TeraForm
            busy={busy}
            onSubmit={async (obj) => {
              try {
                setBusy(true);
                setError('');
                await adminManage.createTera(obj);
                setNotice('Tera created successfully');
                setTimeout(() => setNotice(''), 3000);
                await load();
              } catch (e) {
                setError(e?.response?.data?.message || 'Failed to create tera');
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Existing Teras</h2>
            <input
              value={searchTeras}
              onChange={(e) => setSearchTeras(e.target.value)}
              placeholder="Search teras..."
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-4">
            {teraList.map((t) => (
              <div
                key={t._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="font-medium text-lg text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{t._id}</div>
                  </div>
                </div>
                <TeraForm
                  busy={busy}
                  tera={t}
                  onSubmit={async (obj) => {
                    try {
                      setBusy(true);
                      setError('');
                      await adminManage.updateTera(t._id, obj);
                      setNotice('Tera updated successfully');
                      setTimeout(() => setNotice(''), 3000);
                      await load();
                    } catch (e) {
                      setError(e?.response?.data?.message || 'Failed to update tera');
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this tera?')) {
                        setBusy(true);
                        try {
                          await adminManage.deleteTera(t._id);
                          setNotice('Tera deleted successfully');
                          setTimeout(() => setNotice(''), 3000);
                          await load();
                        } catch (e) {
                          setError(e?.response?.data?.message || 'Failed to delete tera');
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

function TeraForm({ tera, onSubmit, busy }) {
  const [name, setName] = useState(tera?.name || '');
  const [lng, setLng] = useState(tera?.location?.coordinates?.[0] ?? '');
  const [lat, setLat] = useState(tera?.location?.coordinates?.[1] ?? '');
  const [address, setAddress] = useState(tera?.address || '');
  const [notes, setNotes] = useState(tera?.notes || '');
  const [condition, setCondition] = useState(tera?.condition || 'good');

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, lng, lat, address, notes, condition });
      }}
    >
      <div className="grid md:grid-cols-6 gap-4">
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Longitude"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
        />
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <select
          disabled={busy}
          className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-900 dark:text-white"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="good">Good</option>
          <option value="average">Average</option>
          <option value="poor">Poor</option>
        </select>
      </div>
      <div className="mt-2">
        <LocationPicker
          value={lat && lng ? { lat: Number(lat), lng: Number(lng) } : null}
          onChange={({ lat: la, lng: ln }) => {
            setLat(String(la));
            setLng(String(ln));
          }}
          height={240}
          disabled={busy}
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
        {tera ? 'Update Tera' : 'Create Tera'}
      </button>
    </form>
  );
}

export default AdminManageTeras;


