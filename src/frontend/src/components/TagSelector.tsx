import React, { useState, useEffect } from 'react';
import { Tag, X, Plus } from 'lucide-react';

interface TagData {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  token?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ 
  selectedTags, 
  onTagsChange, 
  token 
}) => {
  const [availableTags, setAvailableTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showCreateField, setShowCreateField] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available tags
  const fetchTags = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setAvailableTags(result.data.tags || []);
      } else {
        throw new Error('Failed to fetch tags');
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  // Create new tag
  const createTag = async () => {
    if (!token || !newTagName.trim()) return;
    
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          description: newTagName.trim()
        }),
      });

      if (response.status === 409) {
        const errorData = await response.json();
        if (errorData.error?.code === 'TAG_EXISTS') {
          // Tag already exists, use it
          const existingTag = availableTags.find(tag => 
            tag.name.toLowerCase() === newTagName.toLowerCase()
          );
          if (existingTag && !selectedTags.includes(existingTag.name)) {
            onTagsChange([...selectedTags, existingTag.name]);
          }
          setNewTagName('');
          setShowCreateField(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to create tag: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Add the new tag to available tags and select it
        const newTag = result.data.tag;
        setAvailableTags(prev => [...prev, newTag]);
        if (!selectedTags.includes(newTag.name)) {
          onTagsChange([...selectedTags, newTag.name]);
        }
        setNewTagName('');
        setShowCreateField(false);
      } else {
        throw new Error('Failed to create tag');
      }
    } catch (err) {
      console.error('Error creating tag:', err);
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    }
  };

  // Handle tag selection
  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  // Handle tag removal
  const handleTagRemove = (tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName));
  };

  // Handle key press for create tag
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createTag();
    } else if (e.key === 'Escape') {
      setShowCreateField(false);
      setNewTagName('');
    }
  };

  useEffect(() => {
    fetchTags();
  }, [token]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Tags
      </label>
      
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagName) => (
            <span
              key={tagName}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tagName}
              <button
                type="button"
                onClick={() => handleTagRemove(tagName)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available Tags */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Available Tags
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
            {availableTags
              .filter(tag => !selectedTags.includes(tag.name))
              .map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagSelect(tag.name)}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300"
                  title={tag.description}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Create New Tag */}
      <div>
        {showCreateField ? (
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter new tag name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={createTag}
              disabled={!newTagName.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateField(false);
                setNewTagName('');
              }}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreateField(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Tag
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="text-sm text-gray-500">
          Loading tags...
        </div>
      )}
    </div>
  );
};
