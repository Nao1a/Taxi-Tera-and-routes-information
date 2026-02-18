import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteDetails from '../components/RouteDetails';
import Autocomplete from '../components/Autocomplete';
import TeraSearchView from '../components/TeraSearchView';
import authService from '../services/authService';
import { API_BASE_URL } from '../config/apiConfig';

const Spinner = () => (
  <svg className="animate-spinner w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
  </svg>
);

const HomePage = () => {
  const [teras, setTeras] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [optimizeBy, setOptimizeBy] = useState('fare');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  // Tera search state
  const [searchMode, setSearchMode] = useState('route');
  const [selectedTera, setSelectedTera] = useState('');
  const [teraDetails, setTeraDetails] = useState(null);

  useEffect(() => {
    const fetchTeras = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/search/teras`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setTeras(data);
      } catch (error) {
        console.error("Failed to fetch teras:", error);
        setError('Failed to load tera list. Please try refreshing the page.');
      }
    };
    fetchTeras();
  }, []);

  const handleSearch = async () => {
    if (!from || !to) {
      setError('Please select a starting and ending point.');
      return;
    }
    setError('');
    setResults(null);
    setSearching(true);
    try {
      const params = new URLSearchParams({ from, to, optimizeBy });
      const response = await fetch(`${API_BASE_URL}/api/search?${params}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Search failed');
      }
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      setError(error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleTeraSearch = async () => {
    if (!selectedTera) {
      setError('Please select a tera to view.');
      return;
    }
    setError('');
    setTeraDetails(null);
    setSearching(true);
    try {
      const params = new URLSearchParams({ tera: selectedTera });
      const response = await fetch(`${API_BASE_URL}/api/search/tera-details?${params}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Tera search failed');
      }
      const data = await response.json();
      setTeraDetails(data);
    } catch (error) {
      console.error("Failed to fetch tera details:", error);
      setError(error.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))' }}>
      <div className="text-center">
        <h1 className="text-3xl font-bold">TERAS</h1>
        <p style={{ color: 'rgb(var(--muted))' }}>Taxi Routes & Fare Explorer</p>
      </div>

      {/* Tab Switcher */}
      <div className="mt-6 flex rounded-xl overflow-hidden" style={{ border: '1px solid rgb(var(--border))' }}>
        <button
          onClick={() => { setSearchMode('route'); setError(''); setTeraDetails(null); }}
          className="px-6 py-3 font-semibold transition-all"
          style={searchMode === 'route'
            ? { backgroundColor: 'rgb(var(--brand))', color: '#fff' }
            : { backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--muted))' }
          }
        >
          🚖 Route Search
        </button>
        <button
          onClick={() => { setSearchMode('tera'); setError(''); setResults(null); }}
          className="px-6 py-3 font-semibold transition-all"
          style={searchMode === 'tera'
            ? { backgroundColor: 'rgb(var(--brand))', color: '#fff' }
            : { backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--muted))' }
          }
        >
          📍 Tera Search
        </button>
      </div>

      <div className="mt-8 w-full max-w-md px-4">
        {searchMode === 'route' ? (
          <>
            <div className="flex flex-col space-y-4">
              <Autocomplete
                options={teras}
                value={from}
                onChange={setFrom}
                placeholder="Starting Point"
              />
              <Autocomplete
                options={teras}
                value={to}
                onChange={setTo}
                placeholder="Where do you want to go?"
              />
              <div className="relative">
                <select
                  value={optimizeBy}
                  onChange={(e) => setOptimizeBy(e.target.value)}
                  className="input-base pr-10 appearance-none cursor-pointer"
                >
                  <option value="fare">Optimize by Fare</option>
                  <option value="time">Optimize by Time</option>
                  <option value="stops">Optimize by Stops</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: 'rgb(var(--muted))' }}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.516 7.548c.436-.446 1.144-.446 1.584 0L10 10.42l2.9-2.872c.44-.446 1.148-.446 1.584 0 .437.446.437 1.164 0 1.61l-3.69 3.667c-.44.446-1.148.446-1.584 0L5.516 9.158c-.437-.446-.437-1.164 0-1.61z" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="mt-8 w-full p-4 rounded-xl font-bold text-lg shadow-lg text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'rgb(var(--brand))' }}
            >
              {searching ? <><Spinner /> Searching...</> : 'Find Route'}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col space-y-4">
              <Autocomplete
                options={teras}
                value={selectedTera}
                onChange={setSelectedTera}
                placeholder="Search for a tera..."
              />
            </div>
            <button
              onClick={handleTeraSearch}
              disabled={searching}
              className="mt-8 w-full p-4 rounded-xl font-bold text-lg shadow-lg text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'rgb(var(--brand))' }}
            >
              {searching ? <><Spinner /> Searching...</> : 'View Tera Details'}
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/submit')}
          className="mt-4 w-full p-4 rounded-xl font-semibold text-lg transition-colors"
          style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--muted))' }}
        >
          Contribute Route Data
        </button>

        <div className="mt-8 w-full">
          {error && <p className="text-center font-medium" style={{ color: 'rgb(var(--error))' }}>{error}</p>}
          {searchMode === 'route' && results && (
            <div>
              <RouteDetails route={results} title="Best Route" />
              {results.secondBest && (
                <RouteDetails route={results.secondBest} title="Second Best Route" />
              )}
            </div>
          )}
          {searchMode === 'tera' && teraDetails && (
            <TeraSearchView teraData={teraDetails} />
          )}
          {!searching && !results && !teraDetails && !error && (
            <p className="text-center text-sm mt-4" style={{ color: 'rgb(var(--muted))' }}>
              Search for a route or tera to see results here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
