import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Badge, Recommendation, Course, Challenge, GlobalContent, Certificate } from '../types';
import { Award, Bot, Settings, Dumbbell, Trophy, Users, GraduationCap, Shield, Footprints, Sparkles, Camera, Loader2, BookOpen, ChevronRight, HeartHandshake, QrCode, Lock, X, Gift, FileText, CheckCircle2, Activity, LifeBuoy, Key } from 'lucide-react';
import { generateGrowthJourney } from '../services/geminiService';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { getCourses, getChallenges, updateUserProfilePicture, getGlobalContent } from '../services/firebaseService';
import { ALL_BADGES } from '../constants/staticData';
import { useLanguage } from '../contexts/LanguageContext';
import { getPersonalizedRecommendations } from '../services/recommendationService';
import { CertificateModal } from '../components/CertificateModal';

const badgeIcons: { [key: string]: React.ElementType } = {
    GraduationCap, Shield, Trophy, Users, Dumbbell, Footprints,
};

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-[#8B5CF6] text-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2 flex items-center"><Sparkles className="mr-3 text-[rgb(251_191_36)]"/> {t('recommendation.title')}</h3>
            <p className="font-bold text-lg text-white">{t(recommendation.titleKey)}</p>
            <p className="text-sm text-gray-300 my-2">{t(recommendation.reasonKey)}</p>
            <Link to={recommendation.link} className="w-full mt-4 inline-flex items-center justify-center bg-white text-[#8B5CF6] font-bold py-3 px-4 rounded-full transition-transform hover:scale-105">
                {t('recommendation.start_now')}
            </Link>
        </div>
    );
};

