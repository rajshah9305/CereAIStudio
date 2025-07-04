/**
 * Analytics Hook for CereStudioAI
 * Provides comprehensive analytics tracking and performance monitoring
 * Author: Raj Shah
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const ANALYTICS_API_BASE = process.env.REACT_APP_ANALYTICS_API || 'http://localhost:5000/api/analytics';

class AnalyticsService {
  constructor() {
    this.sessionId = null;
    this.userId = 'raj_shah'; // In production, this would come from auth
    this.isInitialized = false;
    this.performanceObserver = null;
    this.actionQueue = [];
    this.isOnline = navigator.onLine;
    
    // Setup online/offline listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Start session
      const response = await fetch(`${ANALYTICS_API_BASE}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: this.userId,
          platform: 'web'
        })
      });
      
      const data = await response.json();
      this.sessionId = data.session_id;
      this.isInitialized = true;
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup page visibility tracking
      this.setupVisibilityTracking();
      
      // Setup error tracking
      this.setupErrorTracking();
      
      console.log('Analytics initialized with session:', this.sessionId);
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  setupPerformanceMonitoring() {
    // Web Vitals tracking
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('lcp', lastEntry.startTime, {
          element: lastEntry.element?.tagName
        });
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackPerformance('fid', entry.processingStart - entry.startTime, {
            event_type: entry.name
          });
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.trackPerformance('cls', clsValue);
          }
        });
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    }

    // Memory usage tracking
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.trackPerformance('memory_usage', memory.usedJSHeapSize / 1024 / 1024, {
          total: memory.totalJSHeapSize / 1024 / 1024,
          limit: memory.jsHeapSizeLimit / 1024 / 1024
        });
      }, 30000); // Every 30 seconds
    }
  }

  setupVisibilityTracking() {
    let startTime = Date.now();
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const timeSpent = Date.now() - startTime;
        this.trackAction('page_blur', 'web', { time_spent: timeSpent });
      } else {
        startTime = Date.now();
        this.trackAction('page_focus', 'web');
      }
    });
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackAction('javascript_error', 'web', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackAction('promise_rejection', 'web', {
        reason: event.reason?.toString()
      });
    });
  }

  async trackAction(actionType, platform, metadata = null, responseTime = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const actionData = {
      session_id: this.sessionId,
      action_type: actionType,
      platform: platform,
      metadata: metadata,
      response_time: responseTime
    };

    if (this.isOnline) {
      try {
        await fetch(`${ANALYTICS_API_BASE}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actionData)
        });
      } catch (error) {
        // Queue for later if request fails
        this.actionQueue.push(actionData);
      }
    } else {
      this.actionQueue.push(actionData);
    }
  }

  async trackPerformance(metricType, value, metadata = null) {
    if (!this.isInitialized) return;

    const performanceData = {
      metric_type: metricType,
      value: value,
      metadata: metadata
    };

    if (this.isOnline) {
      try {
        await fetch(`${ANALYTICS_API_BASE}/performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(performanceData)
        });
      } catch (error) {
        console.error('Failed to track performance:', error);
      }
    }
  }

  async trackFeatureUsage(featureName) {
    if (!this.isInitialized) return;

    try {
      await fetch(`${ANALYTICS_API_BASE}/feature-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_name: featureName,
          user_id: this.userId
        })
      });
    } catch (error) {
      console.error('Failed to track feature usage:', error);
    }
  }

  async flushQueue() {
    if (this.actionQueue.length === 0) return;

    const actionsToFlush = [...this.actionQueue];
    this.actionQueue = [];

    for (const action of actionsToFlush) {
      try {
        await fetch(`${ANALYTICS_API_BASE}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
      } catch (error) {
        // Re-queue failed actions
        this.actionQueue.push(action);
      }
    }
  }

  async endSession() {
    if (!this.isInitialized) return;

    try {
      await fetch(`${ANALYTICS_API_BASE}/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId
        })
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }
}

// Global analytics instance
const analyticsService = new AnalyticsService();

// React Hook
export const useAnalytics = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [painPoints, setPainPoints] = useState(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      analyticsService.initialize().then(() => {
        setIsInitialized(true);
      });
    }

    // Cleanup on unmount
    return () => {
      analyticsService.endSession();
    };
  }, []);

  // Track user actions with timing
  const trackActionWithTiming = useCallback(async (actionType, platform, metadata = null) => {
    const startTime = performance.now();
    
    // Return a function to call when action completes
    return () => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      analyticsService.trackAction(actionType, platform, metadata, responseTime);
    };
  }, []);

  // Track simple actions
  const trackAction = useCallback((actionType, platform, metadata = null) => {
    analyticsService.trackAction(actionType, platform, metadata);
  }, []);

  // Track feature usage
  const trackFeature = useCallback((featureName) => {
    analyticsService.trackFeatureUsage(featureName);
  }, []);

  // Track performance metrics
  const trackPerformance = useCallback((metricType, value, metadata = null) => {
    analyticsService.trackPerformance(metricType, value, metadata);
  }, []);

  // Get dashboard data
  const getDashboardData = useCallback(async () => {
    try {
      const response = await fetch(`${ANALYTICS_API_BASE}/dashboard`);
      const data = await response.json();
      setDashboardData(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return null;
    }
  }, []);

  // Get pain points analysis
  const getPainPoints = useCallback(async () => {
    try {
      const response = await fetch(`${ANALYTICS_API_BASE}/pain-points`);
      const data = await response.json();
      setPainPoints(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch pain points:', error);
      return null;
    }
  }, []);

  // Export analytics data
  const exportAnalytics = useCallback(async (format = 'json', days = 30) => {
    try {
      const response = await fetch(`${ANALYTICS_API_BASE}/export?format=${format}&days=${days}`);
      
      if (format === 'csv') {
        const csvData = await response.text();
        return csvData;
      } else {
        const jsonData = await response.json();
        return jsonData;
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
      return null;
    }
  }, []);

  // Track component mount/unmount
  const trackComponentLifecycle = useCallback((componentName) => {
    trackAction('component_mount', 'web', { component: componentName });
    
    return () => {
      trackAction('component_unmount', 'web', { component: componentName });
    };
  }, [trackAction]);

  // Track user interactions with detailed context
  const trackInteraction = useCallback((element, action, context = {}) => {
    trackAction('user_interaction', 'web', {
      element,
      action,
      ...context,
      timestamp: Date.now(),
      url: window.location.pathname
    });
  }, [trackAction]);

  return {
    isInitialized,
    trackAction,
    trackActionWithTiming,
    trackFeature,
    trackPerformance,
    trackComponentLifecycle,
    trackInteraction,
    getDashboardData,
    getPainPoints,
    exportAnalytics,
    dashboardData,
    painPoints
  };
};

// Higher-order component for automatic component tracking
export const withAnalytics = (WrappedComponent, componentName) => {
  return function AnalyticsWrappedComponent(props) {
    const { trackComponentLifecycle } = useAnalytics();
    
    useEffect(() => {
      const cleanup = trackComponentLifecycle(componentName);
      return cleanup;
    }, [trackComponentLifecycle]);
    
    return <WrappedComponent {...props} />;
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const { trackPerformance } = useAnalytics();
  
  const measureRender = useCallback((componentName) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      trackPerformance('component_render_time', renderTime, { component: componentName });
    };
  }, [trackPerformance]);
  
  const measureAsyncOperation = useCallback(async (operationName, asyncFn) => {
    const startTime = performance.now();
    
    try {
      const result = await asyncFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      trackPerformance('async_operation_time', duration, { 
        operation: operationName,
        success: true 
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      trackPerformance('async_operation_time', duration, { 
        operation: operationName,
        success: false,
        error: error.message 
      });
      
      throw error;
    }
  }, [trackPerformance]);
  
  return {
    measureRender,
    measureAsyncOperation
  };
};

export default analyticsService;

