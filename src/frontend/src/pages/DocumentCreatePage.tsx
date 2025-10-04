import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TagSelector } from '../components/TagSelector';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle
} from 'lucide-react';

interface CreateResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    content: string;
    status: string;
    author_id: string;
    created_at: string;
    updated_at: string;
    version: number;
  };
  message: string;
}

export const DocumentCreatePage: React.FC = () => {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  // Create document
  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          status: formData.status,
          category: 'General',
          doc_type: 'General',
          visibility: 'private',
          tags: selectedTags
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CreateResponse = await response.json();
      
      if (data.success) {
        // Navigate to the newly created document
        navigate(`/documents/${data.data.id}`);
      } else {
        throw new Error(data.message || 'Failed to create document');
      }
    } catch (err) {
      console.error('Error creating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  // Check for unsaved changes before leaving
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/documents"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                title="Back to Documents"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Document</h1>
                <p className="mt-1 text-gray-600">Start writing your knowledge base entry</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !formData.title.trim() || !formData.content.trim()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Creating...' : 'Create Document'}
            </button>
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
                autoFocus
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose a clear, descriptive title for your document.
              </p>
            </div>

            {/* Document Status */}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft - Work in progress</option>
                <option value="published">Published - Ready to share</option>
                <option value="archived">Archived - Hidden from public view</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                You can change the status later. Draft is recommended for new documents.
              </p>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={(tags) => {
                  setSelectedTags(tags);
                  setHasChanges(true);
                }}
                token={tokens?.access_token}
              />
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
                placeholder="Start writing your document content here..."
              />
              <div className="mt-1 flex justify-between text-sm text-gray-500">
                <p>{formData.content.length} characters</p>
                <p>Minimum 10 characters required</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Link
              to="/documents"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.title.trim() || !formData.content.trim() || formData.content.length < 10}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Creating...' : 'Create Document'}
            </button>
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
                  <p>You have unsaved changes. Make sure to create your document before leaving this page.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Writing Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Structure Your Content</h4>
              <ul className="space-y-1">
                <li>• Use clear headings and subheadings</li>
                <li>• Break content into logical sections</li>
                <li>• Use bullet points for lists</li>
                <li>• Include examples when helpful</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="space-y-1">
                <li>• Write in a clear, concise style</li>
                <li>• Use consistent terminology</li>
                <li>• Include relevant context</li>
                <li>• Review before publishing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
