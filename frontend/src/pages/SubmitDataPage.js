import React, { useEffect, useState } from 'react';
import { createSubmission, getMySubmissions } from '../services/submissionService';
import authService from '../services/authService';
import Autocomplete from '../components/Autocomplete';
import LocationPicker from '../components/map/LocationPicker';
import { API_BASE_URL } from '../config/apiConfig';

const SubmitDataPage = () => {
  const user = authService.getCurrentUser();
  const [type, setType] = useState('newTera');
  const [payload, setPayload] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);
  const [mySubs, setMySubs] = useState([]);
  const [teraOptions, setTeraOptions] = useState([]);

  useEffect(() => {
    if (user) {
      getMySubmissions().then(setMySubs).catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/search/teras`)
      .then(r => r.ok ? r.json() : [])
      .then(list => setTeraOptions(Array.isArray(list) ? list : []))
      .catch(() => setTeraOptions([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setSubmitting(true);
    try {
      const res = await createSubmission(type, payload);
      setMessage({ text: 'Submitted successfully!', type: 'success' });
      setMySubs([res, ...mySubs]);
      setPayload({});
    } catch (e) {
      setMessage({ text: e?.data?.message || 'Submission failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const onChangePayload = (field, value) => setPayload(prev => ({ ...prev, [field]: value }));

  const renderFields = () => {
    switch (type) {
      case 'newTera':
        return (
          <div className="space-y-3">
            <input className="input-base" placeholder="Tera name" onChange={e => onChangePayload('name', e.target.value)} value={payload.name || ''} />
            <LocationPicker
              value={payload.lat && payload.lng ? { lat: Number(payload.lat), lng: Number(payload.lng) } : null}
              onChange={({ lat, lng }) => { onChangePayload('lat', lat); onChangePayload('lng', lng); }}
              height={320}
            />
            <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgb(var(--bg))', border: '1px solid rgb(var(--border))' }}>Lat: {payload.lat ?? '—'}</div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgb(var(--bg))', border: '1px solid rgb(var(--border))' }}>Lng: {payload.lng ?? '—'}</div>
            </div>
            <input className="input-base" placeholder="Address (optional)" onChange={e => onChangePayload('address', e.target.value)} value={payload.address || ''} />
            <select className="input-base" onChange={e => onChangePayload('condition', e.target.value)} value={payload.condition || 'good'}>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        );
      case 'newRoute':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--muted))' }}>From Tera</label>
              <Autocomplete options={teraOptions} value={payload.fromTera || ''} onChange={v => onChangePayload('fromTera', v)} placeholder="Select starting tera" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--muted))' }}>To Tera</label>
              <Autocomplete options={teraOptions} value={payload.toTera || ''} onChange={v => onChangePayload('toTera', v)} placeholder="Select destination tera" />
            </div>
            <input className="input-base" placeholder="Fare (ETB)" type="number" onChange={e => onChangePayload('fare', Number(e.target.value))} />
            <input className="input-base" placeholder="Estimated Time (minutes)" type="number" onChange={e => onChangePayload('estimatedTimeMin', Number(e.target.value))} />
          </div>
        );
      case 'fareUpdate':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--muted))' }}>Route ID (optional if from/to provided)</label>
              <input className="input-base" placeholder="Route ID" onChange={e => onChangePayload('routeId', e.target.value)} value={payload.routeId || ''} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--muted))' }}>From Tera</label>
              <Autocomplete options={teraOptions} value={payload.fromTera || ''} onChange={v => onChangePayload('fromTera', v)} placeholder="Starting tera" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--muted))' }}>To Tera</label>
              <Autocomplete options={teraOptions} value={payload.toTera || ''} onChange={v => onChangePayload('toTera', v)} placeholder="Destination tera" />
            </div>
            <input className="input-base" placeholder="New Fare (ETB)" type="number" onChange={e => onChangePayload('newFare', Number(e.target.value))} />
          </div>
        );
      case 'conditionUpdate':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--muted))' }}>Tera</label>
              <Autocomplete options={teraOptions} value={payload.tera || ''} onChange={v => onChangePayload('tera', v)} placeholder="Select tera" />
            </div>
            <select className="input-base" onChange={e => onChangePayload('condition', e.target.value)} value={payload.condition || 'good'}>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center" style={{ color: 'rgb(var(--text))' }}>
        <p style={{ color: 'rgb(var(--muted))' }}>Please log in to submit data.</p>
      </div>
    );
  }

  const statusBadgeStyle = (status) => {
    switch (status) {
      case 'approved': return { backgroundColor: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))' };
      case 'rejected': return { backgroundColor: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' };
      default: return { backgroundColor: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))' };
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ color: 'rgb(var(--text))' }}>
      <h1 className="text-2xl font-bold mb-6">Contribute Route Data</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select className="input-base" value={type} onChange={e => { setType(e.target.value); setPayload({}); }}>
          <option value="newTera">New Tera</option>
          <option value="newRoute">New Route</option>
          <option value="fareUpdate">Fare Update</option>
          <option value="conditionUpdate">Condition Update</option>
        </select>
        {renderFields()}
        {type === 'newTera' && payload.lng && payload.lat && (
          <small className="block" style={{ color: 'rgb(var(--muted))' }}>Coordinates will be sent as [lng, lat]</small>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: 'rgb(var(--brand))' }}
        >
          {submitting ? (
            <>
              <svg className="animate-spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              Submitting...
            </>
          ) : 'Submit'}
        </button>
      </form>
      {message.text && (
        <p className="mt-3 text-sm font-medium" style={{ color: message.type === 'error' ? 'rgb(var(--error))' : 'rgb(var(--success))' }}>
          {message.text}
        </p>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-3">My Submissions</h2>
      <div className="space-y-2">
        {mySubs.map(s => (
          <div key={s._id} className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div>
              <div className="font-medium">{s.type}</div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1" style={statusBadgeStyle(s.status)}>
                {s.status}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>{new Date(s.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {mySubs.length === 0 && <div style={{ color: 'rgb(var(--muted))' }}>No submissions yet.</div>}
      </div>
    </div>
  );
};

export default SubmitDataPage;
