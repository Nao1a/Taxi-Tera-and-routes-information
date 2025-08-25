import React, { useEffect, useState } from 'react';
import { adminListSubmissions, approveSubmission, rejectSubmission, adminManage } from '../services/submissionService';
import authService from '../services/authService';

const AdminSubmissionsPage = () => {
  const user = authService.getCurrentUser();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('submissions'); // submissions | teras | routes | users
  const [teras, setTeras] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [edit, setEdit] = useState(null); // generic editing object

  const load = async () => {
    try {
      if (tab === 'submissions') {
        const data = await adminListSubmissions(status); setItems(data);
      } else if (tab === 'teras') {
        const t = await adminManage.listTeras(); setTeras(t);
      } else if (tab === 'routes') {
        const r = await adminManage.listRoutes(); setRoutes(r);
      } else if (tab === 'users') {
        const u = await adminManage.listUsers(); setUsers(u);
      }
    } catch (e) {
      setError(e?.data?.message || 'Failed to load');
    }
  };

  useEffect(() => { load(); }, [status, tab]);

  if (!user || !['admin','moderator'].includes(user.role)) {
    return <div className="p-6 max-w-5xl mx-auto">Admin access required.</div>;
  }

  const onApprove = async (id) => {
    try {
      await approveSubmission(id, note);
      await load();
      setNote('');
      setError('');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.data?.message || e?.message || 'Approval failed';
      setError(msg);
    }
  };
  const onReject = async (id) => {
    try {
      await rejectSubmission(id, note);
      await load();
      setNote('');
      setError('');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.data?.message || e?.message || 'Rejection failed';
      setError(msg);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-black dark:text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="flex gap-2 mb-4">
        {['submissions','teras','routes','users'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 rounded ${tab===t?'bg-blue-600 text-white':'bg-gray-200 dark:bg-gray-800'}`}>{t}</button>
        ))}
      </div>

      {tab==='submissions' && (
      <div className="flex items-center gap-3 mb-4">
    <select className="p-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
    <input className="flex-1 p-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Admin notes (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      </div>)}
  {error && <div className="text-red-500 dark:text-red-400 mb-2">{error}</div>}
      {tab==='submissions' && (<div className="space-y-3">
        {items.map(it => (
          <div key={it._id} className="p-4 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{it.type}</div>
                <div className="text-sm text-gray-500">Status: {it.status}</div>
              </div>
              <div className="text-xs text-gray-400">by {it.submittedBy?.username || 'unknown'} on {new Date(it.createdAt).toLocaleString()}</div>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-900 text-xs p-2 mt-2 overflow-auto max-h-40">{JSON.stringify(it.payload, null, 2)}</pre>
            {it.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button onClick={()=>onApprove(it._id)} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                <button onClick={()=>onReject(it._id)} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="text-gray-500">No items.</div>}
      </div>)}

      {tab==='teras' && (
        <div className="space-y-3">
          <div className="p-3 border rounded bg-white dark:bg-gray-800">
            <div className="font-semibold mb-2">Add Tera</div>
            <TeraForm onSubmit={async (obj)=>{ try { await adminManage.createTera(obj); setError(''); } catch(e){ setError(e?.response?.data?.message || 'Failed to create tera'); } finally { load(); } }} />
          </div>
          {teras.map(t => (
            <div key={t._id} className="p-3 border rounded bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-400">{t._id}</div>
              </div>
              <TeraForm tera={t} onSubmit={async (obj)=>{ try { await adminManage.updateTera(t._id, obj); setError(''); } catch(e){ setError(e?.response?.data?.message || 'Failed to update tera'); } finally { load(); } }} />
              <div className="mt-2">
                <button onClick={async()=>{await adminManage.deleteTera(t._id); load();}} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='routes' && (
        <div className="space-y-3">
          <div className="p-3 border rounded bg-white dark:bg-gray-800">
            <div className="font-semibold mb-2">Add Route</div>
            <RouteForm onSubmit={async (obj)=>{ try { await adminManage.createRoute(obj); setError(''); } catch(e){ setError(e?.response?.data?.message || 'Failed to create route'); } finally { load(); } }} />
          </div>
          {routes.map(r => (
            <div key={r._id} className="p-3 border rounded bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div className="font-medium">{r.fromTera?.name} → {r.toTera?.name}</div>
                <div className="text-xs text-gray-400">{r._id}</div>
              </div>
              <RouteForm route={r} onSubmit={async (obj)=>{await adminManage.updateRoute(r._id, obj); setError(''); load();}} />
              <div className="mt-2">
                <button onClick={async()=>{await adminManage.deleteRoute(r._id); load();}} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='users' && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className="p-3 border rounded bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{u.username} <span className="text-xs text-gray-400">({u.role})</span></div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
                <div className="text-xs text-gray-400">{u._id}</div>
              </div>
              <div className="mt-2 flex gap-2 items-center">
                {u.isSubmissionBanned ? (
                  <>
                    <span className="text-red-500 text-sm">BANNED</span>
                    <button onClick={async()=>{await adminManage.unbanUser(u._id); load();}} className="px-3 py-1 bg-green-600 text-white rounded">Unban</button>
                  </>
                ) : (
                  <button onClick={async()=>{const reason=prompt('Reason?')||undefined; await adminManage.banUser(u._id, reason); load();}} className="px-3 py-1 bg-red-600 text-white rounded">Ban</button>
                )}
                {u.isSubmissionBanned && u.submissionBanReason && (
                  <span className="text-xs text-gray-400">Reason: {u.submissionBanReason}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSubmissionsPage;

function TeraForm({ tera, onSubmit }) {
  const [name, setName] = useState(tera?.name || '');
  const [lng, setLng] = useState(tera?.location?.coordinates?.[0] ?? '');
  const [lat, setLat] = useState(tera?.location?.coordinates?.[1] ?? '');
  const [address, setAddress] = useState(tera?.address || '');
  const [notes, setNotes] = useState(tera?.notes || '');
  const [condition, setCondition] = useState(tera?.condition || 'good');
  return (
    <form className="grid md:grid-cols-6 gap-2 items-end" onSubmit={e=>{e.preventDefault(); onSubmit({ name, lng, lat, address, notes, condition });}}>
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Lng" value={lng} onChange={e=>setLng(e.target.value)} />
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Lat" value={lat} onChange={e=>setLat(e.target.value)} />
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
      <select className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={condition} onChange={e=>setCondition(e.target.value)}>
        <option value="good">good</option>
        <option value="average">average</option>
        <option value="poor">poor</option>
      </select>
      <button className="p-2 bg-blue-600 text-white rounded md:col-span-6">Save</button>
    </form>
  );
}

function RouteForm({ route, onSubmit }) {
  const [fare, setFare] = useState(route?.fare ?? '');
  const [estimatedTimeMin, setEstimatedTimeMin] = useState(route?.estimatedTimeMin ?? '');
  const [distance, setDistance] = useState(route?.distance ?? '');
  const [roadCondition, setRoadCondition] = useState(route?.roadCondition || 'good');
  const [availabilityMin, setAvailabilityMin] = useState(route?.availabilityMin ?? '');
  return (
    <form className="grid md:grid-cols-5 gap-2 items-end" onSubmit={e=>{e.preventDefault(); onSubmit({ fare, estimatedTimeMin, distance, roadCondition, availabilityMin });}}>
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Fare" value={fare} onChange={e=>setFare(e.target.value)} />
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Time (min)" value={estimatedTimeMin} onChange={e=>setEstimatedTimeMin(e.target.value)} />
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Distance" value={distance} onChange={e=>setDistance(e.target.value)} />
      <select className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={roadCondition} onChange={e=>setRoadCondition(e.target.value)}>
        <option value="good">good</option>
        <option value="average">average</option>
        <option value="poor">poor</option>
      </select>
      <input className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Availability (min)" value={availabilityMin} onChange={e=>setAvailabilityMin(e.target.value)} />
      <button className="p-2 bg-blue-600 text-white rounded md:col-span-5">Save</button>
    </form>
  );
}
