// ================================
// COMPONENTS/PLATFORM-SELECTOR.TSX - Platform Selection
// ================================
import React from 'react';
import { motion } from 'framer-motion';
import { platforms } from '@/lib/platforms';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function PlatformSelector() {
  const { currentPlatform, setCurrentPlatform } = useAppStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isActive = currentPlatform === platform.id;

        return (
          <motion.button
            key={platform.id}
            onClick={() => setCurrentPlatform(platform.id)}
            className={cn(
              'group relative p-6 rounded-xl border-2 transition-all duration-200 text-left',
              isActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3
                className={cn(
                  'font-semibold transition-colors',
                  isActive
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-900 dark:text-white'
                )}
              >
                {platform.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {platform.description}
            </p>
            {isActive && (
              <motion.div
                className="absolute inset-0 border-2 border-primary-500 rounded-xl"
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
}

// ================================
// COMPONENTS/CHAT-INTERFACE.TSX - Main Chat Interface
// ================================
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading, LoadingDots } from '@/components/ui/loading';
import { useAppStore } from '@/lib/store';
import { cerebrasClient } from '@/lib/cerebras';
import { getPlatformById } from '@/lib/platforms';
import { copyToClipboard, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ChatInterface() {
  const {
    currentPlatform,
    settings,
    messages,
    addMessage,
    clearMessages,
    isGenerating,
    setIsGenerating,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [streamedContent, setStreamedContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const platform = getPlatformById(currentPlatform);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isGenerating) return;
    
    if (!settings.apiKey) {
      toast.error('Please set your Cerebras API key in settings');
      return;
    }

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
    };

    addMessage(userMessage);
    setInput('');
    setIsGenerating(true);
    setStreamedContent('');

    try {
      cerebrasClient.setApiKey(settings.apiKey);

      // Prepare the prompt with system message
      const systemPrompt = platform?.systemPrompt || 'You are a helpful AI assistant.';
      const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage.content}`;

      const streamGenerator = cerebrasClient.generateStream({
        prompt: fullPrompt,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of streamGenerator) {
        fullResponse += chunk;
        setStreamedContent(fullResponse);
      }

      // Add the complete response to messages
      addMessage({
        role: 'assistant',
        content: fullResponse,
      });

      setStreamedContent('');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate response');
      
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating the response. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await copyToClipboard(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cerestudio-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Content downloaded');
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              onCopy={handleCopy}
              onDownload={handleDownload}
            />
          ))}
        </AnimatePresence>

        {/* Streaming Message */}
        {isGenerating && streamedContent && (
          <MessageBubble
            message={{ role: 'assistant', content: streamedContent }}
            isStreaming
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        )}

        {/* Loading Indicator */}
        {isGenerating && !streamedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <LoadingDots />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Generating response...
            </span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={platform?.placeholder || 'Type your message...'}
              className="w-full min-h-[80px] max-h-[200px] p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
              className="absolute bottom-3 right-3 h-8 w-8"
            >
              {isGenerating ? (
                <Loading size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Model: {settings.model}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Max tokens: {settings.maxTokens}
              </span>
            </div>
            
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
}

// ================================
// COMPONENTS/MESSAGE-BUBBLE.TSX - Individual Message Component
// ================================
interface MessageBubbleProps {
  message: { role: 'user' | 'assistant'; content: string };
  isStreaming?: boolean;
  onCopy: (content: string) => void;
  onDownload: (content: string) => void;
}

function MessageBubble({ message, isStreaming, onCopy, onDownload }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-4 shadow-sm',
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-sans">
            {message.content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block w-2 h-4 ml-1 bg-current"
              />
            )}
          </pre>
        </div>

        {!isUser && !isStreaming && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(message.content)}
              className="h-8 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(message.content)}
              className="h-8 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ================================
// COMPONENTS/SETTINGS-MODAL.TSX - Settings Configuration
// ================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { validateApiKey } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    if (tempSettings.apiKey && !validateApiKey(tempSettings.apiKey)) {
      toast.error('Please enter a valid API key');
      return;
    }

    updateSettings(tempSettings);
    toast.success('Settings saved successfully');
    onClose();
  };

  const handleReset = () => {
    setTempSettings(settings);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settings
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cerebras API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={tempSettings.apiKey}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, apiKey: e.target.value })
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your Cerebras API key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from{' '}
                    <a
                      href="https://cerebras.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      cerebras.ai
                    </a>
                  </p>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model
                  </label>
                  <select
                    value={tempSettings.model}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, model: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="llama3.1-8b">Llama 3.1 8B</option>
                    <option value="llama3.1-70b">Llama 3.1 70B</option>
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temperature: {tempSettings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={tempSettings.temperature}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={tempSettings.maxTokens}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        maxTokens: parseInt(e.target.value) || 1000,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Warning */}
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your API key is stored locally in your browser. Never share it with others.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button onClick={handleSave}>Save Settings</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ================================
// PAGES/_APP.TSX - Next.js App Component
// ================================
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/error-boundary';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <div className={inter.className}>
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

// ================================
// PAGES/INDEX.TSX - Main Application Page
// ================================
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Header } from '@/components/layout/header';
import { PlatformSelector } from '@/components/platform-selector';
import { ChatInterface } from '@/components/chat-interface';
import { SettingsModal } from '@/components/settings-modal';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme } = useAppStore();

  // Apply theme on mount and theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <>
      <Head>
        <title>CereStudio AI - Ultra-Fast AI Creative Platform</title>
        <meta
          name="description"
          content="Experience the world's fastest AI content generation with Cerebras Studio - up to 1,800 tokens per second"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="CereStudio AI - Ultra-Fast AI Creative Platform" />
        <meta
          property="og:description"
          content="Experience the world's fastest AI content generation with Cerebras Studio"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <div className="space-y-8">
            {/* Platform Selection */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Choose Your Creative Platform
              </h2>
              <PlatformSelector />
            </div>

            {/* Chat Interface */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden min-h-[600px] flex flex-col">
              <ChatInterface />
            </div>
          </div>
        </main>

        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </>
  );
}

// ================================
// STYLES/GLOBALS.CSS - Global Styles
// ================================
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --toast-bg: #ffffff;
  --toast-color: #1f2937;
  --toast-border: #e5e7eb;
}

.dark {
  --toast-bg: #374151;
  --toast-color: #f9fafb;
  --toast-border: #4b5563;
}

@layer base {
  html {
    scroll-behavior: smooth;
  }
  
  body {
    @apply text-gray-900 dark:text-gray-100 transition-colors duration-200;
  }
}

@layer components {
  .prose {
    @apply max-w-none;
  }
  
  .prose pre {
    @apply bg-transparent p-0 m-0;
  }
  
  .prose code {
    @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm;
  }
}

@layer utilities {
  .animate-pulse-soft {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

// ================================
// PUBLIC/MANIFEST.JSON - PWA Manifest
// ================================
{
  "name": "CereStudio AI",
  "short_name": "CereStudio",
  "description": "Ultra-Fast AI Creative Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

// ================================
// .ENV.EXAMPLE - Environment Variables Template
// ================================
# Cerebras API Configuration
CEREBRAS_API_KEY=your_cerebras_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="CereStudio AI"

# Development
NODE_ENV=development

// ================================
// DEPLOYMENT CONFIGURATION FILES
// ================================

// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "pages/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}

// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-img-element": "error"
  }
}

// ================================
// DEPLOYMENT SCRIPTS
// ================================

// scripts/build.sh
#!/bin/bash
echo "🚀 Building CereStudio AI..."

# Install dependencies
npm ci

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

echo "✅ Build completed successfully!"

// scripts/deploy.sh
#!/bin/bash
echo "🚀 Deploying CereStudio AI to Vercel..."

# Build first
./scripts/build.sh

# Deploy to Vercel
vercel --prod

echo "✅ Deployment completed!"