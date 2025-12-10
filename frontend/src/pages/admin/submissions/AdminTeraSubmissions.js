import React from 'react';
import SubmissionPageBase from '../../../components/admin/SubmissionPageBase';

const AdminTeraSubmissions = () => {
  const renderTeraContent = (it) => {
    const p = it?.payload || {};
    return (
      <div className="space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</div>
            <div className="text-base text-gray-900 dark:text-white">{p.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</div>
            <div className="text-base text-gray-900 dark:text-white">{p.address || 'N/A'}</div>
          </div>
        </div>
        {p.notes && (
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</div>
            <div className="text-base text-gray-900 dark:text-white">{p.notes}</div>
          </div>
        )}
        {p.condition && (
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Condition</div>
            <div className="text-base text-gray-900 dark:text-white capitalize">{p.condition}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SubmissionPageBase
      type="newTera"
      title="New Tera Submissions"
      renderCustomContent={renderTeraContent}
    />
  );
};

export default AdminTeraSubmissions;


