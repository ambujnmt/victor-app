import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Added Loader2 to imports from lucide-react
import { Shield, AlertCircle, Copy, HelpCircle, Check, ExternalLink, Loader2, Eye, EyeOff } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '../services/firebaseService';
import { getFirebaseProjectId } from '../firebase/firebaseConfig';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const TroubleshootingBox: React.FC<{ code: string, domain?: string | null }> = ({ code, domain }) => {
    const currentProjectId = getFirebaseProjectId();
    const isDefaultProject = currentProjectId.includes('gen-lang-client');
    const [copied, setCopied] = useState(false);
    
    const consoleLink = currentProjectId && currentProjectId !== 'unknown' 
        ? `https://console.firebase.google.com/project/${currentProjectId}/authentication/settings` 
        : 'https://console.firebase.google.com/';

    const handleCopy = () => {
        if (domain) {
            navigator.clipboard.writeText(domain);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="mt-6 p-6 bg-black/40 border-2 border-[rgb(255,117,93)]/50 rounded-2xl space-y-4">
            <p className="text-[rgb(255_152_43)] font-black flex items-center text-xs uppercase tracking-widest">
                <HelpCircle size={16} className="mr-2" /> Action Required
            </p>
            
            {isDefaultProject && (
                <p className="text-[10px] text-yellow-200 leading-relaxed italic border-l-2 border-yellow-500 pl-3">
                    <span className="font-black text-[rgb(255_117_93)]">WARNING:</span> You are still using the default Project ID. Update <code className="bg-black p-0.5 rounded">index.html</code> first.
                </p>
            )}

            {code === 'auth/unauthorized-domain' && domain && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">1. Copy this domain:</p>
                        <div className="bg-gray-900 border border-white/10 p-1.5 rounded-xl flex items-center justify-between group">
                            <code className="px-3 text-xs text-[rgb(59_130_246)] font-mono truncate">{domain}</code>
                            <button 
                                onClick={handleCopy} 
                                className={`px-4 py-2 rounded-lg transition-all font-black text-[10px] uppercase tracking-widest flex items-center ${copied ? 'bg-green-500 text-white' : 'bg-[rgb(59_130_246)] text-white hover:bg-blue-600'}`}
                            >
                                {copied ? <><Check size={14} className="mr-1"/> Done</> : <><Copy size={14} className="mr-1"/> Copy</>}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">2. Add to Firebase:</p>
                        <a 
                            href={consoleLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-full py-4 bg-[rgb(59_130_246)] text-white rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 transition-all"
                        >
                            Open Firebase Settings <ExternalLink size={14} className="ml-2"/>
                        </a>
                        <p className="text-[9px] text-gray-400 text-center italic mt-2">Paste address into "Authorized Domains" section.</p>
                    </div>
                </div>
            )}

            {code === 'auth/operation-not-allowed' && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-300">Enable Google Sign-in in your project console.</p>
                    <a href={consoleLink} target="_blank" rel="noreferrer" className="block text-center py-3 bg-[rgb(59_130_246)] text-white rounded-lg font-bold text-[10px] uppercase tracking-widest">Enable Provider</a>
                </div>
            )}

            {code === 'auth/popup-blocked' && (
                <p className="text-xs text-yellow-500 font-bold">Popup blocked! Please enable popups for this site.</p>
            )}
        </div>
    );
};

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@heychurch.de');
    const [password, setPassword] = useState('password');
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success', code?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [domainToCopy, setDomainToCopy] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await signInWithEmail(email, password);
        } catch (err: any) {
            console.error("Login Error:", err);
            let msg = 'Failed to sign in. Please check your credentials.';
            if (err.code === 'auth/operation-not-allowed') {
                 msg = 'Sign-in method is not enabled.';
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                msg = 'Account not found. Sign up first.';
            }
            setMessage({ text: msg, type: 'error', code: err.code });
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setMessage(null);
        setDomainToCopy(null);
        try {
            await signInWithGoogle();
        } catch (e: any) {
            console.error("Google Sign-In Error:", e);
            let msg = 'Google sign-in failed.';
            
            if (e.code === 'auth/popup-closed-by-user') {
                msg = 'Sign-in cancelled.';
            } else if (e.code === 'auth/unauthorized-domain') {
                const currentDomain = window.location.hostname;
                setDomainToCopy(currentDomain);
                msg = `Domain not authorized. Please follow the steps below.`;
            } else if (e.code === 'auth/operation-not-allowed') {
                msg = 'Google provider is disabled in Firebase.';
            } else if (e.code === 'auth/popup-blocked') {
                msg = 'Popup blocked by browser.';
            } else if (e.message) {
                msg = e.message;
            }
            
            setMessage({ text: msg, type: 'error', code: e.code });
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-[rgb(19,54,102)] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 space-y-6 border border-white/5">
                <div className="text-center">
                    <div className="inline-block bg-[rgb(255_117_93)] p-4 rounded-3xl mb-4 shadow-xl">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Admin Login</h1>
                    <p className="text-gray-400 mt-2 text-xs font-bold uppercase tracking-widest">Secure Access Only</p>
                </div>
                
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white text-gray-700 font-black py-4 px-4 rounded-2xl shadow-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                        <path fill="#EA4335" d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.16-3.16C17.45 1.18 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {message && (
                    <div className="animate-in slide-in-from-top-2">
                        <div className={`text-xs p-4 rounded-2xl flex items-start font-bold ${message.type === 'error' ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-green-900/30 text-green-300 border border-green-800'}`}>
                            <AlertCircle size={18} className="mr-3 mt-0.5 flex-shrink-0"/>
                            <span>{message.text}</span>
                        </div>
                        {message.code && <TroubleshootingBox code={message.code} domain={domainToCopy} />}
                    </div>
                )}

                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-600 text-[10px] font-black uppercase tracking-widest">OR</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>

                <form className="space-y-4" onSubmit={handleAdminLogin}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)] transition-all"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 pr-12 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)] transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[rgb(255_117_93)] py-5 rounded-2xl font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
                    >
                        {/* Correctly using Loader2 after importing it above */}
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign In'}
                    </button>
                </form>
                
                <div className="flex flex-col space-y-3 pt-2">
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-center text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-colors">Forgot Password?</button>
                    <button onClick={() => navigate('/welcome')} className="text-center text-xs text-[rgb(255_152_43)] font-bold hover:underline">Back to Welcome</button>
                </div>
            </div>
            {showForgotPassword && (
                <ForgotPasswordModal initialEmail={email} onClose={() => setShowForgotPassword(false)} />
            )}
        </div>
    );
};

export default LoginPage;