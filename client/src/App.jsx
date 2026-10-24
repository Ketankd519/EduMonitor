import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import HomePage from './pages/public/HomePage';
import About from './pages/public/About'; 
import Features from './pages/public/Features';
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
import LiveClassRoom from './pages/shared/LiveClassRoom';
import MonitoringReportsPage from './pages/teacher/MonitoringReportsPage';
import StudentProgressPage from './pages/student/StudentProgressPage';
import { SidebarProvider } from './context/SidebarContext';
import { LiveTickerProvider } from './context/LiveTickerContext';

function App() {
  return (
      <Router>
        <SidebarProvider>
          <LiveTickerProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/classroom/:classId" element={<ClassroomView />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/academic-records" element={<AcademicRecordsPage />} />
                <Route path="/live-class/:classId" element={<LiveClassRoom />} />

                <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/exam/:id" element={<ExamView />} />
                  <Route path="/progress" element={<StudentProgressPage />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['TEACHER']} />}>
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                  <Route path="/monitoring-reports" element={<MonitoringReportsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LiveTickerProvider>
        </SidebarProvider>
      </Router>
  );
}

export default App;