const BadgeDisplay: React.FC<{ badge: Badge & {isEarned: boolean}, t: (key: string, options?: any) => string }> = ({ badge, t }) => {
    const Icon = badgeIcons[badge.icon] || Award;
    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-2xl w-24 h-28 flex-shrink-0 transition-all ${badge.isEarned ? 'bg-gradient-to-br from-[#1e4b8a] to-[#133666] border border-[rgb(251_191_36/0.3)] shadow-lg' : 'bg-gray-800/50 opacity-60 grayscale'}`}>
            <Icon size={28} className={`mb-2 ${badge.isEarned ? 'text-[rgb(251_191_36)]' : 'text-gray-400'}`} />
            <p className="text-xs font-bold text-center leading-tight">{t(badge.name)}</p>
        </div>
    );
};

interface ActionCardProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    fullWidth?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, icon: Icon, children, actionLabel, onAction, className = '', fullWidth = false }) => {
    const hasBg = className.includes('bg-');
    const baseClass = hasBg ? className : `bg-[#133666] ${className}`;

    return (
        <div className={`${baseClass} rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            
            <div className={fullWidth ? 'md:flex md:items-start md:justify-between' : ''}>
                <div className="flex-grow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 bg-white/10 rounded-lg mr-3 shadow-inner">
                            <Icon size={20} className="text-white" />
                        </div>
                        <h3 className="font-bold text-lg text-white uppercase tracking-wide">{title}</h3>
                    </div>
                    <div className="mb-4">
                        {children}
                    </div>
                </div>
                
                {actionLabel && onAction && (
                    <div className={fullWidth ? 'md:self-center md:ml-6 md:min-w-[160px]' : 'mt-auto'}>
                        <button 
                            onClick={onAction}
                            className="w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center shadow-lg"
                        >
                            {actionLabel} <ChevronRight size={18} className="ml-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const MyPlanPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [goal, setGoal] = useState('');
  const [journey, setJourney] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchAppData = async () => {
        if (!user) return;
        const [courses, challenges] = await Promise.all([
            getCourses(),
            getChallenges()
        ]);
        const recs = getPersonalizedRecommendations(user, courses, challenges);
        setRecommendation(recs.length > 0 ? recs[0] : null);
    };
    fetchAppData();
  }, [user]);

  const handleGenerateJourney = async () => {
    if (!goal.trim() || !user) return;
    
    setIsLoading(true);
    setError(null);
    setJourney(null);
    try {
      const courses = await getCourses();
      const result = await generateGrowthJourney(goal, courses, user);
      setJourney(result);
    } catch (e: any) {
      setError('Failed to generate growth journey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        setIsUploading(true);
        try {
            const base64String = await resizeImage(file);
            await updateUserProfilePicture(user.id, base64String);
        } catch (error) {
            console.error("Failed to upload profile picture:", error);
            alert("Failed to upload profile picture. Please try again.");
        } finally {
            setIsUploading(false);
        }
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

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 512;
                    const MAX_HEIGHT = 512;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Could not get canvas context'));
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

  const earnedBadgesCount = user?.badges?.length || 0;
  const earnedBadges = useMemo(() => {
    const earnedIds = new Set(user?.badges?.map(b => b.id));
    return ALL_BADGES.map(b => ({
      ...b,
      dateEarned: user?.badges?.find(ub => ub.id === b.id)?.dateEarned || '',
      isEarned: earnedIds.has(b.id)
    })).sort((a, b) => Number(b.isEarned) - Number(a.isEarned));
  }, [user?.badges]);
  
  if (!user) return <div className="p-4 text-white">Loading plan...</div>;
  
  const calculateCurrentWeek = () => {
    if (!user.workoutPlan || !user.workoutPlanStartDate) return 1;
    const startDate = new Date(user.workoutPlanStartDate);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = today.getTime() - startDate.getTime();
    const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));
    return Math.min(Math.max(1, Math.floor(daysPassed / 7) + 1), user.workoutPlan.duration);
  };
  const currentWorkoutWeek = calculateCurrentWeek();

  return (
    <div className="p-4 pb-24 space-y-6 bg-gray-900 min-h-screen text-white font-sans">
      
      {/* Profile Header */}
      <div className="relative pt-4 pb-6 flex flex-col items-center">
        <div className="absolute top-2 right-0">
            <button onClick={() => navigate('/settings')} className="bg-[#133666] p-2.5 rounded-xl hover:bg-opacity-80 transition-colors shadow-md">
                <Settings size={22} className="text-gray-200" />
            </button>
        </div>
        <div className="relative group">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[rgb(255_117_93)] to-[rgb(255_152_43)]">
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full border-4 border-gray-900 object-cover" />
            </div>
            <button onClick={handleAvatarClick} className="absolute bottom-1 right-1 bg-[#133666] p-2 rounded-full text-white hover:bg-[rgb(255_117_93)] transition-colors border-2 border-gray-900 shadow-sm" disabled={isUploading}>
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
        <div className="text-center mt-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
            <p className="text-sm text-gray-400 font-medium">{t('my_plan.member_since', {date: new Date(user.joinDate).getFullYear()})}</p>
        </div>
      </div>

      <div className="space-y-6">
        {recommendation && <RecommendationCard recommendation={recommendation} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard title={t('my_plan.journal.title')} icon={BookOpen} actionLabel={t('my_plan.journal.open')} onAction={() => navigate('/journal')} className="bg-gradient-to-br from-[#133666] to-[#0f2a50]">
                <p className="text-gray-300 text-sm mb-2">{t('my_plan.journal.subtitle')}</p>
                <div className="flex items-center text-xs text-[rgb(255_152_43)] font-bold"><span className="bg-white/10 px-2 py-1 rounded-md">🔥 {user.journalStreak || 0} Day Streak</span></div>
            </ActionCard>

            <ActionCard title={t('my_plan.workout.title')} icon={Dumbbell} actionLabel={user.workoutPlan ? t('my_plan.workout.view_plan') : t('my_plan.workout.create_plan')} onAction={() => navigate(user.workoutPlan ? '/workout-plan' : '/workout-onboarding')} className="bg-[rgb(59_130_246)]">
                {user.workoutPlan ? (
                    <div>
                        <p className="text-white font-bold text-lg mb-1">{t('my_plan.workout.active_title', {duration: user.workoutPlan.duration})}</p>
                        <p className="text-sm text-blue-100 mb-3">{t('my_plan.workout.active_subtitle', {current: currentWorkoutWeek, duration: user.workoutPlan.duration})}</p>
                        <div className="w-full bg-blue-800/50 rounded-full h-2"><div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${(currentWorkoutWeek / user.workoutPlan.duration) * 100}%` }}></div></div>
                    </div>
                ) : (
                    <p className="text-blue-100 text-sm">{t('my_plan.workout.inactive_subtitle')}</p>
                )}
            </ActionCard>
        </div>

        {/* Generosity Section */}
        <ActionCard title="Generosity" icon={HeartHandshake} actionLabel="Give Now" onAction={() => navigate('/giving')} className="bg-[#E85A37]" fullWidth={true}>
            <p className="text-white font-medium text-lg leading-relaxed mb-3">"God loves a cheerful giver." Your gift fuels the mission.</p>
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {[25, 50, 100, 150, 250].map(amt => (
                    <button key={amt} onClick={(e) => { e.stopPropagation(); navigate('/giving', { state: { amount: amt } }); }} className="bg-white/20 hover:bg-white/40 transition-colors text-white font-bold px-4 py-2 rounded-full text-sm active:scale-95 flex-shrink-0">€{amt}</button>
                ))}
            </div>
        </ActionCard>

        {/* AI Growth Section */}
        <div className="bg-[#133666] rounded-2xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            <div className="flex items-center mb-4">
                <div className="p-2 bg-white/10 rounded-lg mr-3 shadow-inner">
                    <Bot size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-lg text-white uppercase tracking-wide">{t('my_plan.ai.title')}</h3>
            </div>
            
            <p className="text-sm text-gray-300 mb-3 leading-tight">{t('my_plan.ai.subtitle')}</p>
            <div className="flex gap-2">
                <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t('my_plan.ai.placeholder')} className="flex-grow p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm" />
                <button onClick={handleGenerateJourney} disabled={isLoading} className="bg-[rgb(255_117_93)] text-white px-4 rounded-xl font-bold disabled:bg-gray-700 transition-colors">
                    {isLoading ? <Loader2 className="animate-spin" size={18}/> : t('my_plan.ai.go')}
                </button>
            </div>
            {error && <p className="text-red-400 text-xs bg-red-900/20 p-2 mt-2 rounded-lg">{error}</p>}
            {journey && (
                <div className="mt-4 p-4 bg-gray-950 rounded-xl border border-white/5 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
                    <p className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">{journey}</p>
                </div>
            )}
        </div>

        {/* --- REWARDS & ACTIVITY SECTION --- */}
        <div className="bg-[#133666] rounded-2xl p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-white uppercase flex items-center">
                    <Trophy className="mr-2 text-[rgb(251_191_36)]" size={20}/> My Rewards & Activity
                </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/40 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('my_plan.stats.points')}</p>
                    <p className="text-2xl font-extrabold text-[rgb(251_191_36)]">{user.points.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900/40 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Badges Earned</p>
                    <p className="text-2xl font-extrabold text-[rgb(59_130_246)]">{earnedBadgesCount}</p>
                </div>
            </div>
            
            <div className="bg-gray-900/30 p-4 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Latest Activity</p>
                    <Activity size={14} className="text-[rgb(255_152_43)]" />
                </div>
                <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                    {earnedBadges.filter(b => b.isEarned).slice(0, 5).map(badge => (
                        <div key={badge.id} className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                            {React.createElement(badgeIcons[badge.icon] || Award, { size: 20, className: "text-[rgb(251_191_36)]" })}
                        </div>
                    ))}
                    {earnedBadgesCount === 0 && <p className="text-xs text-gray-500 italic">No activity yet. Start your journey!</p>}
                </div>
            </div>

            <div className="mt-auto">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Upcoming Milestones</p>
                <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
                    {earnedBadges.filter(b => !b.isEarned).slice(0, 4).map(badge => (
                        <BadgeDisplay key={badge.id} badge={badge} t={t} />
                    ))}
                </div>
            </div>
        </div>

        {/* --- DIGITAL CREDENTIALS GALLERY --- */}
        <div className="bg-[#133666] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-white/10 rounded-lg mr-3 shadow-inner">
                    <FileText size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-lg text-white uppercase tracking-wide">My Credentials</h3>
            </div>
            
            {user.certificates && user.certificates.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                    {user.certificates.map(cert => (
                        <button 
                            key={cert.id}
                            onClick={() => setSelectedCert(cert)}
                            className="bg-gray-900/40 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center group hover:bg-gray-900/60 transition-all hover:scale-[1.02]"
                        >
                            <div className="w-12 h-12 bg-[rgb(251_191_36/0.2)] rounded-full flex items-center justify-center mb-3 text-[rgb(251_191_36)] group-hover:scale-110 transition-transform">
                                <Award size={24} />
                            </div>
                            <p className="text-[10px] font-black uppercase text-[rgb(255_152_43)] mb-1 leading-tight">{cert.courseTitle}</p>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{new Date(cert.dateIssued).toLocaleDateString()}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="bg-black/20 rounded-xl p-8 text-center border-2 border-dashed border-gray-700">
                    <Trophy size={32} className="mx-auto text-gray-700 mb-2 opacity-30" />
                    <p className="text-sm text-gray-500 font-medium">Complete courses in the Academy to earn your first certificate.</p>
                </div>
            )}
        </div>

        {/* Quick Help Link */}
        <div className="flex justify-center pt-4 pb-8">
            <button 
                onClick={handleReportProblem}
                className="flex items-center text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
                <LifeBuoy size={16} className="mr-2" />
                {t('my_plan.help_link')}
            </button>
        </div>
      </div>

      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};

export default MyPlanPage;