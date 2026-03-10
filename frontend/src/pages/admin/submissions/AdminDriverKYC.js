import React, { useEffect, useState } from 'react';
import adminService from '../../../services/adminService';
import { FiCheck, FiX, FiExternalLink, FiUser, FiTruck } from 'react-icons/fi';
import { API_BASE_URL } from '../../../config/apiConfig';

const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalizedPath = path.replace(/\\/g, '/');
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${API_BASE_URL}${cleanPath}`;
};

const AdminDriverKYC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // For modal

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingKYCUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load pending verifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this user?')) return;
    setProcessingId(id);
    try {
      await adminService.approveKYC(id);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    
    setProcessingId(id);
    try {
      await adminService.rejectKYC(id, reason);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-4">Loading verifications...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Pending KYC Verifications</h1>
      
      {users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center text-gray-500">
          No pending verifications found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {users.map(user => (
            <div key={user._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center">
                     <span className={`inline-flex items-center justify-center p-2 rounded-lg mr-3 ${
                        ['driver', 'taxiDriver'].includes(user.role) ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                     }`}>
                        {['driver', 'taxiDriver'].includes(user.role) ? <FiTruck /> : <FiUser />}
                     </span>
                     <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{user.username}</h3>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                     </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Pending</span>
               </div>

               <div className="p-4 space-y-4">
                  <div className="text-sm">
                      <p className="text-gray-500">Email: <span className="text-gray-900 dark:text-gray-300">{user.email}</span></p>
                      <p className="text-gray-500">Joined: <span className="text-gray-900 dark:text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</span></p>
                  </div>

                  {/* Document Preview */}
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2 text-center">
                     {['driver', 'taxiDriver'].includes(user.role) && user.driverProfile?.licenseImage ? (
                        <div 
                            onClick={() => setSelectedImage(getFileUrl(user.driverProfile.licenseImage))}
                            className="block relative group cursor-pointer"
                        >
                            <img src={getFileUrl(user.driverProfile.licenseImage)} alt="License" className="h-32 w-full object-cover rounded mx-auto" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                <span className="text-white flex items-center"><FiExternalLink className="mr-2"/> View Full</span>
                            </div>
                        </div>
                     ) : user.role === 'owner' && user.ownerProfile?.identityImage ? (
                        <div 
                            onClick={() => setSelectedImage(getFileUrl(user.ownerProfile.identityImage))}
                            className="block relative group cursor-pointer"
                        >
                             <img src={getFileUrl(user.ownerProfile.identityImage)} alt="ID" className="h-32 w-full object-cover rounded mx-auto" />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                <span className="text-white flex items-center"><FiExternalLink className="mr-2"/> View Full</span>
                            </div>
                        </div>
                     ) : (
                         <div className="py-8 text-gray-400">No document preview available</div>
                     )}
                  </div>
               </div>

               <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex space-x-3">
                  <button
                    onClick={() => handleApprove(user._id)}
                    disabled={processingId === user._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <FiCheck className="mr-2" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(user._id)}
                    disabled={processingId === user._id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <FiX className="mr-2" /> Reject
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-4xl w-full max-h-screen bg-transparent rounded-lg p-2" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300"
                >
                    <FiX size={32} />
                </button>
                <img 
                    src={selectedImage} 
                    alt="Document Full View" 
                    className="w-full h-auto max-h-[85vh] object-contain rounded-lg bg-white" 
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDriverKYC;





