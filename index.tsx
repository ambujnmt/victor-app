
import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { SetupRouter } from './App';
import { initializeAppIfNeeded } from './firebase/firebaseConfig';
import './index.css'

// Extend the Window interface
declare global {
  interface Window {
    HEYCHURCH_APP_CONFIG?: {
      GEMINI_API_KEY: string;
      FIREBASE_CONFIG: any;
      YOUTUBE_API_KEY?: string;
      PAYPAL_CLIENT_ID?: string;
      FIREBASE_VAPID_KEY?: string;
    };
    html2canvas?: any;
    deferredInstallPrompt?: any;
  }
}

// Handle PWA Installation Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later via a button in Settings.
  window.deferredInstallPrompt = e;
  // Dispatch a custom event so components know they can show the install button
  window.dispatchEvent(new Event('can-install-app'));
});

// Register Service Worker for PWA with Update Handling
if (false && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // We use a simple root-relative path which is most compatible with PWA requirements
    const swPath = '/sw.js';
    
    // Check if we are on a standard web protocol to avoid issues in some restricted environments
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '[::1]' || 
                       window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/);
    const isHttps = window.location.protocol === 'https:';
    if (isHttps || isLocalhost) {
        navigator.serviceWorker.register(swPath).then(registration => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content available; please refresh.');
                  } else {
                    console.log('Content is cached for offline use.');
                  }
                }
              };
            }
          };
        }).catch(err => {
          console.warn('Service Worker registration skipped or failed: ', err.message);
        });
    } else {
        console.log('Service worker skipped: Not on a secure origin or localhost.');
    }
  });
}
// In index.tsx, above root.render()
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    // Keep the firebase-messaging-sw.js registration (needed for background push);
    // unregister anything else stale from the old caching service worker.
    const staleRegistrations = registrations.filter(
      reg => !reg.active?.scriptURL.includes('firebase-messaging-sw.js')
    );
    if (staleRegistrations.length === 0) return;
    Promise.all(staleRegistrations.map(reg => reg.unregister())).then(() => {
      console.log('Old service worker removed, forcing reload');
      window.location.reload(); // force reload to get latest files
    });
  });

  // Register the messaging service worker, passing along this tenant's Firebase
  // config since it can vary per deployment (see firebase/firebaseConfig.ts).
  const fbConfig = window.HEYCHURCH_APP_CONFIG?.FIREBASE_CONFIG;
  if (fbConfig?.apiKey) {
    const swParams = new URLSearchParams(fbConfig).toString();
    navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams}`).catch(err => {
      console.warn('Firebase messaging service worker registration failed:', err.message);
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
const result = initializeAppIfNeeded();
root.render(
  <React.StrictMode>
    {result.success ? <App /> : <SetupRouter error={result.error} source={result.source} />}
  </React.StrictMode>
);
