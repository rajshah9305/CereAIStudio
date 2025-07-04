import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  User, 
  FileText, 
  Code, 
  Palette, 
  MessageSquare,
  SortAsc,
  SortDesc,
  X,
  Clock,
  Star,
  Download,
  Eye
} from 'lucide-react';

// Mock content data
const mockContent = [
  {
    id: '1',
    title: 'Modern Landing Page Design',
    content: 'Create a stunning landing page with modern design principles...',
    platform: 'text',
    author: 'Raj Shah',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    tags: ['design', 'landing-page', 'modern'],
    wordCount: 1250,
    rating: 4.8,
    views: 156,
    downloads: 23
  },
  {
    id: '2',
    title: 'React Component Library',
    content: 'Building a comprehensive React component library...',
    platform: 'code',
    author: 'Raj Shah',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
    tags: ['react', 'components', 'library'],
    wordCount: 2100,
    rating: 4.9,
    views: 234,
    downloads: 45
  },
  {
    id: '3',
    title: 'Project Proposal Template',
    content: 'Professional project proposal template for startups...',
    platform: 'document',
    author: 'Sarah Chen',
    createdAt: '2024-01-13T11:20:00Z',
    updatedAt: '2024-01-13T15:30:00Z',
    tags: ['proposal', 'template', 'business'],
    wordCount: 1800,
    rating: 4.7,
    views: 189,
    downloads: 67
  },
  {
    id: '4',
    title: 'Sci-Fi Short Story',
    content: 'A thrilling tale of time travel and parallel dimensions...',
    platform: 'creative',
    author: 'Mike Johnson',
    createdAt: '2024-01-12T14:45:00Z',
    updatedAt: '2024-01-12T18:20:00Z',
    tags: ['sci-fi', 'time-travel', 'story'],
    wordCount: 3200,
    rating: 4.6,
    views: 298,
    downloads: 89
  },
  {
    id: '5',
    title: 'API Documentation Guide',
    content: 'Complete guide for writing clear API documentation...',
    platform: 'document',
    author: 'Lisa Wang',
    createdAt: '2024-01-11T08:30:00Z',
    updatedAt: '2024-01-11T12:15:00Z',
    tags: ['api', 'documentation', 'guide'],
    wordCount: 2800,
    rating: 4.9,
    views: 445,
    downloads: 123
  }
];

// Advanced Search Component
const AdvancedSearch = ({ onSelectContent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    platform: 'all',
    author: 'all',
    dateRange: 'all',
    tags: [],
    minRating: 0,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  const [content] = useState(mockContent);
  const [selectedTags, setSelectedTags] = useState([]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    content.forEach(item => {
      item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [content]);

  // Get all unique authors
  const allAuthors = useMemo(() => {
    const authors = new Set();
    content.forEach(item => authors.add(item.author));
    return Array.from(authors);
  }, [content]);

  // Filter and search content
  const filteredContent = useMemo(() => {
    let filtered = content;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Platform filter
    if (filters.platform !== 'all') {
      filtered = filtered.filter(item => item.platform === filters.platform);
    }

    // Author filter
    if (filters.author !== 'all') {
      filtered = filtered.filter(item => item.author === filters.author);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.every(tag => item.tags.includes(tag))
      );
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(item => item.rating >= filters.minRating);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.updatedAt) >= cutoffDate);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];
      
      if (filters.sortBy === 'updatedAt' || filters.sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [content, searchQuery, filters, selectedTags]);

  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      platform: 'all',
      author: 'all',
      dateRange: 'all',
      tags: [],
      minRating: 0,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
    setSelectedTags([]);
    setSearchQuery('');
  };

  // Get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'text': return MessageSquare;
      case 'code': return Code;
      case 'document': return FileText;
      case 'creative': return Palette;
      default: return FileText;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Search className="h-6 w-6 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">Content Library</h3>
          <span className="px-2 py-1 text-xs bg-orange-600 text-white rounded-full">
            {filteredContent.length} items
          </span>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            showFilters ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search content, titles, tags..."
          className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Platform Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                <select
                  value={filters.platform}
                  onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Platforms</option>
                  <option value="text">Text Generation</option>
                  <option value="code">Code Assistant</option>
                  <option value="document">Document AI</option>
                  <option value="creative">Creative Writing</option>
                </select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Author</label>
                <select
                  value={filters.author}
                  onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Authors</option>
                  {allAuthors.map(author => (
                    <option key={author} value={author}>{author}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Rating: {filters.minRating}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Created Date</option>
                  <option value="rating">Rating</option>
                  <option value="views">Views</option>
                  <option value="downloads">Downloads</option>
                  <option value="wordCount">Word Count</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
                >
                  {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  <span>{filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Results */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredContent.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No content found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredContent.map((item, index) => {
            const PlatformIcon = getPlatformIcon(item.platform);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-700/30 rounded-xl border border-gray-600 hover:border-gray-500 transition-all cursor-pointer"
                onClick={() => onSelectContent(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <PlatformIcon className="h-5 w-5 text-orange-400" />
                      <h4 className="font-medium text-white">{item.title}</h4>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-300">{item.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {item.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{item.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(item.updatedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{item.wordCount} words</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{item.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{item.downloads}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;

