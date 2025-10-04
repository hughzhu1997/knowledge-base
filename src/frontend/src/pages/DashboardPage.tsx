import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Database, FileText, Settings, Plus } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Knowledge Base System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.display_name || user?.username}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Welcome to Knowledge Base System</h3>
            <p className="mt-1 text-sm text-gray-500">
              Login successful! This is your dashboard homepage.
            </p>
            <div className="mt-6">
              {/* Quick Actions */}
              <div className="mb-8 text-center">
                <Link
                  to="/documents/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Document
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <User className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900">User Profile</h4>
                  <p className="mt-2 text-sm text-gray-500">View and manage your account information</p>
                </div>
                
                <Link to="/documents" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <FileText className="h-8 w-8 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900">My Documents</h4>
                  <p className="mt-2 text-sm text-gray-500">Manage your documents and knowledge base</p>
                </Link>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <Settings className="h-8 w-8 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900">System Settings</h4>
                  <p className="mt-2 text-sm text-gray-500">Configure system and preference settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
