import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { checkAuth } from './store/slices/authSlice';
import Login from './components/Auth/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import CreateEmployeePage from './pages/CreateEmployee';
import ManageEmployeesPage from './pages/ManageEmployees';
import ProcessPayrollPage from './pages/ProcessPayroll';
import ReportsPage from './pages/ReportsPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function AppContent() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/employee" 
          element={
            <ProtectedRoute roles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manager" 
          element={
            <ProtectedRoute roles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr" 
          element={
            <ProtectedRoute roles={['hr']}>
              <HRDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr/create-employee" 
          element={
            <ProtectedRoute roles={['hr']}>
              <CreateEmployeePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr/manage-employees" 
          element={
            <ProtectedRoute roles={['hr']}>
              <ManageEmployeesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr/process-payroll" 
          element={
            <ProtectedRoute roles={['hr']}>
              <ProcessPayrollPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr/reports" 
          element={
            <ProtectedRoute roles={['hr']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manager/create-employee" 
          element={
            <ProtectedRoute roles={['manager']}>
              <CreateEmployeePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;