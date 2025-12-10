import { useState, useEffect } from 'react';
import { adminListSubmissions, approveSubmission, rejectSubmission } from '../services/submissionService';

export const useSubmissions = (type, status = 'pending') => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState(status);
  const [note, setNote] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminListSubmissions(currentStatus, type);
      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentStatus, type]);

  const handleApprove = async (id) => {
    try {
      await approveSubmission(id, note);
      setNote('');
      setError('');
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.data?.message || e?.message || 'Approval failed';
      setError(msg);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectSubmission(id, note);
      setNote('');
      setError('');
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.data?.message || e?.message || 'Rejection failed';
      setError(msg);
    }
  };

  return {
    items,
    loading,
    error,
    currentStatus,
    setCurrentStatus,
    note,
    setNote,
    handleApprove,
    handleReject,
    refresh: load
  };
};

