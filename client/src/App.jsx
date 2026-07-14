import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Dashboard from './pages/admin/Dashboard';
import Tests from './pages/admin/Tests';
import CreateTest from './pages/admin/CreateTest';
import QuestionManager from './pages/admin/QuestionManager';
import Results from './pages/admin/Results';
import Attempts from './pages/admin/Attempts';
import Leaderboard from './pages/admin/Leaderboard';
import SecurityLogs from './pages/admin/SecurityLogs';
import Students from './pages/admin/Students';
import Settings from './pages/admin/Settings';

import AdminLayout from './layouts/AdminLayout';

import TestAccess from './pages/student/TestAccess';
import Instructions from './pages/student/Instructions';
import Exam from './pages/student/Exam';
import Result from './pages/student/Result';

const Guard = ({ children }) => {
  const { admin } = useAuth();

  return admin ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

const SuperAdminGuard = ({ children }) => {
  const { admin } = useAuth();

  const adminRole =
    admin?.role || admin?.adminRole;

  return adminRole === 'super_admin' ? (
    children
  ) : (
    <Navigate to="/admin" replace />
  );
};

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/test/:testCodeId"
        element={<TestAccess />}
      />

      <Route
        path="/test/:testCodeId/instructions"
        element={<Instructions />}
      />

      <Route
        path="/attempt/:attemptId"
        element={<Exam />}
      />

      <Route
        path="/attempt/:attemptId/result"
        element={<Result />}
      />

      <Route
        path="/admin"
        element={
          <Guard>
            <AdminLayout />
          </Guard>
        }
      >
        <Route
          index
          element={<Dashboard />}
        />

        <Route
          path="tests"
          element={<Tests />}
        />

        <Route
          path="create-test"
          element={<CreateTest />}
        />

        <Route
          path="questions"
          element={<QuestionManager />}
        />

        <Route
          path="attempts"
          element={<Attempts />}
        />

        <Route
          path="live"
          element={<Attempts />}
        />

        <Route
          path="results"
          element={<Results />}
        />

        <Route
          path="leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="students"
          element={<Students />}
        />

        <Route
          path="security"
          element={<SecurityLogs />}
        />

        <Route
          path="settings"
          element={
            <SuperAdminGuard>
              <Settings />
            </SuperAdminGuard>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate to="/admin" replace />
        }
      />
    </Routes>
  );
}