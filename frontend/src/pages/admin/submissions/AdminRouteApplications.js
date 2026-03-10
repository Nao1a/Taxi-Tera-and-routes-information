import React from 'react';
import SubmissionPageBase from '../../../components/admin/SubmissionPageBase';

const AdminRouteApplications = () => {
  const renderRouteApplication = (it) => {
    const p = it?.payload || {};
    return (
      <div className="mt-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="font-semibold mb-1 text-gray-900 dark:text-white">Target Route</div>
            {p.targetRoute ? (
              <>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {p.targetRoute.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Fare: ${p.targetRoute.fare}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Active Drivers: {p.targetRoute.activeDriverCount}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Route ID: {p.targetRouteId || 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">(Loading route details...)</div>
              </>
            )}
          </div>
          {p.currentRouteId && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="font-semibold mb-1 text-gray-900 dark:text-white">Current Route</div>
              {p.currentRoute ? (
                <>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {p.currentRoute.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Months Served: {p.monthsServed || 0}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Route ID: {p.currentRouteId}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Months Served: {p.monthsServed || 0}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {p.reason && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="font-semibold mb-1 text-gray-900 dark:text-white">Transfer Reason</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{p.reason}</div>
          </div>
        )}
        {p.monthsServed !== undefined && p.monthsServed < 3 && (
          <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Driver has only served {p.monthsServed} months (less than 3 months requirement)
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SubmissionPageBase
      type="route_application"
      title="Route Application Submissions"
      renderCustomContent={renderRouteApplication}
    />
  );
};

export default AdminRouteApplications;





