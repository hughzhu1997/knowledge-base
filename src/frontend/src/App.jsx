import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentManagement from './pages/DocumentManagement';
import DocumentCreate from './pages/DocumentCreate';
import DocumentEdit from './pages/DocumentEdit';
import DocumentDetail from './pages/DocumentDetail';
import UserManagementIAM from './pages/UserManagementIAM';
import UnderConstruction from './pages/UnderConstruction';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <DocumentManagement />
                </ProtectedRoute>
              } />
              <Route path="/documents/new" element={
                <ProtectedRoute>
                  <DocumentCreate />
                </ProtectedRoute>
              } />
              <Route path="/documents/:id" element={
                <ProtectedRoute>
                  <DocumentDetail />
                </ProtectedRoute>
              } />
              <Route path="/documents/:id/edit" element={
                <ProtectedRoute>
                  <DocumentEdit />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <UserManagementIAM />
                </ProtectedRoute>
              } />
              
              {/* Under construction pages */}
              <Route path="/search" element={<UnderConstruction pageName="搜索功能" />} />
              <Route path="/features" element={<UnderConstruction pageName="功能页面" />} />
              <Route path="/pricing" element={<UnderConstruction pageName="定价页面" />} />
              <Route path="/api" element={<UnderConstruction pageName="API文档" />} />
              <Route path="/debug" element={<UnderConstruction pageName="调试页面" />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;