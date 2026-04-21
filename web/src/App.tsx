import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import AdminSettings from './pages/AdminSettings';
import Roadmap from './pages/Roadmap';
import StudentAcademic from './pages/StudentAcademic';
import StudentEC from './pages/StudentEC';
import DocumentVault from './pages/DocumentVault';
import Scholarships from './pages/Scholarships';
import LoRManager from './pages/LoRManager';
import InterviewPrep from './pages/InterviewPrep';
import Reports from './pages/Reports';

import { CircularProgress, Box } from '@mui/material';

const App: React.FC = () => {
  const { setAuth, user, isInitialized, setInitialized } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        setAuth(response.data.user);
      } catch (error) {
        setAuth(null);
      } finally {
        setInitialized(true);
      }
    };

    fetchUser();
  }, [setAuth, setInitialized]);

  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login preselectedRole="STUDENT" />} />
      <Route path="/student-login" element={<Login preselectedRole="STUDENT" />} />
      <Route path="/parent-login" element={<Login preselectedRole="PARENT" />} />
      <Route path="/counselor-login" element={<Login preselectedRole="COUNSELOR" />} />
      <Route path="/admin-login" element={<Login preselectedRole="ADMIN" />} />
      <Route element={<Layout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'PARENT', 'ADMIN']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scholarships"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'ADMIN']}>
              <Scholarships />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lor"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'ADMIN']}>
              <LoRManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-prep"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'ADMIN']}>
              <InterviewPrep />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'ADMIN']}>
              <Roadmap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'ADMIN']}>
              <StudentAcademic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ec"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'ADMIN']}>
              <StudentEC />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'COUNSELOR', 'ADMIN']}>
              <DocumentVault />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/counselor"
          element={
            <ProtectedRoute allowedRoles={['COUNSELOR']}>
              <CounselorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={user ? (
          user.role.toUpperCase() === 'STUDENT' ? '/dashboard' : 
          user.role.toUpperCase() === 'PARENT' ? '/parent' : 
          user.role.toUpperCase() === 'COUNSELOR' ? '/counselor' : 
          '/admin/settings'
        ) : '/login'} replace />} />
      </Route>
    </Routes>
  );
};

export default App;
