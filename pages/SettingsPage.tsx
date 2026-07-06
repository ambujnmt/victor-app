import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationsPanel from '../components/NotificationsPanel';
import { signOutUser, getLearningGroups, updateUserData, sendPasswordReset, enablePushNotifications, disablePushNotifications } from '../services/firebaseService';
import { 
    ArrowLeft, UserCheck, Users, HeartHandshake, Bell, 
    LogOut, PlusCircle, Smartphone, Share2, Download, 
    Globe, Check, Share, PlusSquare, CheckCircle2, ShieldCheck, Scale, FileSignature,
    ChevronRight, LifeBuoy, Lock, Key, Mail, Loader2
} from 'lucide-react';
import { LegalModal } from '../components/LegalModal';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const [isAssignedLeader, setIsAssignedLeader] = useState(false);
    const [canInstall, setCanInstall] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isTogglingPush, setIsTogglingPush] = useState(false);
    const [pushStatus, setPushStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Legal View State
    const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | 'impressum' | null>(null);

    useEffect(() => {
        const checkLeadership = async () => {
            if (user) {
                const learningGroups = await getLearningGroups();
                const isUserLeading = learningGroups.some(g => g.leaderId === user.id);
                setIsAssignedLeader(user.role === 'leader' || user.role === 'admin' || isUserLeading);
            }
        };
        checkLeadership();

        const checkStandalone = () => {
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
            setIsStandalone(isPWA);
        };
        checkStandalone();

        const detectIOS = () => {
            const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            setIsIOS(isIOSDevice);
        };
        detectIOS();

        const checkInstall = () => {
            if (window.deferredInstallPrompt) {
                setCanInstall(true);
            }
        };
        checkInstall();
        window.addEventListener('beforeinstallprompt', checkInstall);
        window.addEventListener('appinstalled', () => {
            setIsStandalone(true);
            setCanInstall(false);
        });

        return () => window.removeEventListener('beforeinstallprompt', checkInstall);
    }, [user]);

    const handleInstall = async () => {
        const promptEvent = window.deferredInstallPrompt;
        if (!promptEvent) return;
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
            window.deferredInstallPrompt = null;
            setCanInstall(false);
        }
    };

    const handleShareApp = async () => {
        const shareData = {
            title: 'Hey Life App',
            text: 'I want to invite you to join me on Hey Life! Let\'s grow in Spirit, Soul, and Body together.',
            url: window.location.origin
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(window.location.origin);
            alert('App link copied to clipboard!');
        }
    };

    const handleLanguageChange = async (newLang: 'English' | 'German') => {
        if (!user) return;
        setLanguage(newLang);
        await updateUserData(user.id, { language: newLang });
    };

    const handleReportProblem = () => {
        if (!user) return;
        const subject = `[Hey Life Support] Problem Report - ${user.name}`;
        const body = t('support.body_template', {
            name: user.name,
            id: user.id,
            platform: navigator.platform
        });
        const mailtoUrl = `mailto:office@heychurch.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        if (!window.confirm(`Send a password reset link to ${user.email}?`)) return;

        setIsResetting(true);
        try {
            await sendPasswordReset(user.email);
            setResetSuccess(true);
            setTimeout(() => setResetSuccess(false), 5000);
            alert("Reset email sent! Please check your inbox (and spam folder).");
        } catch (error) {
            console.error("Reset failed", error);
            alert("Failed to send reset email. Please try again later.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleTogglePush = async () => {
        if (!user) return;
        setIsTogglingPush(true);
        setPushStatus(null);
        try {
            if (user.pushNotificationsEnabled) {
                await disablePushNotifications(user.id);
                setPushStatus({ type: 'success', text: 'Push notifications turned off for this device.' });
            } else {
                await enablePushNotifications(user.id);
                setPushStatus({ type: 'success', text: 'This device is registered — token saved.' });
            }
        } catch (error: any) {
            console.error('Push notification toggle failed:', error);
            setPushStatus({ type: 'error', text: error?.message || 'Could not update push notification settings.' });
        } finally {
            setIsTogglingPush(false);
        }
    };

    const handleLogout = async () => {
        await signOutUser();
        navigate('/welcome');
    };

    if (!user) {
        return null;
    }

    const languages: { code: 'English' | 'German'; label: string }[] = [
        { code: 'English', label: 'English' },
        { code: 'German', label: 'Deutsch' },
    ];

    return (
        <div className="pt-[calc(env(safe-area-inset-top)+16px)] px-4 space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white pb-24">
            <div className="flex items-center">
                <button onClick={() => navigate('/my-plan')} className="text-[rgb(255_152_43)]">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-extrabold uppercase ml-4">{t('settings.title')}</h1>
            </div>

            {/* Account & Security Section */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Account Security</p>
                <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 relative overflow-hidden">
                    <Lock className="absolute -right-4 -bottom-4 text-white opacity-[0.03]" size={100} />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-[rgb(59_130_246/0.2)] rounded-xl">
                                <ShieldCheck className="text-[rgb(59_130_246)]" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-wide">Manage Password</h3>
                                <p className="text-[10px] text-gray-400 font-medium">Keep your account secure</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handlePasswordReset}
                            disabled={isResetting}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] ${
                                resetSuccess 
                                ? 'bg-[rgb(16_185_129/0.2)] border border-[rgb(16_185_129)] text-[rgb(16_185_129)]' 
                                : 'bg-gray-900 border border-gray-700 hover:border-[rgb(59_130_246)]'
                            }`}
                        >
                            <div className="flex items-center">
                                {isResetting ? <Loader2 size={18} className="animate-spin mr-3" /> : <Key size={18} className="mr-3 text-[rgb(255_152_43)]" />}
                                <span className="text-xs font-black uppercase tracking-widest">
                                    {resetSuccess ? 'Reset Email Sent!' : 'Change Password'}
                                </span>
                            </div>
                            {!resetSuccess && <ChevronRight size={16} className="text-gray-600" />}
                        </button>
                        
                        <p className="text-[9px] text-gray-500 italic text-center px-4 leading-relaxed">
                            Clicking the button above will send a secure link to <span className="text-gray-300 font-bold">{user.email}</span> to update your password.
                        </p>
                    </div>
                </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Language Settings</p>
                <div className="bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-700">
                    <div className="flex flex-col space-y-2">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                    language === lang.code 
                                        ? 'bg-[rgb(59_130_246/0.2)] text-white' 
                                        : 'hover:bg-gray-700 text-gray-400'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Globe size={18} className="mr-3 text-[rgb(255_152_43)]" />
                                    <span className="font-bold">{lang.label}</span>
                                </div>
                                {language === lang.code && <Check size={18} className="text-[rgb(59_130_246)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legal Section */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Legal & Privacy</p>
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                    <button onClick={() => setShowLegal('privacy')} className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-750 transition-colors border-b border-gray-700">
                        <div className="flex items-center">
                            <ShieldCheck size={18} className="mr-3 text-[rgb(59_130_246)]" />
                            <span className="text-sm font-bold uppercase tracking-tighter">{t('legal.view_privacy')}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-600"/>
                    </button>
                    <button onClick={() => setShowLegal('terms')} className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-750 transition-colors border-b border-gray-700">
                        <div className="flex items-center">
                            <Scale size={18} className="mr-3 text-[rgb(255_152_43)]" />
                            <span className="text-sm font-bold uppercase tracking-tighter">{t('legal.view_terms')}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-600"/>
                    </button>
                    <button onClick={() => setShowLegal('impressum')} className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-750 transition-colors">
                        <div className="flex items-center">
                            <FileSignature size={18} className="mr-3 text-[rgb(16_185_129)]" />
                            <span className="text-sm font-bold uppercase tracking-tighter">{t('legal.view_impressum')}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-600"/>
                    </button>
                </div>
            </div>

            {/* Installation & Sharing */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">App Experience</p>
                <div className="bg-gradient-to-br from-[rgb(59_130_246)] to-blue-700 rounded-[2.5rem] p-7 shadow-lg relative overflow-hidden">
                    <Smartphone className="absolute -right-4 -bottom-4 text-white opacity-10" size={120} />
                    
                    <div className="relative z-10">
                        <h3 className="font-black text-2xl uppercase tracking-tighter mb-1">Make it Official</h3>
                        
                        {isStandalone ? (
                            <div className="flex items-center space-x-2 text-blue-100 mb-6">
                                <CheckCircle2 size={18} className="text-[rgb(16_185_129)]" />
                                <p className="text-sm font-bold uppercase tracking-wider">App Successfully Installed</p>
                            </div>
                        ) : (
                            <p className="text-blue-100 text-sm mb-6 font-medium">Install Hey Life to your home screen for the fastest experience and offline access.</p>
                        )}

                        <div className="flex flex-col gap-3 relative z-10">
                            {isStandalone ? (
                                <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl py-4 flex items-center justify-center border border-white/20">
                                    <span className="font-black text-xs uppercase tracking-widest text-white/60 italic leading-none">Ready for the mission</span>
                                </div>
                            ) : isIOS ? (
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[rgb(251_191_36)] text-center">Safari Installation Guide</p>
                                    <div className="flex items-center justify-center space-x-4 text-sm font-bold text-white">
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white/20 p-2 rounded-lg mb-1"><Share size={18} /></div>
                                            <span className="text-[9px] uppercase">1. Tap Share</span>
                                        </div>
                                        <div className="h-4 w-px bg-white/20"></div>
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white/20 p-2 rounded-lg mb-1"><PlusSquare size={18} /></div>
                                            <span className="text-[9px] uppercase">2. Add to Home</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleInstall}
                                    disabled={!canInstall}
                                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                                        canInstall 
                                            ? 'bg-white text-[rgb(59_130_246)] shadow-xl scale-105 active:scale-95' 
                                            : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                                    }`}
                                >
                                    <Download size={20} /> {canInstall ? 'Install Now' : 'Check Browser Support'}
                                </button>
                            )}

                            <button 
                                onClick={handleShareApp}
                                className="w-full flex items-center justify-center gap-3 bg-[rgb(255,117,93)] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                            >
                                <Share2 size={20} /> Share With Friends
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Menu */}
            <div className="bg-gray-800 rounded-3xl shadow-lg overflow-hidden border border-gray-700">
                {user.role === 'admin' && (
                    <button onClick={() => navigate('/admin')} className="w-full text-left p-5 flex items-center font-bold text-[rgb(251_191_36)] hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                        <UserCheck className="mr-4" size={22} /> {t('settings.menu.admin')}
                    </button>
                )}
                
                {isAssignedLeader && (
                    <>
                        <button onClick={() => navigate('/leader-dashboard')} className="w-full text-left p-5 flex items-center font-bold text-[rgb(59_130_246)] hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                            <Users className="mr-4" size={22} /> {t('settings.menu.leader')}
                        </button>
                        <button 
                            onClick={() => navigate('/leader-dashboard', { state: { createNew: true } })} 
                            className="w-full text-left p-5 flex items-center font-bold text-[rgb(16_185_129)] hover:bg-gray-700/50 transition-colors border-b border-gray-700"
                        >
                            <PlusCircle className="mr-4" size={22} /> Create Group/Class
                        </button>
                    </>
                )}
                
                <button onClick={() => navigate('/giving')} className="w-full text-left p-5 flex items-center hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                    <HeartHandshake className="mr-4 text-gray-400" size={22} /> {t('settings.menu.giving')}
                </button>
                <button onClick={() => setShowNotifications(true)} className="w-full text-left p-5 flex items-center hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                    <Bell className="mr-4 text-gray-400" size={22} /> {t('settings.menu.notifications')}
                </button>
                <button
                    onClick={handleTogglePush}
                    disabled={isTogglingPush}
                    className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-700/50 transition-colors border-b border-gray-700"
                >
                    <span className="flex items-center">
                        <Bell className="mr-4 text-gray-400" size={22} /> Push Notifications
                    </span>
                    {isTogglingPush ? (
                        <Loader2 size={18} className="animate-spin text-gray-500" />
                    ) : (
                        <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${user.pushNotificationsEnabled ? 'bg-[rgb(16_185_129)] justify-end' : 'bg-gray-600 justify-start'}`}>
                            <div className="w-5 h-5 rounded-full bg-white shadow" />
                        </div>
                    )}
                </button>
                {pushStatus && (
                    <p className={`px-5 py-3 text-[10px] font-bold border-b border-gray-700 ${pushStatus.type === 'success' ? 'text-[rgb(16_185_129)] bg-[rgb(16_185_129/0.08)]' : 'text-red-400 bg-red-500/10'}`}>
                        {pushStatus.type === 'success' ? '✓ ' : '⚠ '}{pushStatus.text}
                    </p>
                )}

                {/* Support Button */}
                <button onClick={handleReportProblem} className="w-full text-left p-5 flex items-center hover:bg-gray-700/50 transition-colors border-b border-gray-700 text-gray-300">
                    <LifeBuoy className="mr-4 text-[rgb(59_130_246)]" size={22} /> {t('settings.menu.support')}
                </button>

                <button onClick={handleLogout} className="w-full text-left p-5 flex items-center text-[rgb(255_152_43)] hover:bg-gray-700/50 font-black uppercase tracking-widest transition-colors">
                    <LogOut className="mr-4" size={22} /> {t('settings.menu.logout')}
                </button>
            </div>

            <div className="text-center pt-10 opacity-30">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Hey Life Experience v1.2</p>
            </div>
            
            {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}

            <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />
        </div>
    );
};

export default SettingsPage;