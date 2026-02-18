import React, { useState } from 'react';
import { FiUploadCloud, FiCheckCircle } from 'react-icons/fi';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const DriverVerificationPage = () => {
  const [licenseFile, setLicenseFile] = useState(null);
  const [status, setStatus] = useState('pending'); // pending, submitted, verified, rejected
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setLicenseFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.submitDriverVerification(licenseFile);
      setStatus('submitted');
    } catch (err) {
      console.error(err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = user?.kycStatus || status;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Driver Verification</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload Driving License</h2>
          <p className="text-gray-500 dark:text-gray-400">
            To accept jobs, you must verify your identity by uploading a valid driving license.
          </p>
        </div>

        {currentStatus === 'verified' ? (
          <div className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <FiCheckCircle className="mr-3 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold">You have done your verification</p>
              <p className="text-sm mt-1">You can now proceed to explore and apply for jobs.</p>
            </div>
          </div>
        ) : currentStatus === 'pending' || currentStatus === 'submitted' ? (
          <div className="flex items-center p-4 bg-[rgba(var(--brand-rgb),0.05)] text-[rgb(var(--brand))] rounded-lg border border-[rgba(var(--brand-rgb),0.2)]">
            <FiCheckCircle className="mr-3 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold">Verification Submitted</p>
              <p className="text-sm mt-1">Your documents are under review. This usually takes 24-48 hours.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-[rgb(var(--brand))] transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <FiUploadCloud size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  {licenseFile ? licenseFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-400 mt-2">SVG, PNG, JPG or PDF (max. 10MB)</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!licenseFile || loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${licenseFile
                  ? 'bg-[rgb(var(--brand))] hover:opacity-90 shadow-lg shadow-[rgba(var(--brand-rgb),0.2)]'
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {loading ? 'Uploading...' : 'Submit for Verification'}
            </button>
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default DriverVerificationPage;
