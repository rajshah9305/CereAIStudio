import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Code, 
  FileText, 
  Palette, 
  Send, 
  Settings, 
  Moon, 
  Sun, 
  Zap,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
  Brain,
  History,
  Users,
  Search,
  Filter
} from 'lucide-react';
import './App.css';

// Import advanced components
import VersionHistory from './components/VersionHistory';
import CollaborativeEditor from './components/CollaborativeEditor';
import AISuggestions from './components/AISuggestions';
import AdvancedSearch from './components/AdvancedSearch';

// Enhanced Platform Configuration
const platforms = [
  {
    id: 'text',
    name: 'Text Generation',
    description: 'Generate high-quality text content with AI',
    icon: MessageSquare,
    placeholder: 'Write a blog post about sustainable technology...',
    gradient: 'from-blue-500 to-purple-600',
    color: '#0066FF'
  },
  {
    id: 'code',
    name: 'Code Assistant',
    description: 'Generate, debug, and explain code',
    icon: Code,
    placeholder: 'Create a React component for a user profile card...',
    gradient: 'from-green-500 to-teal-600',
    color: '#10B981'
  },
  {
    id: 'document',
    name: 'Document AI',
    description: 'Create professional documents and reports',
    icon: FileText,
    placeholder: 'Create a project proposal for a mobile app...',
    gradient: 'from-orange-500 to-red-600',
    color: '#F59E0B'
  },
  {
    id: 'creative',
    name: 'Creative Writing',
    description: 'Generate creative stories and content',
    icon: Palette,
    placeholder: 'Write a short story about time travel...',
    gradient: 'from-pink-500 to-purple-600',
    color: '#EC4899'
  }
];

// Enhanced Button Component
const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 hover:brightness-110 active:scale-95 shadow-lg hover:shadow-xl',
    secondary: 'border-2 border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500 hover:text-white',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-800'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
    icon: 'p-3 rounded-xl'
  };
  
  return (
    <motion.button
      whileHover={{ scale: variant === 'primary' ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Enhanced Card Component
const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className={`bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Enhanced Message Bubble Component
const MessageBubble = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[80%] rounded-2xl p-4 ${
        isUser 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' 
          : 'bg-gray-800/70 text-gray-100 rounded-bl-md border border-gray-700/50'
      }`}>
        <div className="whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block w-2 h-4 ml-1 bg-current"
            />
          )}
        </div>
        
        {!isUser && !isStreaming && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-600/50">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Platform Selector Component
const PlatformSelector = ({ currentPlatform, onPlatformChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isActive = currentPlatform === platform.id;
        
        return (
          <motion.button
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
              isActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 group-hover:bg-gray-600'
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className={`font-semibold transition-colors ${
                isActive ? 'text-blue-400' : 'text-white'
              }`}>
                {platform.name}
              </h3>
            </div>
            <p className="text-sm text-gray-400">
              {platform.description}
            </p>
            
            {isActive && (
              <motion.div
                className="absolute inset-0 border-2 border-blue-500 rounded-2xl"
                layoutId="active-platform"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// Enhanced Header Component
const Header = ({ theme, onToggleTheme, onOpenSettings }) => {
  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CereStudio AI
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">
                1,800 tokens/sec
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={onToggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon">
              <History className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Enhanced Chat Interface Component
const ChatInterface = ({ currentPlatform }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const platform = platforms.find(p => p.id === currentPlatform);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    setStreamedContent('');

    // Simulate AI response with streaming
    const response = `This is a simulated AI response for the ${platform.name} platform. In a real implementation, this would connect to the Cerebras API and stream the actual response. The response would be tailored to the specific platform and user input.`;
    
    let currentContent = '';
    for (let i = 0; i < response.length; i++) {
      currentContent += response[i];
      setStreamedContent(currentContent);
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setStreamedContent('');
    setIsGenerating(false);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
        </AnimatePresence>

        {/* Streaming Message */}
        {isGenerating && streamedContent && (
          <MessageBubble
            message={{ role: 'assistant', content: streamedContent }}
            isStreaming
          />
        )}

        {/* Loading Indicator */}
        {isGenerating && !streamedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50"
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 bg-blue-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              AI is thinking...
            </span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Form */}
      <div className="border-t border-gray-800 p-6 bg-gray-900/50 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={platform?.placeholder || 'Type your message...'}
              className="w-full min-h-[80px] max-h-[200px] p-4 pr-16 bg-gray-800/50 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none backdrop-blur-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isGenerating}
              className="absolute bottom-3 right-3 h-10 w-10"
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Model: Llama 3.1 8B</span>
              <span>•</span>
              <span>Max tokens: 1000</span>
            </div>
            
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessages([])}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Import advanced components
import VersionHistory from './components/VersionHistory';
import CollaborativeEditor from './components/CollaborativeEditor';
import AISuggestions from './components/AISuggestions';
import AdvancedSearch from './components/AdvancedSearch';

// Enhanced Sidebar Component
const Sidebar = ({ isOpen, onClose, activeFeature, onFeatureSelect }) => {
  const features = [
    { id: 'history', name: 'Version History', icon: History, color: 'text-blue-400', description: 'Track and revert changes' },
    { id: 'collaboration', name: 'Collaboration', icon: Users, color: 'text-green-400', description: 'Real-time editing' },
    { id: 'suggestions', name: 'AI Suggestions', icon: Brain, color: 'text-purple-400', description: 'Smart optimizations' },
    { id: 'search', name: 'Advanced Search', icon: Search, color: 'text-orange-400', description: 'Filter and find content' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 z-50 lg:relative lg:translate-x-0"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Advanced Features</h2>
              
              <div className="space-y-4">
                {features.map(feature => {
                  const Icon = feature.icon;
                  const isActive = activeFeature === feature.id;
                  
                  return (
                    <Card 
                      key={feature.id}
                      hover 
                      className={`p-4 cursor-pointer transition-all ${
                        isActive ? 'border-blue-500 bg-blue-500/10' : ''
                      }`}
                      onClick={() => onFeatureSelect(feature.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                        <div>
                          <h3 className="font-medium text-white">{feature.name}</h3>
                          <p className="text-sm text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Main App Component
function App() {
  const [currentPlatform, setCurrentPlatform] = useState('text');
  const [theme, setTheme] = useState('dark');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        <Header 
          theme={theme} 
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 space-y-8">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Choose Your Creative Platform
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400"
                >
                  Experience the world's fastest AI content generation
                </motion.p>
              </div>
              
              <PlatformSelector 
                currentPlatform={currentPlatform}
                onPlatformChange={setCurrentPlatform}
              />
            </div>

            <div className="flex-1 mx-6 mb-6">
              <Card className="h-full flex flex-col">
                <ChatInterface currentPlatform={currentPlatform} />
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

