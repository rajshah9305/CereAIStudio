import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Send, 
  Eye, 
  Edit3,
  Crown,
  Circle,
  Share2,
  Link,
  Copy
} from 'lucide-react';

// Mock user data
const mockUsers = [
  { id: '1', name: 'Raj Shah', email: 'raj@cerestudio.ai', role: 'owner', avatar: '👨‍💻', color: '#3B82F6', isOnline: true },
  { id: '2', name: 'Sarah Chen', email: 'sarah@company.com', role: 'editor', avatar: '👩‍🎨', color: '#10B981', isOnline: true },
  { id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'viewer', avatar: '👨‍💼', color: '#F59E0B', isOnline: false },
  { id: '4', name: 'Lisa Wang', email: 'lisa@company.com', role: 'editor', avatar: '👩‍🔬', color: '#EF4444', isOnline: true }
];

// Collaborative Editor Component
const CollaborativeEditor = ({ projectId, content, onChange }) => {
  const [collaborators, setCollaborators] = useState(mockUsers);
  const [activeUsers, setActiveUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [cursors, setCursors] = useState({});
  const editorRef = useRef(null);

  // Simulate real-time collaboration
  useEffect(() => {
    // Simulate active users
    const onlineUsers = collaborators.filter(user => user.isOnline);
    setActiveUsers(onlineUsers);

    // Generate share link
    setShareLink(`https://cerestudio.ai/project/${projectId}/collaborate`);

    // Simulate cursor positions
    const interval = setInterval(() => {
      const newCursors = {};
      onlineUsers.forEach(user => {
        if (user.id !== '1') { // Not the current user (Raj)
          newCursors[user.id] = {
            position: Math.floor(Math.random() * (content?.length || 100)),
            user: user
          };
        }
      });
      setCursors(newCursors);
    }, 3000);

    return () => clearInterval(interval);
  }, [collaborators, projectId, content]);

  // Load comments from localStorage
  useEffect(() => {
    const savedComments = localStorage.getItem(`comments_${projectId}`);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, [projectId]);

  // Save comments to localStorage
  const saveComments = (newComments) => {
    localStorage.setItem(`comments_${projectId}`, JSON.stringify(newComments));
    setComments(newComments);
  };

  // Add comment
  const addComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      author: collaborators[0], // Current user (Raj)
      timestamp: new Date().toISOString(),
      resolved: false
    };

    const updatedComments = [...comments, comment];
    saveComments(updatedComments);
    setNewComment('');
  };

  // Resolve comment
  const resolveComment = (commentId) => {
    const updatedComments = comments.map(comment =>
      comment.id === commentId ? { ...comment, resolved: true } : comment
    );
    saveComments(updatedComments);
  };

  // Invite collaborator
  const inviteCollaborator = () => {
    if (!inviteEmail.trim()) return;

    // Simulate sending invitation
    const newUser = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: 'editor',
      avatar: '👤',
      color: '#8B5CF6',
      isOnline: false
    };

    setCollaborators([...collaborators, newUser]);
    setInviteEmail('');
    setShowInviteDialog(false);
  };

  // Copy share link
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      // Show success feedback
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Collaboration Header */}
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Collaboration</h3>
            <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">
              {activeUsers.length} online
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comments ({comments.filter(c => !c.resolved).length})</span>
            </button>
            
            <button
              onClick={() => setShowInviteDialog(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite</span>
            </button>
          </div>
        </div>

        {/* Active Collaborators */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">Active now:</span>
          <div className="flex items-center space-x-2">
            {activeUsers.map(user => (
              <div
                key={user.id}
                className="relative flex items-center space-x-2 px-3 py-2 bg-gray-700/50 rounded-lg"
              >
                <div className="relative">
                  <span className="text-lg">{user.avatar}</span>
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800"
                    style={{ backgroundColor: user.color }}
                  />
                </div>
                <div className="text-sm">
                  <div className="text-white font-medium">{user.name}</div>
                  <div className="text-gray-400 text-xs flex items-center space-x-1">
                    {user.role === 'owner' && <Crown className="h-3 w-3" />}
                    {user.role === 'editor' && <Edit3 className="h-3 w-3" />}
                    {user.role === 'viewer' && <Eye className="h-3 w-3" />}
                    <span>{user.role}</span>
                  </div>
                </div>
                {user.isOnline && (
                  <div className="absolute top-1 right-1">
                    <Circle className="h-2 w-2 fill-green-400 text-green-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <h4 className="text-lg font-semibold text-white mb-4">Comments & Feedback</h4>
            
            {/* Add Comment */}
            <div className="mb-6">
              <div className="flex space-x-3">
                <span className="text-lg">{collaborators[0].avatar}</span>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="3"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      <span>Comment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                </div>
              ) : (
                comments.map(comment => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex space-x-3 p-3 rounded-lg ${
                      comment.resolved ? 'bg-gray-700/30 opacity-60' : 'bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg">{comment.author.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white">{comment.author.name}</span>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                        {comment.resolved && (
                          <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{comment.text}</p>
                      {!comment.resolved && (
                        <button
                          onClick={() => resolveComment(comment.id)}
                          className="mt-2 text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          Mark as resolved
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Dialog */}
      <AnimatePresence>
        {showInviteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInviteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Invite Collaborator</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && inviteCollaborator()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Share Link
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 text-sm"
                    />
                    <button
                      onClick={copyShareLink}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteDialog(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={inviteCollaborator}
                  disabled={!inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaborativeEditor;

