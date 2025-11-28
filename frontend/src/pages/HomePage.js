import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteDetails from '../components/RouteDetails';
import Autocomplete from '../components/Autocomplete';
import TeraSearchView from '../components/TeraSearchView';
import authService from '../services/authService';
import { API_BASE_URL } from '../config/apiConfig';

const HomePage = () => {
  const [teras, setTeras] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [optimizeBy, setOptimizeBy] = useState('fare');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // New state for tera search
  const [searchMode, setSearchMode] = useState('route'); // 'route' or 'tera'
  const [selectedTera, setSelectedTera] = useState('');
  const [teraDetails, setTeraDetails] = useState(null);

  // Redirect taxi drivers to driver dashboard
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user?.role === 'taxiDriver') {
      navigate('/driver-dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchTeras = async () => {
      try {
  // Backend mounts teras route at /api/search/teras (searchRoutes mounted at /api/search)
  const response = await fetch(`${API_BASE_URL}/api/search/teras`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
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
    }
  };

  const handleTeraSearch = async () => {
    if (!selectedTera) {
      setError('Please select a tera to view.');
      return;
    }
    setError('');
    setTeraDetails(null);
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
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))' }}>
      <div className="text-center">
        <h1 className="text-3xl font-bold">TERAS</h1>
        <p style={{ color: 'rgb(var(--muted))' }}>Taxi Routes & Fare Explorer</p>
      </div>
      
      {/* Tab Switcher */}
      <div className="mt-6 flex rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700">
        <button
          onClick={() => { setSearchMode('route'); setError(''); setTeraDetails(null); }}
          className={`px-6 py-3 font-semibold transition-colors ${
            searchMode === 'route'
              ? 'text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
          style={searchMode === 'route' ? { backgroundColor: 'rgb(var(--brand))' } : {}}
        >
          🚖 Route Search
        </button>
        <button
          onClick={() => { setSearchMode('tera'); setError(''); setResults(null); }}
          className={`px-6 py-3 font-semibold transition-colors ${
            searchMode === 'tera'
              ? 'text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
          style={searchMode === 'tera' ? { backgroundColor: 'rgb(var(--brand))' } : {}}
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
                  className="w-full p-4 rounded-2xl bg-gray-100 border border-gray-300 text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fare">Optimize by Fare</option>
                  <option value="time">Optimize by Time</option>
                  <option value="stops">Optimize by Stops</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.516 7.548c.436-.446 1.144-.446 1.584 0L10 10.42l2.9-2.872c.44-.446 1.148-.446 1.584 0 .437.446.437 1.164 0 1.61l-3.69 3.667c-.44.446-1.148.446-1.584 0L5.516 9.158c-.437-.446-.437-1.164 0-1.61z" />
                  </svg>
                </div>
              </div>
            </div>
            <button onClick={handleSearch} className="mt-8 w-full p-4 rounded-2xl font-bold text-lg shadow-lg" style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}>
              Find Route
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
            <button onClick={handleTeraSearch} className="mt-8 w-full p-4 rounded-2xl font-bold text-lg shadow-lg" style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}>
              View Tera Details
            </button>
          </>
        )}
        
        <button onClick={() => navigate('/submit')} className="mt-4 w-full p-4 rounded-2xl font-semibold text-lg" style={{ border: '1px solid rgb(var(--border))' }}>
          Contribute Route Data
        </button>

        <div className="mt-8 w-full">
          {error && <p className="text-center" style={{ color: '#dc2626' }}>{error}</p>}
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
        </div>
      </div>
    </div>
  );
};

export default HomePage;
