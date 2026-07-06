import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import * as firebaseService from '../services/firebaseService';
import { useAuth } from '../App';

const DataSyncPage: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [log, setLog] = useState<string[]>(['Waiting to start sync...']);
    const [error, setError] = useState<string | null>(null);

    const handleSync = async () => {
        if (!adminUser) {
            setError("Authentication error. Cannot perform sync.");
            return;
        }
        setIsSyncing(true);
        setError(null);
        
        const logUpdate = (message: string) => {
            setLog(prev => [...prev, message]);
        };
        
        setLog(['Starting full database sync...']);

        try {
            // This is the new, robust, step-by-step sync function
            await firebaseService.syncDatabase(adminUser, logUpdate);
            
            logUpdate('✅ Sync complete! Reloading application...');
            setIsSyncing(false); // FIX: Set syncing to false on success.

            setTimeout(() => {
                window.location.reload(); // Force a full reload to clear all caches
            }, 2000);

        } catch (e: any) {
            console.error("Sync failed", e);
            const errorMessage = `Sync failed: ${e.message || 'Unknown error'}. Please check console for details.`;
            setError(errorMessage);
            logUpdate(`❌ ${errorMessage}`);
            setIsSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[rgb(19,54,102)] flex flex-col items-center justify-center p-4 text-white">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center my-4 border border-[#2E1C17] max-w-2xl w-full">
                <RefreshCw size={40} className="mx-auto text-[rgb(255_152_43)] mb-4" />
                <h1 className="text-2xl font-bold text-white">Database Sync Required</h1>
                <p className="text-gray-400 mt-2">
                    Your app's content (like Challenges and Courses) is out of date.
                    Click the button below to sync your database with the latest content. This will fix issues like broken filters.
                </p>

                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="mt-6 w-full bg-[rgb(255_117_93)] text-white font-bold py-4 px-4 rounded-lg text-lg transition-transform hover:scale-105 disabled:bg-gray-600 disabled:scale-100 flex items-center justify-center"
                >
                    {isSyncing ? (
                        <>
                            <Loader2 className="animate-spin mr-3" /> Syncing...
                        </>
                    ) : (
                        'Sync Database Now'
                    )}
                </button>

                {(isSyncing || error || log.length > 1) && (
                    <div className="mt-4 p-4 bg-gray-900 rounded-md text-left text-sm font-mono h-48 overflow-y-auto">
                        {log.map((line, index) => (
                            <p key={index} className="whitespace-pre-wrap">{`> ${line}`}</p>
                        ))}
                    </div>
                )}
                
                {error && !isSyncing && (
                     <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-md text-sm text-left">
                        <p className="font-bold flex items-center"><AlertTriangle size={16} className="mr-2" />Error</p>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataSyncPage;
