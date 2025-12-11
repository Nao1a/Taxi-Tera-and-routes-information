import React from 'react';
import { useSubmissions } from '../../hooks/useSubmissions';
import PointMap from '../map/PointMap';

const SubmissionPageBase = ({ 
  type, 
  title, 
  renderCustomContent,
  renderSubmissionMap: customMapRenderer
}) => {
  const {
    items,
    loading,
    error,
    currentStatus,
    setCurrentStatus,
    note,
    setNote,
    handleApprove,
    handleReject
  } = useSubmissions(type);

  const renderSubmissionMap = (it) => {
    if (customMapRenderer) return customMapRenderer(it);
    
    const p = it?.payload || {};
    let lat = null, lng = null;
    if (typeof p.lat !== 'undefined' && typeof p.lng !== 'undefined') {
      lat = Number(p.lat); lng = Number(p.lng);
    } else if (Array.isArray(p?.location?.coordinates) && p.location.coordinates.length === 2) {
      lng = Number(p.location.coordinates[0]); lat = Number(p.location.coordinates[1]);
    }
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return (
      <div className="mt-2">
        <PointMap coords={{ lat, lng }} height={220} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <div className="flex items-center gap-3">
          {['pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setCurrentStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {currentStatus === 'pending' && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Admin notes (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full max-w-md p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      )}

      <div className="space-y-4">
        {items.map((it) => (
          <div
            key={it._id}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                  {it.type}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Status: <span className="capitalize">{it.status}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 text-right">
                <div>by {it.submittedBy?.username || 'unknown'}</div>
                <div>{new Date(it.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {renderCustomContent ? (
              <>
                {renderCustomContent(it)}
                {renderSubmissionMap(it)}
              </>
            ) : (
              <>
                <pre className="bg-gray-50 dark:bg-gray-900 text-xs p-4 mt-2 rounded-lg overflow-auto max-h-40">
                  {JSON.stringify(it.payload, null, 2)}
                </pre>
                {renderSubmissionMap(it)}
              </>
            )}

            {it.status === 'pending' && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleApprove(it._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(it._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}

            {it.adminNotes && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Admin Notes:
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">{it.adminNotes}</div>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No {currentStatus} submissions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionPageBase;


