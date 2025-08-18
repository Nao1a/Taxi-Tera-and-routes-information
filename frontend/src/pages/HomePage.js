import React from 'react';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Redat</h1>
        <p className="text-gray-400">Check Taxi Money and Route</p>
      </div>
      <div className="mt-8 w-full max-w-md px-4">
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Starting Point"
            className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Where do you want to go?"
            className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="mt-8 w-full p-4 rounded-2xl bg-white text-black font-bold text-lg shadow-lg">
          Continue
        </button>
        <button className="mt-4 w-full p-4 rounded-2xl border border-gray-500 text-white font-semibold text-lg">
          Contribute Route Data
        </button>
      </div>
    </div>
  );
};

export default HomePage;
