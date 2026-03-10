import React from 'react';
import SubmissionPageBase from '../../../components/admin/SubmissionPageBase';

const AdminConditionSubmissions = () => {
  const renderConditionContent = (it) => {
    const p = it?.payload || {};
    return (
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Tera</div>
          <div className="text-base text-gray-900 dark:text-white">
            {p.teraName || p.tera || p.teraId || 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Condition</div>
          <div className="text-base text-gray-500 dark:text-gray-400 capitalize">{p.currentCondition || 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">New Condition</div>
          <div className="text-base text-gray-900 dark:text-white capitalize font-semibold">
            {p.condition || 'N/A'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <SubmissionPageBase
      type="conditionUpdate"
      title="Condition Update Submissions"
      renderCustomContent={renderConditionContent}
    />
  );
};

export default AdminConditionSubmissions;





