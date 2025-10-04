import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  author: {
    username: string;
    display_name?: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  created_at: string;
  updated_at: string;
  version: number;
}

interface DocumentResponse {
  success: boolean;
  data: Document;
}

interface UpdateResponse {
  success: boolean;
  data: Document;
  message: string;
}

export const DocumentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tokens } = useAuth();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch document details
  const fetchDocument = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to edit this document');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data: DocumentResponse = await response.json();
      
      if (data.success) {
        setDocument(data.data);
        setFormData({
          title: data.data.title,
          content: data.data.content,
          status: data.data.status,
        });
      } else {
        throw new Error('Failed to fetch document');
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  // Save document
  const handleSave = async () => {
    if (!document) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`http://localhost:3000/api/documents/${document.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UpdateResponse = await response.json();
      
      if (data.success) {
        setDocument(data.data);
        setHasChanges(false);
        // Navigate to document detail page
        navigate(`/documents/${document.id}`);
      } else {
        throw new Error(data.message || 'Failed to update document');
      }
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Handle preview
  const handlePreview = () => {
    navigate(`/documents/${id}`);
  };

  // Initial load
  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Check for unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Error loading document</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={fetchDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              to="/documents"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
          <p className="text-gray-600 mb-4">The document you're trying to edit doesn't exist.</p>
          <Link
            to="/documents"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to={`/documents/${document.id}`}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                title="Back to Document"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Document</h1>
                <p className="mt-1 text-gray-600">Version {document.version}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* Document Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter document title..."
              />
            </div>

            {/* Document Status */}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Draft: Work in progress. Published: Visible to others. Archived: Hidden from public view.
              </p>
            </div>

            {/* Document Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter document content..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.content.length} characters
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Link
              to={`/documents/${document.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Link>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handlePreview}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Unsaved Changes</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You have unsaved changes. Make sure to save your work before leaving this page.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
