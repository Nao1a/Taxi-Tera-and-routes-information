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
import NotFoundPage from './pages/NotFoundPage';

// Infrastructure
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import Toast from './components/Toast';

// Contexts
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeraSubmissions from './pages/admin/submissions/AdminTeraSubmissions';
import AdminRouteSubmissions from './pages/admin/submissions/AdminRouteSubmissions';
import AdminFareSubmissions from './pages/admin/submissions/AdminFareSubmissions';
import AdminConditionSubmissions from './pages/admin/submissions/AdminConditionSubmissions';
import AdminDriverKYC from './pages/admin/submissions/AdminDriverKYC';
import AdminCarRegistrations from './pages/admin/submissions/AdminCarRegistrations';
import AdminRouteApplications from './pages/admin/submissions/AdminRouteApplications';
import AdminManageTeras from './pages/admin/manage/AdminManageTeras';
import AdminManageRoutes from './pages/admin/manage/AdminManageRoutes';
import AdminUserManagement from './pages/admin/users/AdminUserManagement';
import AdminDriverManagement from './pages/admin/users/AdminDriverManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Owner pages
import OwnerLayout from './components/owner/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerCarsPage from './pages/owner/OwnerCarsPage';
import OwnerApplicationsPage from './pages/owner/OwnerApplicationsPage';
import OwnerChatPage from './pages/owner/OwnerChatPage';

// Driver pages
import DriverLayout from './components/driver/DriverLayout';
import DriverDashboardNew from './pages/driver/DriverDashboard';
import DriverJobsPage from './pages/driver/DriverJobsPage';
import DriverMyApplicationsPage from './pages/driver/DriverMyApplicationsPage';
import DriverChatPage from './pages/driver/DriverChatPage';

// Verification
import OwnerVerificationPage from './pages/owner/OwnerVerificationPage';
import DriverVerificationPage from './pages/driver/DriverVerificationPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))' }}>
              <ScrollToTop />
              <Toast />
              <Navbar />
              <Routes>
                <Route path="/" element={<div className="pt-16"><HomePage /></div>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verify-email" element={<EmailVerificationPage />} />
                <Route path="/delete-account" element={<div className="pt-16"><DeleteAccountPage /></div>} />
                <Route path="/submit" element={<div className="pt-16"><SubmitDataPage /></div>} />

                {/* Owner Portal */}
                <Route path="/owner" element={<OwnerLayout />}>
                  <Route index element={<OwnerDashboard />} />
                  <Route path="dashboard" element={<OwnerDashboard />} />
                  <Route path="cars" element={<OwnerCarsPage />} />
                  <Route path="applications" element={<OwnerApplicationsPage />} />
                  <Route path="chat" element={<OwnerChatPage />} />
                  <Route path="verification" element={<OwnerVerificationPage />} />
                </Route>

                {/* Driver Portal */}
                <Route path="/driver" element={<DriverLayout />}>
                  <Route index element={<DriverDashboardNew />} />
                  <Route path="dashboard" element={<DriverDashboardNew />} />
                  <Route path="jobs" element={<DriverJobsPage />} />
                  <Route path="applications" element={<DriverMyApplicationsPage />} />
                  <Route path="chat" element={<DriverChatPage />} />
                  <Route path="verification" element={<DriverVerificationPage />} />
                </Route>

                {/* Admin Portal */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="submissions" element={<AdminSubmissionsPage />} />
                  <Route index element={<AdminDashboard />} />
                  <Route path="submissions/teras" element={<AdminTeraSubmissions />} />
                  <Route path="submissions/routes" element={<AdminRouteSubmissions />} />
                  <Route path="submissions/fares" element={<AdminFareSubmissions />} />
                  <Route path="submissions/conditions" element={<AdminConditionSubmissions />} />
                  <Route path="submissions/driver-kyc" element={<AdminDriverKYC />} />
                  <Route path="submissions/cars" element={<AdminCarRegistrations />} />
                  <Route path="submissions/route-applications" element={<AdminRouteApplications />} />
                  <Route path="manage/teras" element={<AdminManageTeras />} />
                  <Route path="manage/routes" element={<AdminManageRoutes />} />
                  <Route path="users/general" element={<AdminUserManagement />} />
                  <Route path="users/drivers" element={<AdminDriverManagement />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                </Route>

                {/* 404 catch-all */}
                <Route path="*" element={<div className="pt-16"><NotFoundPage /></div>} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
