import React, { useState, useEffect, useMemo } from 'react';
import { adminManage } from '../../../services/submissionService';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const u = await adminManage.listUsers();
      setUsers(u);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const userList = useMemo(() => {
    const q = searchUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        `${u.username} ${u.email} ${u.role}`.toLowerCase().includes(q)
    );
  }, [users, searchUsers]);

  const handleBanAccount = async (id) => {
    const reason = prompt('Reason for account ban:');
    if (reason === null) return; // User cancelled
    try {
      setBusy(true);
      setError('');
      await adminManage.banAccount(id, reason);
      setNotice('User account banned');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to ban account');
    } finally {
      setBusy(false);
    }
  };

  const handleUnbanAccount = async (id) => {
    try {
      setBusy(true);
      setError('');
      await adminManage.unbanAccount(id);
      setNotice('User account unbanned');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to unban account');
    } finally {
      setBusy(false);
    }
  };

  const handleChangeRole = async (id, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
      setBusy(true);
      setError('');
      await adminManage.changeUserRole(id, newRole);
      setNotice('User role updated');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to change role');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">User Management</h1>

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

      <div className="mb-4">
        <input
          value={searchUsers}
          onChange={(e) => setSearchUsers(e.target.value)}
          placeholder="Search users..."
          className="w-full max-w-md p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="space-y-4">
        {userList.map((u) => (
          <div
            key={u._id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-medium text-lg text-gray-900 dark:text-white">
                  {u.username}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">
                    ({u.role})
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{u.email}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Reputation: {u.reputation || 5}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{u._id}</div>
              </div>
              <div className="flex flex-col gap-2">
                {u.isAccountBanned ? (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm font-medium">
                    Account Banned
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">
                    Active
                  </span>
                )}
                {u.isSubmissionBanned && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm font-medium">
                    Submission Banned
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {u.isSubmissionBanned ? (
                <button
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await adminManage.unbanUser(u._id);
                      setNotice('User unbanned from submissions');
                      setTimeout(() => setNotice(''), 3000);
                      await load();
                    } catch (e) {
                      setError(e?.response?.data?.message || 'Failed to unban');
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={busy}
                >
                  Unban from Submissions
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (u.role === 'admin') {
                      setError('Cannot ban an admin user');
                      return;
                    }
                    const reason = prompt('Reason for submission ban:');
                    if (reason === null) return;
                    setBusy(true);
                    try {
                      await adminManage.banUser(u._id, reason);
                      setNotice('User banned from submissions');
                      setTimeout(() => setNotice(''), 3000);
                      await load();
                    } catch (e) {
                      setError(e?.response?.data?.message || 'Failed to ban');
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  disabled={busy}
                >
                  Ban from Submissions
                </button>
              )}

              {u.isAccountBanned ? (
                <button
                  onClick={() => handleUnbanAccount(u._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={busy}
                >
                  Unban Account
                </button>
              ) : (
                <button
                  onClick={() => handleBanAccount(u._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={busy || u.role === 'admin'}
                >
                  Ban Account
                </button>
              )}

              {u.role !== 'admin' && (
                <select
                  value={u.role}
                  onChange={(e) => handleChangeRole(u._id, e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={busy}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                </select>
              )}

              {u.submissionBanReason && (
                <div className="w-full mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Submission ban reason: {u.submissionBanReason}
                </div>
              )}
              {u.accountBanReason && (
                <div className="w-full mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Account ban reason: {u.accountBanReason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUserManagement;

