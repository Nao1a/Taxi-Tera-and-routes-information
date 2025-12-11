import React from 'react';
import SubmissionPageBase from '../../../components/admin/SubmissionPageBase';

const AdminRouteSubmissions = () => {
  const renderRouteContent = (it) => {
    const p = it?.payload || {};
    return (
      <div className="space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">From Tera</div>
            <div className="text-base text-gray-900 dark:text-white">{p.fromTera || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">To Tera</div>
            <div className="text-base text-gray-900 dark:text-white">{p.toTera || 'N/A'}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {p.fare && (
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Fare</div>
              <div className="text-base text-gray-900 dark:text-white">${p.fare}</div>
            </div>
          )}
          {p.estimatedTimeMin && (
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimated Time (min)</div>
              <div className="text-base text-gray-900 dark:text-white">{p.estimatedTimeMin}</div>
            </div>
          )}
          {p.distance && (
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Distance</div>
              <div className="text-base text-gray-900 dark:text-white">{p.distance}</div>
            </div>
          )}
        </div>
        {p.roadCondition && (
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Road Condition</div>
            <div className="text-base text-gray-900 dark:text-white capitalize">{p.roadCondition}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SubmissionPageBase
      type="newRoute"
      title="New Route Submissions"
      renderCustomContent={renderRouteContent}
    />
  );
};

export default AdminRouteSubmissions;



