import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudents } from './pages/admin/AdminStudents.tsx';
import { AdminLecturers } from './pages/admin/AdminLecturers.tsx';
import { AdminCourses } from './pages/admin/AdminCourses.tsx';
import { AdminEnrollments } from './pages/admin/AdminEnrollments.tsx';
import { AdminGrades } from './pages/admin/AdminGrades.tsx';
import { AdminTranscripts } from './pages/admin/AdminTranscripts.tsx';
import { AdminUserProvision } from './pages/admin/AdminUserProvision';
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard.tsx';
import { LecturerCourses } from './pages/lecturer/LecturerCourses.tsx';
import { LecturerGradeSubmission } from './pages/lecturer/LecturerGradeSubmission.tsx';
import { LecturerVerification } from './pages/lecturer/LecturerVerification.tsx';
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { StudentCourses } from './pages/student/StudentCourses.tsx';
import { StudentGrades } from './pages/student/StudentGrades.tsx';
import { StudentTranscripts } from './pages/student/StudentTranscripts.tsx';
import { useAuthStore } from './stores/authStore';

function App() {
  const { isAdmin, isLecturer, isStudent } = useAuthStore();

  const getDefaultRoute = () => {
    if (isAdmin()) return '/admin';
    if (isLecturer()) return '/lecturer';
    if (isStudent()) return '/student';
    return '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="lecturers" element={<AdminLecturers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="grades" element={<AdminGrades />} />
          <Route path="transcripts" element={<AdminTranscripts />} />
          <Route path="provision" element={<AdminUserProvision />} />
        </Route>

        {/* Protected Lecturer Routes */}
        <Route
          path="/lecturer"
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LecturerDashboard />} />
          <Route path="courses" element={<LecturerCourses />} />
          <Route path="grades" element={<LecturerGradeSubmission />} />
          <Route path="verify" element={<LecturerVerification />} />
        </Route>

        {/* Protected Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="transcripts" element={<StudentTranscripts />} />
        </Route>
        {/* Default Route */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
