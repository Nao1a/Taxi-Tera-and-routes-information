import React, { useEffect, useMemo, useState } from 'react';
import { adminListSubmissions, approveSubmission, rejectSubmission, adminManage } from '../services/submissionService';
import authService from '../services/authService';
import Autocomplete from '../components/Autocomplete';

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
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchTeras, setSearchTeras] = useState('');
  const [searchRoutes, setSearchRoutes] = useState('');

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

  // filtered memoized lists for search UX
  const userList = useMemo(() => {
    const q = searchUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => `${u.username} ${u.email} ${u.role}`.toLowerCase().includes(q));
  }, [users, searchUsers]);
  const teraList = useMemo(() => {
    const q = searchTeras.trim().toLowerCase();
    if (!q) return teras;
    return teras.filter(t => `${t.name} ${t._id}`.toLowerCase().includes(q));
  }, [teras, searchTeras]);
  const routeList = useMemo(() => {
    const q = searchRoutes.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(r => `${r.fromTera?.name} ${r.toTera?.name} ${r._id}`.toLowerCase().includes(q));
  }, [routes, searchRoutes]);

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
      <h1 className="text-3xl font-extrabold mb-4 tracking-tight">Admin Dashboard</h1>
      <div className="flex gap-2 mb-4">
        {['submissions','teras','routes','users'].map(t => (
          <button key={t} onClick={()=>{setTab(t); setError(''); setNotice('');}}
            className={`px-3 py-2 rounded-full transition ${tab===t?'bg-blue-600 text-white shadow':'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{t}</button>
        ))}
      </div>

      {(notice || error) && (
        <div className="mb-3">
          {notice && <div className="px-4 py-2 rounded bg-green-600 text-white mb-2">{notice}</div>}
          {error && <div className="px-4 py-2 rounded bg-red-600 text-white">{error}</div>}
        </div>
      )}

      {tab==='submissions' && (
      <div className="flex items-center gap-3 mb-4">
    <select className="p-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
    <input className="flex-1 p-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Admin notes (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      </div>)}
  {/* messages moved above */}
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
          <div className="flex items-center justify-between">
            <div className="font-semibold opacity-80">Manage Teras</div>
            <input value={searchTeras} onChange={e=>setSearchTeras(e.target.value)} placeholder="Search teras..." className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" />
          </div>
          <div className="p-3 border rounded bg-white dark:bg-gray-800">
            <div className="font-semibold mb-2">Add Tera</div>
            <TeraForm busy={busy} onSubmit={async (obj)=>{ try { setBusy(true); await adminManage.createTera(obj); setError(''); setNotice('Tera created'); } catch(e){ setError(e?.response?.data?.message || 'Failed to create tera'); } finally { setBusy(false); load(); } }} />
          </div>
          {teraList.map(t => (
            <div key={t._id} className="p-3 border rounded bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-400">{t._id}</div>
              </div>
              <TeraForm busy={busy} tera={t} onSubmit={async (obj)=>{ try { setBusy(true); await adminManage.updateTera(t._id, obj); setError(''); setNotice('Tera updated'); } catch(e){ setError(e?.response?.data?.message || 'Failed to update tera'); } finally { setBusy(false); load(); } }} />
              <div className="mt-2">
                <button onClick={async()=>{ setBusy(true); await adminManage.deleteTera(t._id); setBusy(false); load(); }} className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50" disabled={busy}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='routes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold opacity-80">Manage Routes</div>
            <input value={searchRoutes} onChange={e=>setSearchRoutes(e.target.value)} placeholder="Search routes..." className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" />
          </div>
          <div className="p-3 border rounded bg-white dark:bg-gray-800">
            <div className="font-semibold mb-2">Add Route</div>
            <RouteForm busy={busy} onSubmit={async (obj)=>{ try { setBusy(true); await adminManage.createRoute(obj); setError(''); setNotice('Route created'); } catch(e){ setError(e?.response?.data?.message || 'Failed to create route'); } finally { setBusy(false); load(); } }} />
          </div>
          {routeList.map(r => (
            <div key={r._id} className="p-3 border rounded bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div className="font-medium">{r.fromTera?.name} → {r.toTera?.name}</div>
                <div className="text-xs text-gray-400">{r._id}</div>
              </div>
              <RouteForm busy={busy} route={r} onSubmit={async (obj)=>{ try { setBusy(true); await adminManage.updateRoute(r._id, obj); setError(''); setNotice('Route updated'); } catch(e){ setError(e?.response?.data?.message || 'Failed to update route'); } finally { setBusy(false); load(); } }} />
              <div className="mt-2">
                <button onClick={async()=>{ setBusy(true); await adminManage.deleteRoute(r._id); setBusy(false); load();}} className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50" disabled={busy}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold opacity-80">Manage Users</div>
            <input value={searchUsers} onChange={e=>setSearchUsers(e.target.value)} placeholder="Search users..." className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" />
          </div>
          {userList.map(u => (
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
                    <button onClick={async()=>{ setBusy(true); await adminManage.unbanUser(u._id); setBusy(false); load();}} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50" disabled={busy}>Unban</button>
                  </>
                ) : (
                  <button onClick={async()=>{ if (u.role==='admin'){ setError('Cannot ban an admin user'); return; } const reason=prompt('Reason?')||undefined; setBusy(true); await adminManage.banUser(u._id, reason).catch(e=>setError(e?.response?.data?.message||'Ban failed')); setBusy(false); load();}}
                    className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50" disabled={busy}>Ban</button>
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

function TeraForm({ tera, onSubmit, busy }) {
  const [name, setName] = useState(tera?.name || '');
  const [lng, setLng] = useState(tera?.location?.coordinates?.[0] ?? '');
  const [lat, setLat] = useState(tera?.location?.coordinates?.[1] ?? '');
  const [address, setAddress] = useState(tera?.address || '');
  const [notes, setNotes] = useState(tera?.notes || '');
  const [condition, setCondition] = useState(tera?.condition || 'good');
  return (
    <form className="grid md:grid-cols-6 gap-2 items-end" onSubmit={e=>{e.preventDefault(); onSubmit({ name, lng, lat, address, notes, condition });}}>
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Lng" value={lng} onChange={e=>setLng(e.target.value)} />
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Lat" value={lat} onChange={e=>setLat(e.target.value)} />
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
      <select disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={condition} onChange={e=>setCondition(e.target.value)}>
        <option value="good">good</option>
        <option value="average">average</option>
        <option value="poor">poor</option>
      </select>
      <button disabled={busy} className="p-2 bg-blue-600 text-white rounded md:col-span-6 disabled:opacity-50 flex items-center justify-center gap-2">
        {busy && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
        Save
      </button>
    </form>
  );
}

function RouteForm({ route, onSubmit, busy }) {
  const [fare, setFare] = useState(route?.fare ?? '');
  const [estimatedTimeMin, setEstimatedTimeMin] = useState(route?.estimatedTimeMin ?? '');
  const [distance, setDistance] = useState(route?.distance ?? '');
  const [roadCondition, setRoadCondition] = useState(route?.roadCondition || 'good');
  const [availabilityMin, setAvailabilityMin] = useState(route?.availabilityMin ?? '');

  // From/To only for creating new routes (no route prop)
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [teraOptions, setTeraOptions] = useState([]);
  useEffect(() => {
    // lazy load once
    fetch('https://teras-7d3o.onrender.com/api/search/teras').then(r=>r.ok?r.json():[]).then(setTeraOptions).catch(()=>{});
  }, []);

  const isCreate = !route;
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { fare, estimatedTimeMin, distance, roadCondition, availabilityMin };
    if (isCreate) {
      Object.assign(payload, { fromTera: fromName, toTera: toName });
    }
    onSubmit(payload);
  };

  return (
    <form className="grid md:grid-cols-7 gap-2 items-end" onSubmit={handleSubmit}>
      {isCreate && (
        <>
          <Autocomplete options={teraOptions} value={fromName} onChange={setFromName} placeholder="From (name or ID)" />
          <Autocomplete options={teraOptions} value={toName} onChange={setToName} placeholder="To (name or ID)" />
        </>
      )}
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Fare" value={fare} onChange={e=>setFare(e.target.value)} />
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Time (min)" value={estimatedTimeMin} onChange={e=>setEstimatedTimeMin(e.target.value)} />
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Distance" value={distance} onChange={e=>setDistance(e.target.value)} />
      <select disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={roadCondition} onChange={e=>setRoadCondition(e.target.value)}>
        <option value="good">good</option>
        <option value="average">average</option>
        <option value="poor">poor</option>
      </select>
      <input disabled={busy} className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Availability (min)" value={availabilityMin} onChange={e=>setAvailabilityMin(e.target.value)} />
      <button disabled={busy} className="p-2 bg-blue-600 text-white rounded md:col-span-7 flex items-center justify-center gap-2 disabled:opacity-50">
        {busy && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
        Save
      </button>
    </form>
  );
}
