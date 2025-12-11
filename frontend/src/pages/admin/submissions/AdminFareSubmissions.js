import React from 'react';
import SubmissionPageBase from '../../../components/admin/SubmissionPageBase';

const AdminFareSubmissions = () => {
  const renderFareContent = (it) => {
    const p = it?.payload || {};
    return (
      <div className="space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          {p.routeId ? (
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Route ID</div>
              <div className="text-base text-gray-900 dark:text-white">{p.routeId}</div>
            </div>
          ) : (
            <>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">From Tera</div>
                <div className="text-base text-gray-900 dark:text-white">{p.fromTera || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">To Tera</div>
                <div className="text-base text-gray-900 dark:text-white">{p.toTera || 'N/A'}</div>
              </div>
            </>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Fare</div>
          <div className="text-base text-gray-500 dark:text-gray-400 line-through">${p.currentFare || 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">New Fare</div>
          <div className="text-base text-green-600 dark:text-green-400 font-semibold">${p.newFare || 'N/A'}</div>
        </div>
      </div>
    );
  };

  return (
    <SubmissionPageBase
      type="fareUpdate"
      title="Fare Update Submissions"
      renderCustomContent={renderFareContent}
    />
  );
};

export default AdminFareSubmissions;



