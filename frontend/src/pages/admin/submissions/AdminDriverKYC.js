import React from 'react';
import SubmissionPageBase from '../../../components/admin/SubmissionPageBase';

const AdminDriverKYC = () => {
  const renderDriverVerification = (it) => {
    const p = it?.payload || {};
    return (
      <div className="mt-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold mb-2 text-gray-900 dark:text-white">License Information</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              License Number: {p.licenseText || 'N/A'}
            </div>
            {p.licensePhoto && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">License Photo:</div>
                <img
                  src={p.licensePhoto}
                  alt="License"
                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold mb-2 text-gray-900 dark:text-white">Car Information</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plate: {p.carPlate || 'N/A'}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Type: {p.carType || 'N/A'}</div>
            {p.carPhoto && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Car Photo:</div>
                <img
                  src={p.carPhoto}
                  alt="Car"
                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <SubmissionPageBase
      type="driver_verification"
      title="Driver Verification (KYC) Submissions"
      renderCustomContent={renderDriverVerification}
    />
  );
};

export default AdminDriverKYC;



