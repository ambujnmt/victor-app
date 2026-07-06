import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { updateUserData } from '../services/firebaseService';
import { generateAssessmentFeedback } from '../services/geminiService';
import { getDailySpiritSnack } from '../constants/staticData';
import { 
    ArrowLeft, ArrowRight, CheckCircle, Trophy, 
    Sparkles, Heart, Activity, Gift, Users, Star, 
    Flame, Loader2, Compass, Zap, Map as MapIcon,
    Quote, ExternalLink, Signature, BookOpen, ChevronRight, MessageSquare, Key
} from 'lucide-react';
import { AssessmentResult } from '../types';
import { GuidedPrayerModal } from '../components/GuidedPrayerModal';
import InviteFriendModal from '../components/InviteFriendModal';

const PASTOR_VICTOR_IMAGE = "https://api.dicebear.com/7.x/avataaars/svg?seed=Victor&clothing=hoodie&skinColor=black";
const FALLBACK_PASTOR_IMAGE = "https://ui-avatars.com/api/?name=Victor+Akko&background=random";

interface Question {
    key: string;
    category: string;
}

const CATEGORIES = [
    { id: 'daily_walk', label: 'Daily Walk', icon: Flame, color: '#3B82F6', externalUrl: 'https://heychurch.de/taufe' },
    { id: 'relationships', label: 'Relationships', icon: Users, color: '#8B5CF6', externalUrl: 'https://heychurch.de/fams' },
    { id: 'serve', label: 'Serve Others', icon: Heart, color: '#10B981', externalUrl: 'https://heychurch.de/hero' },
    { id: 'mission', label: 'Make God Known', icon: Zap, color: '#FBBF24', internalAction: 'challenges' },
    { id: 'generosity', label: 'Generosity', icon: Gift, color: '#FF755D', externalUrl: 'https://heychurch.de/generosity' }
];

const QUESTIONS: Question[] = [
    { category: 'daily_walk', key: 'q.daily_walk.1' }, { category: 'daily_walk', key: 'q.daily_walk.2' }, { category: 'daily_walk', key: 'q.daily_walk.3' }, { category: 'daily_walk', key: 'q.daily_walk.4' }, { category: 'daily_walk', key: 'q.daily_walk.5' }, { category: 'daily_walk', key: 'q.daily_walk.6' },
    { category: 'relationships', key: 'q.relationships.1' }, { category: 'relationships', key: 'q.relationships.2' }, { category: 'relationships', key: 'q.relationships.3' }, { category: 'relationships', key: 'q.relationships.4' }, { category: 'relationships', key: 'q.relationships.5' }, { category: 'relationships', key: 'q.relationships.6' },
    { category: 'serve', key: 'q.serve.1' }, { category: 'serve', key: 'q.serve.2' }, { category: 'serve', key: 'q.serve.3' }, { category: 'serve', key: 'q.serve.4' }, { category: 'serve', key: 'q.serve.5' }, { category: 'serve', key: 'q.serve.6' },
    { category: 'mission', key: 'q.mission.1' }, { category: 'mission', key: 'q.mission.2' }, { category: 'mission', key: 'q.mission.3' }, { category: 'mission', key: 'q.mission.4' }, { category: 'mission', key: 'q.mission.5' }, { category: 'mission', key: 'q.mission.6' },
    { category: 'generosity', key: 'q.generosity.1' }, { category: 'generosity', key: 'q.generosity.2' }, { category: 'generosity', key: 'q.generosity.3' }, { category: 'generosity', key: 'q.generosity.4' }, { category: 'generosity', key: 'q.generosity.5' }, { category: 'generosity', key: 'q.generosity.6' }
];

