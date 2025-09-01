import React, { useEffect, useState } from 'react';
import { createSubmission, getMySubmissions } from '../services/submissionService';
import authService from '../services/authService';
import Autocomplete from '../components/Autocomplete';

const SubmitDataPage = () => {
  const user = authService.getCurrentUser();
  const [type, setType] = useState('newTera');
  const [payload, setPayload] = useState({});
  const [message, setMessage] = useState('');
  const [mySubs, setMySubs] = useState([]);
  const [teraOptions, setTeraOptions] = useState([]);

  useEffect(() => {
    if (user) {
      getMySubmissions().then(setMySubs).catch(()=>{});
    }
  }, [user]);

  useEffect(() => {
    // Fetch tera names for suggestions
  fetch('https://teras-7d3o.onrender.com/api/search/teras')
      .then(r => r.ok ? r.json() : [])
      .then(list => setTeraOptions(Array.isArray(list) ? list : []))
      .catch(() => setTeraOptions([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await createSubmission(type, payload);
      setMessage('Submitted successfully.');
      setMySubs([res, ...mySubs]);
    } catch (e) {
      setMessage(e?.data?.message || 'Submission failed');
    }
  };

  const onChangePayload = (field, value) => setPayload(prev => ({ ...prev, [field]: value }));

  const inputBase = "w-full p-3 rounded-xl bg-white border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400";
  const renderFields = () => {
    switch (type) {
      case 'newTera':
        return (
          <div className="space-y-3">
            <input className={inputBase} placeholder="Tera name" onChange={e=>onChangePayload('name', e.target.value)} />
            <input className={inputBase} placeholder="Longitude" onChange={e=>onChangePayload('lng', e.target.value)} />
            <input className={inputBase} placeholder="Latitude" onChange={e=>onChangePayload('lat', e.target.value)} />
            <input className={inputBase} placeholder="Address (optional)" onChange={e=>onChangePayload('address', e.target.value)} />
            <select className={inputBase} onChange={e=>onChangePayload('condition', e.target.value)} defaultValue="good">
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        );
      case 'newRoute':
        return (
          <div className="space-y-3">
            <Autocomplete options={teraOptions} value={payload.fromTera || ''} onChange={v=>onChangePayload('fromTera', v)} placeholder="fromTera (ID or Name)" />
            <Autocomplete options={teraOptions} value={payload.toTera || ''} onChange={v=>onChangePayload('toTera', v)} placeholder="toTera (ID or Name)" />
            <input className={inputBase} placeholder="Fare" type="number" onChange={e=>onChangePayload('fare', Number(e.target.value))} />
            <input className={inputBase} placeholder="Estimated Time (min)" type="number" onChange={e=>onChangePayload('estimatedTimeMin', Number(e.target.value))} />
          </div>
        );
      case 'fareUpdate':
        return (
          <div className="space-y-3">
            <input className={inputBase} placeholder="routeId (or leave empty and fill from/to)" onChange={e=>onChangePayload('routeId', e.target.value)} />
            <Autocomplete options={teraOptions} value={payload.fromTera || ''} onChange={v=>onChangePayload('fromTera', v)} placeholder="fromTera (ID or Name)" />
            <Autocomplete options={teraOptions} value={payload.toTera || ''} onChange={v=>onChangePayload('toTera', v)} placeholder="toTera (ID or Name)" />
            <input className={inputBase} placeholder="New Fare" type="number" onChange={e=>onChangePayload('newFare', Number(e.target.value))} />
          </div>
        );
      case 'conditionUpdate':
        return (
          <div className="space-y-3">
            <Autocomplete options={teraOptions} value={payload.tera || ''} onChange={v=>onChangePayload('tera', v)} placeholder="tera (ID or Name)" />
            <select className={inputBase} onChange={e=>onChangePayload('condition', e.target.value)} defaultValue="good">
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
    return <div className="p-6 max-w-3xl mx-auto text-black dark:text-white">Please login to submit data.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto text-black dark:text-white">
      <h1 className="text-2xl font-bold mb-4">Contribute Route Data</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select className={inputBase} value={type} onChange={e=>{setType(e.target.value); setPayload({});}}>
          <option value="newTera">New Tera</option>
          <option value="newRoute">New Route</option>
          <option value="fareUpdate">Fare Update</option>
          <option value="conditionUpdate">Condition Update</option>
        </select>
        {renderFields()}
        {type === 'newTera' && payload.lng && payload.lat && (
          <small className="block text-gray-500 dark:text-gray-400">Coordinates will be sent as [lng, lat]</small>
        )}
        <button type="submit" className="px-4 py-2 bg-black text-white rounded dark:bg-white dark:text-black">Submit</button>
      </form>
  {/* datalist no longer needed since using Autocomplete component */}
      {message && <p className="mt-3 text-sm text-black dark:text-white">{message}</p>}

      <h2 className="text-xl font-semibold mt-8 mb-2">My Submissions</h2>
    <div className="space-y-2">
        {mySubs.map(s => (
      <div key={s._id} className="p-3 border rounded flex items-center justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
            <div>
              <div className="font-medium">{s.type}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Status: {s.status}</div>
            </div>
            <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</div>
          </div>
        ))}
    {mySubs.length === 0 && <div className="text-gray-500 dark:text-gray-400">No submissions yet.</div>}
      </div>

    </div>
  );
};

export default SubmitDataPage;
