import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Lightbulb, 
  Zap, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

// AI Suggestions Component
const AISuggestions = ({ content, platform, onApplySuggestion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());

  // Generate AI suggestions based on content and platform
  const generateSuggestions = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const platformSuggestions = {
      text: [
        {
          id: '1',
          type: 'improvement',
          title: 'Enhance Readability',
          description: 'Break down long paragraphs into shorter, more digestible chunks',
          impact: 'high',
          confidence: 0.92,
          preview: 'Split the 150-word paragraph into 3 focused sections',
          category: 'Structure'
        },
        {
          id: '2',
          type: 'optimization',
          title: 'Add Call-to-Action',
          description: 'Include a compelling call-to-action to increase engagement',
          impact: 'medium',
          confidence: 0.85,
          preview: 'Add "Ready to transform your workflow?" at the end',
          category: 'Engagement'
        },
        {
          id: '3',
          type: 'enhancement',
          title: 'Strengthen Opening',
          description: 'Start with a more compelling hook to capture attention',
          impact: 'high',
          confidence: 0.88,
          preview: 'Replace generic opening with a thought-provoking question',
          category: 'Impact'
        }
      ],
      code: [
        {
          id: '4',
          type: 'optimization',
          title: 'Performance Optimization',
          description: 'Use React.memo to prevent unnecessary re-renders',
          impact: 'high',
          confidence: 0.94,
          preview: 'Wrap component with React.memo for better performance',
          category: 'Performance'
        },
        {
          id: '5',
          type: 'improvement',
          title: 'Error Handling',
          description: 'Add try-catch blocks for better error management',
          impact: 'medium',
          confidence: 0.87,
          preview: 'Wrap async operations in try-catch blocks',
          category: 'Reliability'
        },
        {
          id: '6',
          type: 'enhancement',
          title: 'Type Safety',
          description: 'Add TypeScript interfaces for better type checking',
          impact: 'medium',
          confidence: 0.91,
          preview: 'Define interfaces for props and state objects',
          category: 'Quality'
        }
      ],
      document: [
        {
          id: '7',
          type: 'improvement',
          title: 'Executive Summary',
          description: 'Add an executive summary for better overview',
          impact: 'high',
          confidence: 0.89,
          preview: 'Include 2-3 paragraph summary at the beginning',
          category: 'Structure'
        },
        {
          id: '8',
          type: 'enhancement',
          title: 'Visual Elements',
          description: 'Include charts or diagrams to support key points',
          impact: 'medium',
          confidence: 0.83,
          preview: 'Add flowchart for the proposed process',
          category: 'Clarity'
        }
      ],
      creative: [
        {
          id: '9',
          type: 'enhancement',
          title: 'Character Development',
          description: 'Deepen character motivations and backstory',
          impact: 'high',
          confidence: 0.86,
          preview: 'Add internal monologue to reveal character thoughts',
          category: 'Depth'
        },
        {
          id: '10',
          type: 'improvement',
          title: 'Sensory Details',
          description: 'Include more sensory descriptions for immersion',
          impact: 'medium',
          confidence: 0.84,
          preview: 'Add sounds, smells, and textures to the scene',
          category: 'Immersion'
        }
      ]
    };

    setSuggestions(platformSuggestions[platform] || []);
    setIsAnalyzing(false);
  };

  // Auto-generate suggestions when content changes
  useEffect(() => {
    if (content && content.length > 50) {
      const debounceTimer = setTimeout(() => {
        generateSuggestions();
      }, 1000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [content, platform]);

  // Apply suggestion
  const applySuggestion = (suggestion) => {
    onApplySuggestion(suggestion);
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  // Dismiss suggestion
  const dismissSuggestion = (suggestionId) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  // Get impact color
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'improvement': return TrendingUp;
      case 'optimization': return Zap;
      case 'enhancement': return Sparkles;
      default: return Lightbulb;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">AI Suggestions</h3>
          {suggestions.length > 0 && (
            <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
              {suggestions.length} suggestions
            </span>
          )}
        </div>
        
        <button
          onClick={generateSuggestions}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 bg-purple-500 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-purple-300">AI is analyzing your content...</span>
          </div>
        </motion.div>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.length === 0 && !isAnalyzing ? (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No suggestions available</p>
            <p className="text-sm">Write some content to get AI-powered suggestions</p>
          </div>
        ) : (
          <AnimatePresence>
            {suggestions.map((suggestion, index) => {
              const TypeIcon = getTypeIcon(suggestion.type);
              const isApplied = appliedSuggestions.has(suggestion.id);
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isApplied 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <TypeIcon className="h-5 w-5 text-purple-400" />
                        <h4 className="font-medium text-white">{suggestion.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </span>
                        <span className="text-xs text-gray-400">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{suggestion.description}</p>
                      
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-400">Preview</span>
                        </div>
                        <p className="text-sm text-gray-300 italic">{suggestion.preview}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded-full">
                          {suggestion.category}
                        </span>
                        
                        {isApplied ? (
                          <div className="flex items-center space-x-2 text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Applied</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => dismissSuggestion(suggestion.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Dismiss"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => applySuggestion(suggestion)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <span>Apply</span>
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Suggestion Stats */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-gray-700/30 rounded-xl"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">
                  {appliedSuggestions.size} applied
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="text-gray-300">
                  {suggestions.length - appliedSuggestions.size} pending
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-400">
              <span>Powered by</span>
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-purple-400 font-medium">CereStudio AI</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AISuggestions;