const RadarChart: React.FC<{ scores: { [key: string]: number } }> = ({ scores }) => {
    const size = 200;
    const center = size / 2;
    const radius = size * 0.38;
    const points = CATEGORIES.map((cat, i) => {
        const score = scores[cat.id] || 0;
        const angle = (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2;
        const r = (score / 10) * radius;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    const grids = [0.2, 0.4, 0.6, 0.8, 1].map(factor => (
        <polygon key={factor} points={CATEGORIES.map((_, i) => {
            const angle = (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2;
            return `${center + radius * factor * Math.cos(angle)},${center + radius * factor * Math.sin(angle)}`;
        }).join(' ')} className="fill-none stroke-white/10 stroke-1" />
    ));
    return (
        <svg width={size} height={size} className="mx-auto overflow-visible drop-shadow-[0_0_15px_rgba(251,191,36,0.15)] font-sans">
            {grids}
            <polygon points={points} className="fill-[rgb(251_191_36/0.2)] stroke-[rgb(251_191_36)] stroke-[2] transition-all duration-1000 ease-out" />
            {CATEGORIES.map((cat, i) => {
                const angle = (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2;
                const r = (scores[cat.id] / 10) * radius;
                return <circle key={i} cx={center + r * Math.cos(angle)} cy={center + r * Math.sin(angle)} r="4" fill={cat.color} className="stroke-white stroke-1" />;
            })}
        </svg>
    );
};

const AssessmentPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [showIntro, setShowIntro] = useState(true);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>(new Array(QUESTIONS.length).fill(5));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [showSpiritSnack, setShowSpiritSnack] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const spiritSnack = useMemo(() => getDailySpiritSnack(), []);

    const categoryAverages = useMemo(() => {
        const results: { [key: string]: number } = {};
        CATEGORIES.forEach(cat => {
            const catQs = QUESTIONS.map((q, i) => ({ ...q, index: i })).filter(q => q.category === cat.id);
            results[cat.id] = catQs.reduce((acc, q) => acc + answers[q.index], 0) / (catQs.length || 1);
        });
        return results;
    }, [answers]);

    const calculatePriorityLowest = (averages: { [key: string]: number }) => {
        const entries = Object.entries(averages).sort((a, b) => (a[1] as number) - (b[1] as number));
        const lowestValue = entries[0][1];
        const closeToLowest = entries.filter(e => (e[1] as number) - lowestValue < 0.5).map(e => e[0]);
        
        const priorityOrder = ['daily_walk', 'relationships', 'serve', 'mission', 'generosity'];
        let resultId = entries[0][0];
        for (const p of priorityOrder) {
            if (closeToLowest.includes(p)) {
                resultId = p;
                break;
            }
        }
        return resultId;
    };

    const handleNext = async () => {
        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            setIsSubmitting(true);
            try {
                const feedbackText = await generateAssessmentFeedback(user!, categoryAverages);
                setFeedback(feedbackText);
                const lowestId = calculatePriorityLowest(categoryAverages);
                const result: AssessmentResult = { 
                    date: new Date().toISOString(), 
                    scores: categoryAverages, 
                    feedback: feedbackText, 
                    lowestCategory: lowestId 
                };
                await updateUserData(user!.id, { 
                    assessmentResults: [result, ...(user!.assessmentResults || [])], 
                    points: (user!.points || 0) + 250 
                });
                setShowResults(true);
            } catch (e: any) {
                console.error(e);
                alert("Pastor Victor's assistant is busy right now. Please try submitting again in a few seconds.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    if (showIntro) {
        return (
            <div className="h-screen bg-[rgb(19,54,102)] text-white pt-[calc(env(safe-area-inset-top)+16px)] px-4 flex flex-col justify-between animate-in fade-in duration-700 font-sans overflow-hidden">
                <div className="max-w-md mx-auto w-full space-y-3 pt-2">
                    <div className="text-center">
                        <h1 className="text-4xl font-black text-[rgb(255,117,93)] mb-0.5">Faith check</h1>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Visualize your growth</p>
                    </div>
                    <div className="space-y-2">
                        <div className="bg-[#243B5E] p-4 rounded-2xl border border-white/5 flex gap-4">
                            <div className="bg-[rgb(59_130_246/0.2)] p-2 rounded-xl h-fit self-center"><MapIcon size={18} className="text-[rgb(59_130_246)]"/></div>
                            <div>
                                <h3 className="text-[rgb(59_130_246)] font-bold text-xs mb-0.5 uppercase tracking-wide">The Why</h3>
                                <p className="text-[11px] text-gray-300 leading-snug font-medium">{t('assessment.intro.why.desc')}</p>
                            </div>
                        </div>
                        <div className="bg-[#243B5E] p-4 rounded-2xl border border-white/5 flex gap-4">
                            <div className="bg-[rgb(251_191_36/0.2)] p-2 rounded-xl h-fit self-center"><Sparkles size={18} className="text-[rgb(251_191_36)]"/></div>
                            <div>
                                <h3 className="text-[rgb(251_191_36)] font-bold text-xs mb-0.5 uppercase tracking-wide">The What</h3>
                                <p className="text-[11px] text-gray-300 leading-snug font-medium">{t('assessment.intro.what.desc')}</p>
                            </div>
                        </div>
                        <div className="bg-[#243B5E] p-4 rounded-2xl border border-white/5 flex gap-4">
                            <div className="bg-[rgb(255_117_93/0.2)] p-2 rounded-xl h-fit self-center"><Activity size={18} className="text-[rgb(255_117_93)]"/></div>
                            <div>
                                <h3 className="text-[rgb(255_117_93)] font-bold text-xs mb-0.5 uppercase tracking-wide">The How</h3>
                                <p className="text-[11px] text-gray-300 leading-snug font-medium">{t('assessment.intro.how.desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-md mx-auto w-full pb-8">
                    <button onClick={() => setShowIntro(false)} className="w-full bg-[rgb(239_109_77)] text-white py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
                        {t('assessment.start')}
                    </button>
                </div>
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="h-screen bg-[rgb(19,54,102)] flex flex-col items-center justify-center text-center p-8 font-sans overflow-hidden">
                <Compass size={64} className="text-[rgb(251_191_36)] animate-spin-slow mb-6" />
                <h2 className="text-2xl font-black">Mapping your journey...</h2>
                <p className="text-gray-400 mt-4 max-w-xs text-xs font-bold uppercase tracking-widest leading-loose">Pastor Victor is analyzing your growth map.</p>
            </div>
        );
    }

    if (showResults) {
        const lowestId = calculatePriorityLowest(categoryAverages);
        const lowest = CATEGORIES.find(c => c.id === lowestId)!;
        return (
            <div className="min-h-screen bg-[rgb(19,54,102)] text-white pt-[env(safe-area-inset-top)] px-4 flex flex-col justify-between">
                <div className="max-w-md mx-auto space-y-5 pb-12">
                    <div className="text-center pt-2">
                        <Trophy className="text-[rgb(251_191_36)] mx-auto mb-1" size={32}/>
                        <h1 className="text-2xl font-black">Faith check map</h1>
                        <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Growth visualized</p>
                    </div>

                    <div className="bg-gray-800/60 rounded-[2rem] p-4 border border-white/5 shadow-xl backdrop-blur-md flex justify-center">
                        <RadarChart scores={categoryAverages}/>
                    </div>

                    <div className="bg-white text-gray-900 rounded-[1.8rem] p-6 shadow-xl relative overflow-hidden border border-[rgb(251_191_36/0.1)]">
                        <div className="flex items-center mb-4 border-b pb-4">
                            <div className="relative">
                                <img src={PASTOR_VICTOR_IMAGE} className="w-12 h-12 rounded-full border-2 border-[rgb(255,117,93)] mr-3 object-cover" onError={(e) => (e.currentTarget.src = FALLBACK_PASTOR_IMAGE)}/>
                                <div className="absolute -bottom-1 -right-1 bg-[rgb(16_185_129)] p-0.5 rounded-full border border-white"><CheckCircle size={10} className="text-white"/></div>
                            </div>
                            <div>
                                <h3 className="font-black text-base leading-none">Pastor Victor</h3>
                                <p className="text-[9px] font-bold text-[rgb(239_109_77)] uppercase tracking-widest mt-1">Visionary Leader</p>
                            </div>
                        </div>
                        <div className="prose prose-sm leading-relaxed font-sans text-sm font-medium text-gray-700">
                            {feedback.split('\n').map((p, i) => p.trim() ? (
                                <p key={i} className="mb-3">
                                    {p.split('**').map((part, j) => j % 2 === 1 ? (
                                        <strong key={j} className="text-[#E85A37] font-black">{part}</strong>
                                    ) : part)}
                                </p>
                            ) : null)}
                        </div>
                    </div>

                    {/* --- NEXT STEP SCRIPT CONTENT --- */}
                    <div className="bg-[#133666] border border-[rgb(251_191_36/0.3)] rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[rgb(251_191_36/0.5)] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <div className="space-y-1">
                            <span className="bg-[rgb(251_191_36)] text-black px-4 py-1 rounded-full text-[9px] font-black tracking-widest inline-block uppercase shadow-lg">Your next quest</span>
                            <h3 className="text-2xl font-black text-white leading-tight pt-3">{t(`assessment.next.${lowest.id}.title`)}</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-blue-50/90 leading-relaxed whitespace-pre-wrap">
                                {t(`assessment.next.${lowest.id}.text`)}
                            </p>
                            <p className="text-sm italic font-bold text-[rgb(251_191_36)] border-t border-white/10 pt-4">
                                "{t(`assessment.next.${lowest.id}.footer`)}"
                            </p>
                        </div>

                        <button 
                            onClick={() => {
                                if (lowest.externalUrl) {
                                    window.open(lowest.externalUrl, '_blank');
                                } else if (lowest.internalAction === 'challenges') {
                                    navigate('/challenges');
                                }
                            }}
                            className="w-full bg-white text-[#133666] py-5 rounded-2xl font-black shadow-[0_15px_30px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center group"
                        >
                            {t(`assessment.next.${lowest.id}.cta`)}
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                        </button>
                    </div>

                    <button 
                        onClick={() => navigate('/home')} 
                        className="w-full py-2 text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {showSpiritSnack && <GuidedPrayerModal snack={spiritSnack} onClose={() => setShowSpiritSnack(false)}/>}
                {showInvite && user && (
                    <InviteFriendModal 
                        user={user} 
                        onClose={() => setShowInvite(false)} 
                        target={{ 
                            id: 'home', 
                            title: 'Hey Life App', 
                            type: 'lesson', 
                            data: { title: 'Hey Life App' }, 
                            courseId: 'app' 
                        }}
                    />
                )}
            </div>
        );
    }

    const current = QUESTIONS[step];
    const cat = CATEGORIES.find(c => c.id === current.category)!;

    const progress = ((step + 1) / QUESTIONS.length) * 100;
    const isPercentQuestion = current.key === 'q.generosity.1';

    return (  
              <div className="min-h-screen bg-[rgb(19,54,102)] text-white flex flex-col items-center overflow-y-auto font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">          
               <div className="w-full max-w-md h-full flex flex-col p-6 justify-between">
                <div className="flex items-center justify-between w-full pt-1">
                    <button onClick={() => navigate('/home')} className="text-gray-500 p-1 hover:text-white transition-colors"><ArrowLeft size={20}/></button>
                    <div className="flex-grow mx-4 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className="h-full bg-[rgb(255_117_93)] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black text-gray-500 tabular-nums tracking-widest uppercase">{step+1} / 30</span>
                </div>
                
                <div className="flex flex-col justify-center space-y-4 flex-grow py-2">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 shadow-sm">
                            <cat.icon size={18} className="text-[rgb(59_130_246)]" />
                        </div>
                        <span className="text-xs font-black tracking-[0.1em] text-[rgb(251_191_36)] uppercase">{cat.label}</span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold leading-tight text-white animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {t(current.key)}
                    </h2>

                    <div className="space-y-4 relative pt-4 flex flex-col items-center">
                        <div className="bg-[rgb(255,117,93)]/10 border border-[rgb(255,117,93)]/30 w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,117,93,0.1)] relative">
                             <div className="absolute -top-3 bg-[rgb(255,117,93)] text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">Score</div>
                            <span className="text-4xl font-black text-[rgb(255,117,93)] tabular-nums">
                                {answers[step]}{isPercentQuestion ? '%' : ''}
                            </span>
                        </div>
                        
                        <div className="relative w-full px-1">
                            <input 
                                type="range" 
                                min={isPercentQuestion ? "1" : "0"} 
                                max="10" 
                                step="1" 
                                value={answers[step]} 
                                onChange={(e) => { const newAns = [...answers]; newAns[step] = parseInt(e.target.value); setAnswers(newAns); }} 
                                className="w-full h-4 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[rgb(255,117,93)] shadow-inner" 
                            />
                            <div className="flex justify-between text-[10px] font-black text-gray-500 tracking-wider uppercase mt-3">
                                <span className="flex flex-col items-center">
                                    <span className="text-sm font-black mb-0.5 text-white/40">{isPercentQuestion ? '1%' : '0'}</span>
                                    <span>{isPercentQuestion ? 'Starting' : t('assessment.not_at_all')}</span>
                                </span>
                                <span className="flex flex-col items-center">
                                    <span className="text-sm font-black mb-0.5 text-white/40">{isPercentQuestion ? '10%' : '10'}</span>
                                    <span>{isPercentQuestion ? 'Ideal' : t('assessment.totally_true')}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-2 pb-6 pt-4">
                    <button 
                        onClick={handleNext} 
                        className="w-full bg-white text-[#133666] py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center group uppercase tracking-widest"
                    >
                        <span>{step === 29 ? 'Show my results' : 'Next step'}</span>
                        <ArrowRight className="ml-2.5 group-hover:translate-x-1 transition-transform" size={20}/>
                    </button>
                    {step > 0 && (
                        <button 
                            onClick={() => setStep(step - 1)} 
                            className="w-full text-gray-500 font-bold text-[10px] tracking-widest py-1.5 hover:text-white transition-colors uppercase"
                        >
                            Go back
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssessmentPage;