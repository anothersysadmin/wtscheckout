import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout';
import { LoginPage } from './pages/login';
import { HomePage } from './pages/home';
import { SchoolPage } from './pages/school';
import { AdminPage } from './pages/admin';
import { AdminLayout } from './pages/admin/layout';
import { DeviceInventory } from './pages/admin/device-inventory';
import { SchoolManagement } from './pages/admin/school-management';
import { DeviceLogs } from './pages/admin/device-logs';
import { RepairTickets } from './pages/admin/repair-tickets';
import { AuthProvider } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  // Update title when route changes
  useEffect(() => {
    document.title = 'WTS Device Management';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="school/:schoolId" element={<SchoolPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/dashboard" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="inventory" element={<DeviceInventory />} />
              <Route path="schools" element={<SchoolManagement />} />
              <Route path="logs" element={<DeviceLogs />} />
              <Route path="repair-tickets" element={<RepairTickets />} />
            </Route>
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
