import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  FileText,
  Clock
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

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tokens } = useAuth();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          throw new Error('You do not have permission to view this document');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data: DocumentResponse = await response.json();
      
      if (data.success) {
        setDocument(data.data);
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

  // Delete document
  const handleDelete = async () => {
    if (!document) return;

    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      
      const response = await fetch(`http://localhost:3000/api/documents/${document.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Navigate back to documents list
        navigate('/documents');
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDocument();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return '✅';
      case 'draft': return '📝';
      case 'archived': return '📦';
      default: return '📄';
    }
  };

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
          <p className="text-gray-600 mb-4">The document you're looking for doesn't exist.</p>
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
                to="/documents"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                title="Back to Documents"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
                    {getStatusIcon(document.status)} {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Version {document.version}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/documents/${document.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Document Metadata */}
          <div className="border-b border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Document Information</h3>
                <dl className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <dt className="text-sm font-medium text-gray-500">Author:</dt>
                    <dd className="ml-2 text-sm text-gray-900">
                      {document.author.display_name || document.author.username}
                    </dd>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <dt className="text-sm font-medium text-gray-500">Created:</dt>
                    <dd className="ml-2 text-sm text-gray-900">
                      {formatDate(document.created_at)}
                    </dd>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-3" />
                    <dt className="text-sm font-medium text-gray-500">Last Updated:</dt>
                    <dd className="ml-2 text-sm text-gray-900">
                      {formatDate(document.updated_at)}
                    </dd>
                  </div>
                </dl>
              </div>
              
              {document.tags && document.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Content */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Content</h3>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                {document.content}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between">
          <Link
            to="/documents"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
          <div className="flex space-x-3">
            <Link
              to={`/documents/${document.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Document
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
