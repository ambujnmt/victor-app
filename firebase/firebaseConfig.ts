
import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const FIREBASE_CONFIG_KEY = 'firebaseConfig';

interface FirebaseServices {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
}

type ConfigSource = 'env' | 'localStorage' | 'none';

interface InitializationResult {
    success: boolean;
    error?: string;
    source?: ConfigSource;
}

let services: FirebaseServices | null = null;
let initializationAttempted = false;
let lastInitializationResult: InitializationResult = { success: false };

// New core initialization function. Returns a result object.
export const initializeAppIfNeeded = (): InitializationResult => {
    if (initializationAttempted) {
        return lastInitializationResult;
    }
    initializationAttempted = true;

    // Priority 1: Check for config in our custom global object from config.js
    const envConfig = window.HEYCHURCH_APP_CONFIG?.FIREBASE_CONFIG;
    
    let firebaseConfig: any = null;
    let configSource: ConfigSource = 'none';

    if (envConfig && typeof envConfig === 'object' && envConfig.apiKey && envConfig.projectId) {
        firebaseConfig = envConfig;
        configSource = 'env';
    } else {
        // Priority 2: Fallback to localStorage
        const configString = localStorage.getItem(FIREBASE_CONFIG_KEY);
        if (configString) {
            try {
                firebaseConfig = JSON.parse(configString);
                configSource = 'localStorage';
            } catch (e) {
                const errorMsg = "Failed to parse Firebase config from local storage. It might be corrupted. Clearing it.";
                console.error(errorMsg, e);
                localStorage.removeItem(FIREBASE_CONFIG_KEY);
                lastInitializationResult = { success: false, error: errorMsg, source: 'localStorage' };
                return lastInitializationResult;
            }
        }
    }

    if (!firebaseConfig) {
        lastInitializationResult = { success: false, error: "No Firebase configuration found in config.js or local storage.", source: 'none' };
        return lastInitializationResult;
    }

    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        services = { app, auth, db };
        console.log(`Firebase initialized successfully from ${configSource}.`);
        lastInitializationResult = { success: true, source: configSource };
        return lastInitializationResult;
    } catch (e: any) {
        console.error("Firebase Initialization Error:", e);
        let errorMsg = `Firebase initialization failed: ${e.message}.`;
        
        // Provide more helpful, specific error messages for common issues.
        if (e.code === 'auth/invalid-api-key' || (e.message && e.message.toLowerCase().includes('api key not valid'))) {
            errorMsg = "Invalid API Key. Please double-check the 'apiKey' in your configuration.";
        } else if (e.code === 'auth/invalid-project-id' || (e.message && e.message.toLowerCase().includes('project id'))) {
             errorMsg = "Invalid Project ID. Please ensure the 'projectId' in your configuration is correct.";
        } else if (e.message && e.message.toLowerCase().includes("auth service with email")) {
            errorMsg = "Email/Password sign-in is not enabled for this project. Please enable it in your Firebase Authentication console.";
        } else if (e.message && e.message.toLowerCase().includes("permission denied")) {
             errorMsg = "Permission Denied. This is often caused by incorrect Firestore Security Rules. Please ensure they allow read/write access.";
        }

        services = null;
        lastInitializationResult = { success: false, error: errorMsg, source: configSource };
        return lastInitializationResult;
    }
};

// Getter for services. Throws if not initialized.
export const getFirebaseServices = (): FirebaseServices => {
    if (!services) {
        throw new Error("Firebase services requested but are not available. Initialization may have failed or the app is not configured.");
    }
    return services;
};

// Helper to get the VAPID key used to request FCM push tokens in the browser.
// Generated in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates.
export const getVapidKey = (): string | null => {
    const envKey = window.HEYCHURCH_APP_CONFIG?.FIREBASE_VAPID_KEY;
    if (envKey) return envKey;

    try {
        const configStr = localStorage.getItem(FIREBASE_CONFIG_KEY);
        if (configStr) {
            const config = JSON.parse(configStr);
            if (config.vapidKey) return config.vapidKey;
        }
    } catch (e) {}
    return null;
};

// Helper to get the current project ID safely
export const getFirebaseProjectId = (): string => {
    try {
        const envConfig = window.HEYCHURCH_APP_CONFIG?.FIREBASE_CONFIG;
        if (envConfig?.projectId) return envConfig.projectId;
        
        const configStr = localStorage.getItem(FIREBASE_CONFIG_KEY);
        if (configStr) {
            const config = JSON.parse(configStr);
            return config.projectId || 'unknown';
        }
    } catch (e) {}
    return 'unknown';
};

// Safe, synchronous check for config existence.
export const isFirebaseConfigured = (): boolean => {
  const envConfig = window.HEYCHURCH_APP_CONFIG?.FIREBASE_CONFIG;
  if (envConfig && typeof envConfig === 'object' && envConfig.apiKey && envConfig.projectId) {
    return true;
  }

  const configStr = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (!configStr) return false;
  try {
    const config = JSON.parse(configStr);
    return !!(config.apiKey && config.projectId);
  } catch (e) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    return false;
  }
};

// Save config and reload to apply it.
export const saveFirebaseConfig = (configString: string) => {
    try {
        const config = JSON.parse(configString);
        if (!config.apiKey || !config.projectId) {
            throw new Error("Config is missing apiKey or projectId");
        }
        localStorage.setItem(FIREBASE_CONFIG_KEY, configString);
        alert('Firebase configuration saved! The app will now reload.');
        window.location.reload();
    } catch (e) {
        console.error("Failed to save Firebase config:", e);
        alert('The provided configuration is not valid. Please check and try again. It must be a valid JSON object with at least apiKey and projectId.');
    }
};
