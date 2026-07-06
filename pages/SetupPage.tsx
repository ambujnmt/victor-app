
import React from 'react';
import { Database, AlertTriangle, ExternalLink, ShieldCheck, Globe } from 'lucide-react';

const SetupPage: React.FC<{ error?: string, source?: string }> = ({ error, source }) => {
  const renderErrorMessage = () => {
    if (!error) return null;

    let specificGuidance = "The configuration seems to be present, but the connection failed. Please go through the troubleshooting checklist below.";
    if (source === 'none') {
        specificGuidance = "We couldn't find a Firebase configuration. The recommended way to fix this is by adding your configuration object to the `index.html` file.";
    }

    return (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
            <h3 className="font-bold flex items-center"><AlertTriangle className="mr-2" />Initialization Failed</h3>
            <p className="text-sm mt-2 font-mono bg-red-800/50 p-2 rounded">{error}</p>
            <p className="text-sm mt-3 pt-3 border-t border-red-800">{specificGuidance}</p>
        </div>
    );
  };
  
  const configHtmlExample = `
<script>
  window.HEYCHURCH_APP_CONFIG = {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
    
    FIREBASE_CONFIG: {
      // Paste your entire Firebase config object here
      apiKey: "AIza...",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project",
      // ... and so on
    },
  };
</script>
  `.trim();

  return (
    <div className="min-h-screen bg-[rgb(19,54,102)] flex items-center justify-center p-4 py-20 overflow-y-auto">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="inline-block bg-[rgb(16_185_129)] p-4 rounded-full mb-4">
            <Database className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Connect Your Firebase Project</h1>
          <p className="text-gray-400 mt-2">To run this app, you need to link it to your own Firebase backend.</p>
        </div>

        {renderErrorMessage()}
        
         <div className="space-y-4 text-sm text-gray-300 bg-gray-900/50 p-4 rounded-lg">
            <p className="font-bold text-base text-[rgb(251_191_36)]">1. Apply Your Configuration</p>
            <p>Edit the <code className="bg-gray-700 p-1 rounded text-[#FFB86C]">index.html</code> file in the project root and replace the <code className="bg-gray-700 p-1 rounded">HEYCHURCH_APP_CONFIG</code> with your values.</p>
            <pre className="bg-black/50 p-3 rounded-md text-xs overflow-x-auto text-gray-400">
                <code>{configHtmlExample}</code>
            </pre>
        </div>

        <div className="space-y-4 text-sm text-gray-300 bg-gray-900/50 p-4 rounded-lg">
            <p className="font-bold text-base text-[rgb(251_191_36)] flex items-center">
                <ShieldCheck size={18} className="mr-2"/> 2. Fix Google Sign-In Errors
            </p>
            <p className="text-xs text-gray-400">If you've enabled Google Sign-In in your Firebase Console but still see errors, check these three common missing steps:</p>
            
            <ul className="space-y-4 mt-2">
                 <li className="flex items-start">
                    <span className="font-bold text-[rgb(255_152_43)] mr-2 text-lg">A.</span>
                    <div>
                        <p className="font-semibold text-white">Authorized Domains</p>
                        <p className="text-xs text-gray-400 mt-1">Firebase blocks sign-ins from unknown domains. Go to <span className="font-bold">Authentication &rarr; Settings &rarr; Authorized Domains</span> and add your current URL:</p>
                        <code className="mt-2 block bg-black/40 p-2 rounded text-[rgb(59_130_246)] font-mono text-[10px] break-all">
                            {window.location.hostname}
                        </code>
                    </div>
                </li>
                <li className="flex items-start">
                    <span className="font-bold text-[rgb(255_152_43)] mr-2 text-lg">B.</span>
                    <div>
                        <p className="font-semibold text-white">Project ID Mismatch</p>
                        <p className="text-xs text-gray-400 mt-1">Ensure the <code className="bg-gray-700 px-1 rounded">projectId</code> in <code className="bg-gray-700 px-1 rounded">index.html</code> matches the project you configured in the Firebase Console. If they don't match, the app is trying to talk to the wrong database.</p>
                    </div>
                </li>
                 <li className="flex items-start">
                    <span className="font-bold text-[rgb(255_152_43)] mr-2 text-lg">C.</span>
                    <div>
                        <p className="font-semibold text-white">OAuth Consent Screen</p>
                        <p className="text-xs text-gray-400 mt-1">Google requires you to set up an "OAuth Consent Screen" in the <span className="font-bold">Google Cloud Console</span>. Choose "External" and provide your app name and support email.</p>
                    </div>
                </li>
            </ul>
             <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-gray-700 hover:bg-gray-600 font-bold py-3 px-4 rounded-lg text-sm transition-colors">
                Open Firebase Console <ExternalLink className="inline ml-1" size={14}/>
            </a>
        </div>
        
        <div className="text-center text-xs text-gray-500">
            <p>Once correctly configured, the app will automatically restart and skip this page.</p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
