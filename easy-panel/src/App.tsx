import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AccountSettings from './pages/AccountSettings';
import Login from './pages/Login';
import Register from './pages/Register';
import { getCurrentUser } from './utils/auth';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import './index.css';

function PrivateRoute() {
  const user = getCurrentUser();
  useTokenRefresh(); // Автоматическое обновление токена
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientProfile />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="account-settings" element={<AccountSettings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
