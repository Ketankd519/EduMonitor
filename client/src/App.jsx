import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ProfilePage from './pages/shared/ProfilePage';
import ClassesPage from './pages/shared/ClassesPage';
import ClassroomView from './pages/shared/ClassroomView';
import AssignmentsPage from './pages/shared/AssignmentsPage';
import ExamView from './pages/student/ExamView';
import AttendancePage from './pages/shared/AttendancePage';
import AcademicRecordsPage from './pages/shared/AcademicRecordsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Common Authenticated Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/classroom/:classId" element={<ClassroomView />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/academic-records" element={<AcademicRecordsPage />} />

            {/* Student Pages */}
            <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/exam/:id" element={<ExamView />} />
            </Route>

            {/* Teacher Pages */}
            <Route element={<RoleRoute allowedRoles={['TEACHER']} />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;