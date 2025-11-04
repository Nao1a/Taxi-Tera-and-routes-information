import React, { useEffect, useMemo, useState } from 'react';
import { adminListSubmissions, approveSubmission, rejectSubmission, adminManage } from '../services/submissionService';
import authService from '../services/authService';
import Autocomplete from '../components/Autocomplete';
import PointMap from '../components/map/PointMap';
import LocationPicker from '../components/map/LocationPicker';

const AdminSubmissionsPage = () => {
  const user = authService.getCurrentUser();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('submissions'); // submissions | teras | routes | users | analytics
  const [teras, setTeras] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [edit, setEdit] = useState(null); // generic editing object
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchTeras, setSearchTeras] = useState('');
  const [searchRoutes, setSearchRoutes] = useState('');
  const [analytics, setAnalytics] = useState(null);

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
      } else if (tab === 'analytics') {
        const a = await adminManage.getAnalytics(); setAnalytics(a);
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
  {['submissions','teras','routes','users','analytics'].map(t => (
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
  <select className="p-2 border rounded bg-white dark:bg-white/10 text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }} value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
  <input className="flex-1 p-2 border rounded bg-white dark:bg-white/10 text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }} placeholder="Admin notes (optional)" value={note} onChange={e=>setNote(e.target.value)} />
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
            {renderSubmissionMap(it)}
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
            <input value={searchTeras} onChange={e=>setSearchTeras(e.target.value)} placeholder="Search teras..." className="p-2 rounded-xl bg-white dark:bg-white/10 text-black dark:text-white" style={{ border: '1px solid rgb(var(--border))' }} />
          </div>
          <div className="p-3 border rounded" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
            <div className="font-semibold mb-2">Add Tera</div>
            <TeraForm busy={busy} onSubmit={async (obj)=>{ try { setBusy(true); await adminManage.createTera(obj); setError(''); setNotice('Tera created'); } catch(e){ setError(e?.response?.data?.message || 'Failed to create tera'); } finally { setBusy(false); load(); } }} />
          </div>
          {teraList.map(t => (
            <div key={t._id} className="p-3 border rounded" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
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
            <input value={searchRoutes} onChange={e=>setSearchRoutes(e.target.value)} placeholder="Search routes..." className="p-2 rounded-xl bg-white dark:bg-white/10 text-black dark:text-white" style={{ border: '1px solid rgb(var(--border))' }} />
          </div>
          <div className="p-3 border rounded" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
            <div className="font-semibold mb-2">Add Route</div>
            <RouteForm busy={busy} onSubmit={async (obj)=>{ try { setBusy(true); await adminManage.createRoute(obj); setError(''); setNotice('Route created'); } catch(e){ setError(e?.response?.data?.message || 'Failed to create route'); } finally { setBusy(false); load(); } }} />
          </div>
          {routeList.map(r => (
            <div key={r._id} className="p-3 border rounded" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
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
            <input value={searchUsers} onChange={e=>setSearchUsers(e.target.value)} placeholder="Search users..." className="p-2 rounded-xl bg-white dark:bg-white/10 text-black dark:text-white" style={{ border: '1px solid rgb(var(--border))' }} />
          </div>
          {userList.map(u => (
            <div key={u._id} className="p-3 border rounded" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
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

      {tab==='analytics' && <AnalyticsDashboard analytics={analytics} />}
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
    <form className="grid gap-2 items-end" onSubmit={e=>{e.preventDefault(); onSubmit({ name, lng, lat, address, notes, condition });}}>
      <div className="grid md:grid-cols-6 gap-2">
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
      </div>
      <div className="mt-2">
        <LocationPicker
          value={(lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null}
          onChange={({ lat: la, lng: ln }) => { setLat(String(la)); setLng(String(ln)); }}
          height={240}
          disabled={busy}
        />
      </div>
      <button disabled={busy} className="p-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2">
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

// helper to render a map preview inside the submission card when payload contains lat/lng
function renderSubmissionMap(it) {
  const p = it?.payload || {};
  // support either payload.lat/payload.lng or payload.location.coordinates [lng,lat]
  let lat = null, lng = null;
  if (typeof p.lat !== 'undefined' && typeof p.lng !== 'undefined') {
    lat = Number(p.lat); lng = Number(p.lng);
  } else if (Array.isArray(p?.location?.coordinates) && p.location.coordinates.length === 2) {
    lng = Number(p.location.coordinates[0]); lat = Number(p.location.coordinates[1]);
  }
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return (
    <div className="mt-2">
      <PointMap coords={{ lat, lng }} height={220} />
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard({ analytics }) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-gray-500">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={analytics.totals.users} 
          change={`+${analytics.users.newThisWeek} this week`}
          icon="👥"
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard 
          title="Total Teras" 
          value={analytics.totals.teras} 
          change={`+${analytics.teras.newThisMonth} this month`}
          icon="📍"
          gradient="from-green-500 to-green-600"
        />
        <StatCard 
          title="Total Routes" 
          value={analytics.totals.routes} 
          change={`+${analytics.routes.newThisMonth} this month`}
          icon="🛣️"
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard 
          title="Pending Reviews" 
          value={analytics.submissions.pending} 
          change={`${analytics.submissions.approvalRate}% approved`}
          icon="⏳"
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              Route Analytics
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Average Fare</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">₦{analytics.routes.avgFare}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4">
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Distance</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{analytics.routes.totalDistance} km</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Road Conditions</div>
              {Object.entries(analytics.routes.byCondition).map(([condition, count]) => (
                <ProgressBar key={condition} label={condition} value={count} max={analytics.totals.routes} color={getConditionColor(condition)} />
              ))}
            </div>
          </div>

          {/* Tera Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              Tera Analytics
            </h3>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tera Conditions</div>
              {Object.entries(analytics.teras.byCondition).map(([condition, count]) => (
                <ProgressBar key={condition} label={condition} value={count} max={analytics.totals.teras} color={getConditionColor(condition)} />
              ))}
            </div>
          </div>

          {/* Submission Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Submission Analytics
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(analytics.submissions.byType).map(([type, count]) => (
                <div key={type} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{type}</div>
                  <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{count}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status Breakdown</div>
              {Object.entries(analytics.submissions.byStatus).map(([status, count]) => (
                <ProgressBar key={status} label={status} value={count} max={analytics.totals.submissions} color={getStatusColor(status)} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* User Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              User Stats
            </h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">New This Month</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{analytics.users.newThisMonth}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">By Role</div>
                {Object.entries(analytics.users.byRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm capitalize">{role}</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{count}</span>
                  </div>
                ))}
              </div>
              {analytics.users.banned > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Banned Users</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{analytics.users.banned}</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.recentActivity.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No recent activity</div>
              ) : (
                analytics.recentActivity.map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, change, icon, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-3xl">{icon}</div>
        <div className="text-3xl font-extrabold">{value}</div>
      </div>
      <div className="text-sm font-medium opacity-90">{title}</div>
      <div className="text-xs opacity-75 mt-2">{change}</div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ label, value, max, color }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-600 dark:text-gray-400">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }) {
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };
  
  const typeIcon = {
    newTera: '📍',
    newRoute: '🛣️',
    fareUpdate: '💰',
    conditionUpdate: '🔧'
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="text-2xl">{typeIcon[activity.type] || '📝'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{activity.type}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[activity.status]}`}>
            {activity.status}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          by {activity.submittedBy?.username || 'Unknown'}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {new Date(activity.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getConditionColor(condition) {
  const colors = {
    good: 'bg-green-500',
    average: 'bg-yellow-500',
    poor: 'bg-red-500'
  };
  return colors[condition] || 'bg-gray-500';
}

function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500'
  };
  return colors[status] || 'bg-gray-500';
}
