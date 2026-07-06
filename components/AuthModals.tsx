
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../services/firebaseService';
import { getFirebaseProjectId } from '../firebase/firebaseConfig';
import { X, Loader2, AlertCircle, Copy, HelpCircle, Check, Settings, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { LegalModal } from './LegalModal';
import ForgotPasswordModal from './ForgotPasswordModal';

interface ModalProps {
    onClose: () => void;
}

interface SignUpModalProps extends ModalProps {
    onSwitchToSignIn: () => void;
}

interface SignInModalProps extends ModalProps {
    onSwitchToSignUp: () => void;
}

const GoogleButton: React.FC<{ onClick: () => void, disabled: boolean, label: string }> = ({ onClick, disabled, label }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full bg-white text-gray-700 font-black py-4 px-4 rounded-2xl shadow-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
    >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
            />
            <path
                fill="#EA4335"
                d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.16-3.16C17.45 1.18 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
        {label}
    </button>
);

const TroubleshootingBox: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const host = window.location.hostname;
    const projectId = getFirebaseProjectId();
    
    const consoleLink = projectId && projectId !== 'unknown' 
        ? `https://console.firebase.google.com/project/${projectId}/authentication/settings` 
        : 'https://console.firebase.google.com/';

    const handleCopyDomain = () => {
        navigator.clipboard.writeText(host);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-4 p-6 bg-black/40 border-2 border-[rgb(255,117,93)]/50 rounded-[2rem] space-y-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center text-[rgb(255_152_43)] font-black text-xs uppercase tracking-widest">
                <HelpCircle size={16} className="mr-2" /> 
                Critical Fix Required
            </div>
            
            {code === 'auth/unauthorized-domain' ? (
                <div className="space-y-4">
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        Google has blocked login because this specific web address is not "Authorized" in your Firebase project.
                    </p>
                    
                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">1. Copy this address:</p>
                        <div className="bg-gray-900 border border-white/10 p-1.5 rounded-xl flex items-center justify-between group">
                            <code className="px-3 text-xs text-[rgb(59_130_246)] font-mono truncate">{host}</code>
                            <button 
                                onClick={handleCopyDomain} 
                                className={`px-4 py-2 rounded-lg transition-all font-black text-[10px] uppercase tracking-widest flex items-center ${copied ? 'bg-green-500 text-white' : 'bg-[rgb(59_130_246)] text-white hover:bg-blue-600'}`}
                            >
                                {copied ? <><Check size={14} className="mr-1"/> Copied!</> : <><Copy size={14} className="mr-1"/> Copy</>}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">2. Paste it in Settings:</p>
                        <a 
                            href={consoleLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-full py-4 bg-[rgb(255,117,93)] text-white rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 transition-all border-b-4 border-[#E85A37] active:border-b-0 active:translate-y-1"
                        >
                            Open Firebase Console <ExternalLink size={16} className="ml-2"/>
                        </a>
                        <p className="text-[9px] text-gray-500 text-center italic mt-2">
                            Go to Auth &rarr; Settings &rarr; Authorized Domains
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-gray-400">An unexpected authentication error occurred.</p>
                    <code className="block p-3 bg-black/50 rounded-lg text-[10px] font-mono text-red-400 break-all">{code}</code>
                    <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="block text-center text-[10px] text-[rgb(59_130_246)] font-bold uppercase underline">Open Firebase Console</a>
                </div>
            )}
        </div>
    );
};

export const SignUpModal: React.FC<SignUpModalProps> = ({ onClose, onSwitchToSignIn }) => {
    const { language, t } = useLanguage();
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<{msg: string, code?: string} | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Legal Checkboxes
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [allowTracking, setAllowTracking] = useState(false);
    const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

    const handleGoogleSignIn = async () => {
        if (!acceptedTerms) {
            setError({ msg: t('legal.error_accept_terms') || 'Please accept terms and privacy policy first.' });
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (e: any) {
            setError({ msg: 'Google Sign-in failed.', code: e.code });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acceptedTerms) return;
        
        setLoading(true);
        setError(null);
        try {
            await signUpWithEmail(email, password, firstName, language);
        } catch (authError: any) {
            setError({ msg: 'Registration failed. Check your data.', code: authError.code });
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-[rgb(19,54,102)]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full relative border border-white/5 overflow-hidden my-8">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors z-20"><X size={20}/></button>
                <div className="p-10 space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">Join the Family</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Create your Hey Life profile</p>
                    </div>
                    
                    <GoogleButton onClick={handleGoogleSignIn} disabled={loading} label="Continue with Google" />
                    
                    {error && (
                        <div>
                            <div className="bg-red-900/30 border border-red-800/50 text-red-200 text-xs p-4 rounded-2xl flex items-start shadow-inner">
                                <AlertCircle size={16} className="mr-3 mt-0.5 flex-shrink-0" />
                                <span>{error.msg}</span>
                            </div>
                            {error.code && <TroubleshootingBox code={error.code} />}
                        </div>
                    )}

                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-700/50"></div>
                        <span className="flex-shrink mx-4 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">OR</span>
                        <div className="flex-grow border-t border-gray-700/50"></div>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <input type="text" placeholder="Your Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)] transition-colors" required />
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)] transition-colors" required />
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 pr-12 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)] transition-colors" required />
                            <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="flex items-start cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms} 
                                    onChange={e => setAcceptedTerms(e.target.checked)} 
                                    className="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-900 text-[rgb(255_117_93)] focus:ring-[rgb(255_117_93)]"
                                />
                                <span className="ml-3 text-[11px] leading-snug text-gray-400 group-hover:text-gray-300 transition-colors">
                                    {t('legal.checkbox.terms')}
                                    <div className="mt-1 flex space-x-3 text-[rgb(59_130_246)] font-black uppercase tracking-tighter text-[9px]">
                                        <button type="button" onClick={() => setShowLegal('privacy')} className="hover:underline">Policy</button>
                                        <button type="button" onClick={() => setShowLegal('terms')} className="hover:underline">Terms</button>
                                    </div>
                                </span>
                            </label>

                            <label className="flex items-start cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={allowTracking} 
                                    onChange={e => setAllowTracking(e.target.checked)} 
                                    className="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-900 text-[rgb(59_130_246)] focus:ring-[rgb(59_130_246)]"
                                />
                                <span className="ml-3 text-[11px] leading-snug text-gray-400 group-hover:text-gray-300 transition-colors">
                                    {t('legal.checkbox.tracking')}
                                </span>
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !acceptedTerms} 
                            className="w-full bg-[rgb(255_117_93)] py-5 rounded-2xl font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:grayscale disabled:scale-100"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create Account'}
                        </button>
                    </form>
                    
                    <button onClick={onSwitchToSignIn} className="w-full text-center text-xs font-bold text-[rgb(255_152_43)] hover:text-white transition-colors">
                        ALREADY HAVE AN ACCOUNT? <span className="underline">SIGN IN</span>
                    </button>
                </div>
            </div>
            {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
        </div>
    );
};

