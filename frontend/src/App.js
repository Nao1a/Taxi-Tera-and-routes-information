import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import SubmitDataPage from './pages/SubmitDataPage';
import AdminSubmissionsPage from './pages/AdminSubmissionsPage';

function App() {
  return (
    <Router>
      <div className="bg-white dark:bg-gray-900 min-h-screen text-black dark:text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
          <Route path="/submit" element={<SubmitDataPage />} />
          <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
