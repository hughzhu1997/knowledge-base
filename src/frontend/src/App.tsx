import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { DocumentEditPage } from './pages/DocumentEditPage';
import { DocumentCreatePage } from './pages/DocumentCreatePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Document Management Routes */}
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/create" 
            element={
              <ProtectedRoute>
                <DocumentCreatePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/:id" 
            element={
              <ProtectedRoute>
                <DocumentDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/:id/edit" 
            element={
              <ProtectedRoute>
                <DocumentEditPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;