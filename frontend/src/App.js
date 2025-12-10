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
import DriverDashboard from './pages/DriverDashboard';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeraSubmissions from './pages/admin/submissions/AdminTeraSubmissions';
import AdminRouteSubmissions from './pages/admin/submissions/AdminRouteSubmissions';
import AdminFareSubmissions from './pages/admin/submissions/AdminFareSubmissions';
import AdminConditionSubmissions from './pages/admin/submissions/AdminConditionSubmissions';
import AdminDriverKYC from './pages/admin/submissions/AdminDriverKYC';
import AdminRouteApplications from './pages/admin/submissions/AdminRouteApplications';
import AdminManageTeras from './pages/admin/manage/AdminManageTeras';
import AdminManageRoutes from './pages/admin/manage/AdminManageRoutes';
import AdminUserManagement from './pages/admin/users/AdminUserManagement';
import AdminDriverManagement from './pages/admin/users/AdminDriverManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<div className="pt-16"><HomePage /></div>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/delete-account" element={<div className="pt-16"><DeleteAccountPage /></div>} />
          <Route path="/submit" element={<div className="pt-16"><SubmitDataPage /></div>} />
          <Route path="/driver-dashboard" element={<div className="pt-16"><DriverDashboard /></div>} />
          
          {/* New Admin Routes - AdminLayout handles its own spacing */}
          <Route path="/admin" element={<AdminLayout />}>
            {/* Redirect old admin/submissions to new dashboard */}
            <Route path="submissions" element={<AdminSubmissionsPage />} />
            <Route index element={<AdminDashboard />} />
            <Route path="submissions/teras" element={<AdminTeraSubmissions />} />
            <Route path="submissions/routes" element={<AdminRouteSubmissions />} />
            <Route path="submissions/fares" element={<AdminFareSubmissions />} />
            <Route path="submissions/conditions" element={<AdminConditionSubmissions />} />
            <Route path="submissions/driver-kyc" element={<AdminDriverKYC />} />
            <Route path="submissions/route-applications" element={<AdminRouteApplications />} />
            <Route path="manage/teras" element={<AdminManageTeras />} />
            <Route path="manage/routes" element={<AdminManageRoutes />} />
            <Route path="users/general" element={<AdminUserManagement />} />
            <Route path="users/drivers" element={<AdminDriverManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
