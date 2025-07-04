import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Clock, 
  GitBranch, 
  RotateCcw, 
  Eye, 
  Trash2,
  Plus,
  Save,
  Compare
} from 'lucide-react';

// Version History Component
const VersionHistory = ({ projectId, currentContent, onRestore, onSave }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionName, setVersionName] = useState('');

  // Load versions from localStorage (in real app, this would be from backend)
  useEffect(() => {
    const savedVersions = localStorage.getItem(`versions_${projectId}`);
    if (savedVersions) {
      setVersions(JSON.parse(savedVersions));
    }
  }, [projectId]);

  // Save versions to localStorage
  const saveVersions = (newVersions) => {
    localStorage.setItem(`versions_${projectId}`, JSON.stringify(newVersions));
    setVersions(newVersions);
  };

  // Create new version
  const createVersion = () => {
    if (!versionName.trim()) return;

    const newVersion = {
      id: Date.now().toString(),
      name: versionName,
      content: currentContent,
      timestamp: new Date().toISOString(),
      author: 'Raj Shah', // In real app, this would be current user
      changes: calculateChanges(versions[0]?.content || '', currentContent)
    };

    const updatedVersions = [newVersion, ...versions];
    saveVersions(updatedVersions);
    setVersionName('');
    setShowSaveDialog(false);
  };

  // Calculate changes between versions
  const calculateChanges = (oldContent, newContent) => {
    const oldWords = oldContent.split(' ').length;
    const newWords = newContent.split(' ').length;
    const wordDiff = newWords - oldWords;
    
    return {
      wordCount: newWords,
      wordDiff: wordDiff,
      type: wordDiff > 0 ? 'addition' : wordDiff < 0 ? 'deletion' : 'modification'
    };
  };

  // Delete version
  const deleteVersion = (versionId) => {
    const updatedVersions = versions.filter(v => v.id !== versionId);
    saveVersions(updatedVersions);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <History className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Version History</h3>
        </div>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Version</span>
        </button>
      </div>

      {/* Save Version Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600"
          >
            <h4 className="text-lg font-medium text-white mb-3">Save New Version</h4>
            <div className="flex space-x-3">
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="Version name (e.g., 'Added introduction')"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && createVersion()}
              />
              <button
                onClick={createVersion}
                disabled={!versionName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No versions saved yet</p>
            <p className="text-sm">Save your first version to start tracking changes</p>
          </div>
        ) : (
          versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedVersion?.id === version.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
              }`}
              onClick={() => setSelectedVersion(version)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <GitBranch className="h-4 w-4 text-blue-400" />
                    <h4 className="font-medium text-white">{version.name}</h4>
                    {index === 0 && (
                      <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(version.timestamp)}</span>
                    </div>
                    <span>by {version.author}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-300">
                      {version.changes.wordCount} words
                    </span>
                    {version.changes.wordDiff !== 0 && (
                      <span className={`flex items-center space-x-1 ${
                        version.changes.wordDiff > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span>{version.changes.wordDiff > 0 ? '+' : ''}{version.changes.wordDiff}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVersion(version);
                      setIsComparing(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(version.content);
                    }}
                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                    title="Restore"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  
                  {index !== 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVersion(version.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Version Preview Modal */}
      <AnimatePresence>
        {selectedVersion && isComparing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsComparing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Version: {selectedVersion.name}
                </h3>
                <button
                  onClick={() => setIsComparing(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
                  {selectedVersion.content}
                </pre>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsComparing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onRestore(selectedVersion.content);
                    setIsComparing(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Restore This Version
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VersionHistory;