export const SignInModal: React.FC<SignInModalProps> = ({ onClose, onSwitchToSignUp }) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<{msg: string, code?: string} | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (e: any) {
            setError({ msg: 'Google Sign-in failed.', code: e.code });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signInWithEmail(email, password);
        } catch (authError: any) {
            setError({ msg: "Invalid email or password.", code: authError.code });
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[rgb(19,54,102)]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full relative border border-white/5 overflow-hidden my-8">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors z-20"><X size={20}/></button>
                <div className="p-10 space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">Welcome Back</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sign in to your account</p>
                    </div>
                    
                    <GoogleButton onClick={handleGoogleSignIn} disabled={loading} label="Sign in with Google" />
                    
                    {error && (
                        <div>
                            <div className="bg-red-900/30 border border-red-800/50 text-red-200 text-xs p-4 rounded-2xl flex items-start shadow-inner">
                                <AlertCircle size={16} className="mr-3 mt-0.5 flex-shrink-0" />
                                <span>{error.msg}</span>
                            </div>
                            {error.code && <TroubleshootingBox code={error.code} />}
                        </div>
                    )}

                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-700/50"></div>
                        <span className="flex-shrink mx-4 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">OR</span>
                        <div className="flex-grow border-t border-gray-700/50"></div>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)] transition-colors" required />
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 pr-12 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)] transition-colors" required />
                            <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-[rgb(255_117_93)] py-5 rounded-2xl font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest">
                           {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign In'}
                        </button>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-center text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-colors">
                            Forgot Password?
                        </button>
                    </form>

                    <button onClick={onSwitchToSignUp} className="w-full text-center text-xs font-bold text-[rgb(255_152_43)] hover:text-white transition-colors">
                        DON'T HAVE AN ACCOUNT? <span className="underline">SIGN UP</span>
                    </button>
                </div>
            </div>
            {showForgotPassword && (
                <ForgotPasswordModal initialEmail={email} onClose={() => setShowForgotPassword(false)} />
            )}
        </div>
    );
};
