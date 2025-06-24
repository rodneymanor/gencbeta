/**
 * Usage Examples for Clipboard Detection Logic
 * 
 * These examples show how to integrate the clipboard detection
 * with various alert systems and UI frameworks.
 */

import { useEffect, useState } from 'react';

import {
  checkClipboardForSocialLinks,
  useClipboardDetection,
  isTikTokOrInstagramUrl,
  ClipboardDetectionResult,
  createAlertMessage
} from './clipboard-detector-logic';

// Example 1: Basic React component with state management
export function BasicClipboardDetector() {
  const [detectedUrl, setDetectedUrl] = useState<ClipboardDetectionResult | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const result = await checkClipboardForSocialLinks();
        if (result && isTikTokOrInstagramUrl(result.url)) {
          setDetectedUrl(result);
          setShowAlert(true);
        }
      } catch (error) {
        console.log('Clipboard access denied or not available');
      }
    };

    // Check clipboard after page load
    const timer = setTimeout(checkClipboard, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!showAlert || !detectedUrl) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Link Detected!</h4>
          <p className="text-sm text-gray-600">{createAlertMessage(detectedUrl)}</p>
        </div>
        <button
          onClick={() => setShowAlert(false)}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Process Video
        </button>
        <button 
          onClick={() => setShowAlert(false)}
          className="px-3 py-1 bg-gray-300 rounded text-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// Example 2: Using the React hook with custom callbacks
export function HookBasedClipboardDetector() {
  const [notifications, setNotifications] = useState<string[]>([]);

  useClipboardDetection({
    onDetected: (result) => {
      if (isTikTokOrInstagramUrl(result.url)) {
        const message = `${result.platform.toUpperCase()} video detected: ${result.formattedUrl}`;
        setNotifications(prev => [...prev, message]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
      }
    },
    onError: (error) => {
      console.error('Clipboard detection error:', error);
    },
    onPermissionDenied: () => {
      console.log('Clipboard permission denied');
    }
  }, {
    enabled: true,
    checkDelay: 1500,
    checkOnMount: true
  });

  return (
    <div className="fixed top-4 left-4 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className="bg-green-100 border border-green-300 rounded-lg p-3 shadow-md animate-in slide-in-from-left"
        >
          <p className="text-sm font-medium text-green-800">{notification}</p>
        </div>
      ))}
    </div>
  );
}

// Example 3: Manual checking with custom UI
export function ManualClipboardChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ClipboardDetectionResult | null>(null);

  const handleCheckClipboard = async () => {
    setIsChecking(true);
    try {
      const detection = await checkClipboardForSocialLinks();
      setResult(detection);
      
      if (detection && isTikTokOrInstagramUrl(detection.url)) {
        // Custom alert for TikTok/Instagram
        alert(`🎬 ${detection.platform.toUpperCase()} video found in clipboard!\n\n${detection.formattedUrl}\n\nReady to process?`);
      } else if (detection) {
        alert(`📱 Social media link found: ${detection.formattedUrl}`);
      } else {
        alert('No social media links found in clipboard');
      }
    } catch (error) {
      alert('Unable to access clipboard. Please check permissions.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleCheckClipboard}
        disabled={isChecking}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isChecking ? 'Checking...' : 'Check Clipboard'}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p><strong>Platform:</strong> {result.platform}</p>
          <p><strong>Is Video:</strong> {result.isVideo ? 'Yes' : 'No'}</p>
          <p><strong>URL:</strong> {result.formattedUrl}</p>
        </div>
      )}
    </div>
  );
}

// Example 4: Integration with popular toast libraries

// With react-hot-toast
export function ToastClipboardDetector() {
  // Uncomment if using react-hot-toast
  // import toast from 'react-hot-toast';
  
  useClipboardDetection({
    onDetected: (result) => {
      if (isTikTokOrInstagramUrl(result.url)) {
        // toast.success(
        //   `${result.platform.toUpperCase()} video detected!\n${result.formattedUrl}`,
        //   {
        //     duration: 6000,
        //     icon: '🎬',
        //   }
        // );
        
        // Fallback to console if toast not available
        console.log('🎬 Video detected:', result);
      }
    },
    onError: (error) => {
      // toast.error('Clipboard access failed');
      console.error('Clipboard error:', error);
    },
    onPermissionDenied: () => {
      // toast('Clipboard permission needed for auto-detection', { icon: '🔒' });
      console.log('Clipboard permission denied');
    }
  });

  return null; // This component doesn't render anything
}

// Example 5: Vanilla JavaScript integration (no React)
export const vanillaClipboardDetector = {
  init: (options: {
    onDetected?: (result: ClipboardDetectionResult) => void;
    onError?: (error: string) => void;
    checkInterval?: number;
  } = {}) => {
    const {
      onDetected = (result) => {
        if (isTikTokOrInstagramUrl(result.url)) {
          alert(`Video detected from ${result.platform}: ${result.formattedUrl}`);
        }
      },
      onError = (error) => console.error('Clipboard error:', error),
      checkInterval = 0 // 0 means check once on init
    } = options;

    const checkClipboard = async () => {
      try {
        const result = await checkClipboardForSocialLinks();
        if (result) {
          onDetected(result);
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Initial check
    setTimeout(checkClipboard, 1000);

    // Optional periodic checking
    if (checkInterval > 0) {
      return setInterval(checkClipboard, checkInterval);
    }

    return null;
  }
};

// Example 6: Custom modal/popup implementation
export function ModalClipboardDetector() {
  const [showModal, setShowModal] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<ClipboardDetectionResult | null>(null);

  useEffect(() => {
    const checkAndShow = async () => {
      try {
        const result = await checkClipboardForSocialLinks();
        if (result && isTikTokOrInstagramUrl(result.url)) {
          setDetectedUrl(result);
          setShowModal(true);
        }
      } catch (error) {
        // Silently fail - clipboard access is optional
      }
    };

    const timer = setTimeout(checkAndShow, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!showModal || !detectedUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">🎬</span>
          <h3 className="text-lg font-semibold">Video Link Detected!</h3>
        </div>
        
        <p className="text-gray-600 mb-2">
          Found a {detectedUrl.platform} video in your clipboard:
        </p>
        
        <div className="bg-gray-100 p-3 rounded mb-4">
          <p className="text-sm font-mono break-all">{detectedUrl.formattedUrl}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Handle process action
              console.log('Processing:', detectedUrl.url);
              setShowModal(false);
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Process Video
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 7: Minimal notification badge
export function NotificationBadge() {
  const [hasDetection, setHasDetection] = useState(false);

  useClipboardDetection({
    onDetected: (result) => {
      if (isTikTokOrInstagramUrl(result.url)) {
        setHasDetection(true);
      }
    },
    onError: () => {},
    onPermissionDenied: () => {}
  });

  if (!hasDetection) return null;

  return (
    <div 
      onClick={() => setHasDetection(false)}
      className="fixed bottom-4 right-4 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center cursor-pointer shadow-lg animate-bounce"
    >
      <span className="text-xs font-bold">NEW</span>
    </div>
  );
} 