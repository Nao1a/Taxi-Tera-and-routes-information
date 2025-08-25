import React, { useState, useEffect } from 'react';
import RouteDetails from '../components/RouteDetails';
import Autocomplete from '../components/Autocomplete';

const HomePage = () => {
  const [teras, setTeras] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [optimizeBy, setOptimizeBy] = useState('fare');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeras = async () => {
      try {
  // Backend mounts teras route at /api/search/teras (searchRoutes mounted at /api/search)
  const response = await fetch('/api/search/teras');
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
      const response = await fetch(`/api/search?${params}`);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-black dark:text-white">TERAS</h1>
        <p className="text-gray-600 dark:text-gray-400">Taxi Routes & Fare Explorer</p>
      </div>
      <div className="mt-8 w-full max-w-md px-4">
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
        <button
          onClick={handleSearch}
          className="mt-8 w-full p-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-lg shadow-lg"
        >
          Continue
        </button>
        <button className="mt-4 w-full p-4 rounded-2xl border border-gray-300 text-black dark:border-gray-500 dark:text-white font-semibold text-lg">
          Contribute Route Data
        </button>

        <div className="mt-8 w-full">
          {error && <p className="text-red-500 text-center">{error}</p>}
          {results && (
            <div>
              <RouteDetails route={results} title="Best Route" />
              {results.secondBest && (
                <RouteDetails route={results.secondBest} title="Second Best Route" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
