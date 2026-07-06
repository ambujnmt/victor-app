
import React, { useState, useEffect, useRef } from 'react';
import { User, LatestMessage, SpiritSnack, ActiveChallenge, AppNotification } from '../types';
import { QUOTES, LATEST_MESSAGE as fallbackMessage, getDailySpiritSnack } from '../constants/staticData';
import {
    PlayCircle, Dumbbell, Sparkles, Gift, HandHelping,
    Globe, BookText, ChevronRight, ChevronLeft, UserPlus, Trophy,
    Play, Share2, Quote, ArrowRight, MessageSquare,
    PenLine, BookOpen, Bell, CheckCircle2, Plus, Target, Compass,
    Check, ThumbsDown, Loader2, Mail
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../App';
import { getGlobalContent, completeChallengeDay, getActiveChallengeProgress, respondToChallengeInvitation } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';
import { GuidedPrayerModal } from '../components/GuidedPrayerModal';
import InviteFriendModal from '../components/InviteFriendModal';

const VideoPlayerModal: React.FC<{ videoId: string; onClose: () => void }> = ({ videoId, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="aspect-video bg-black">
                    <iframe 
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`}
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
                <button onClick={onClose} className="w-full py-4 bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors uppercase tracking-widest text-xs">Close Player</button>
            </div>
        </div>
    );
};

const FeatureBox: React.FC<{ 
    title: string; 
    icon: React.ElementType; 
    color: string; 
    onClick: () => void;
    accentColor?: string;
}> = ({ title, icon: Icon, color, onClick, accentColor = "bg-white/20" }) => (
    <button 
        onClick={onClick}
        className={`${color} rounded-[2rem] p-6 flex flex-col justify-between items-start text-left shadow-xl transition-all active:scale-[0.98] hover:brightness-110 h-36 w-full border border-white/5 relative overflow-hidden group`}
    >
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
            <Icon size={100} className="text-white" />
        </div>
        
        <div className={`${accentColor} w-11 h-11 rounded-2xl flex items-center justify-center mb-2 relative z-10 shadow-inner`}>
            <Icon size={22} className="text-white" />
        </div>
        
        <div className="relative z-10">
            <h3 className="font-black text-white text-xs uppercase tracking-widest leading-none mb-1">{title}</h3>
            <div className="w-6 h-0.5 bg-white/40 rounded-full"></div>
        </div>
    </button>
);

const ChallengeCarouselItem: React.FC<{ challenge: ActiveChallenge, onComplete: (id: string) => Promise<void> }> = ({ challenge, onComplete }) => {
    const progress = (challenge.completedDays / challenge.duration) * 100;
    const { t } = useLanguage();
    const [isCompleting, setIsCompleting] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCompleting) return;
        setIsCompleting(true);
        try {
            await onComplete(challenge.id);
        } catch (err) {
            console.error("Failed to mark today as complete:", err);
            alert("Could not mark today as complete. Please try again.");
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="bg-[#EF6D4D] rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden border border-white/10">
            <div className="relative z-10">
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-2 bg-black/10 inline-block px-3 py-1 rounded-full">
                    Day {challenge.completedDays + 1} of {challenge.duration}
                </p>
                <h3 className="text-2xl font-black text-white leading-tight mb-4 tracking-tighter">{t(challenge.title)}</h3>

                <div className="mb-6">
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-white h-full transition-all duration-1000 shadow-[0_0_10px_white]" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <button
                    onClick={handleClick}
                    disabled={isCompleting}
                    className="w-full bg-white text-[#EF6D4D] py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-100 transition-all active:scale-95 shadow-lg border-b-4 border-gray-200 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center"
                >
                    {isCompleting ? <Loader2 size={16} className="animate-spin" /> : 'Mark Today as Complete'}
                </button>
            </div>
            <Trophy className="absolute -right-6 -bottom-6 text-white/10" size={140} />
        </div>
    );
};

const ChallengeInviteCard: React.FC<{ notification: AppNotification, onRespond: (notification: AppNotification, accepted: boolean) => Promise<void> }> = ({ notification, onRespond }) => {
    const [isResponding, setIsResponding] = useState<'accept' | 'decline' | null>(null);

    const handleClick = async (accepted: boolean) => {
        if (isResponding) return;
        setIsResponding(accepted ? 'accept' : 'decline');
        try {
            await onRespond(notification, accepted);
        } finally {
            setIsResponding(null);
        }
    };

    return (
        <div className="bg-gray-800 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden border-2 border-dashed border-[rgb(59_130_246)]/50">
            <div className="relative z-10">
                <p className="text-[10px] font-black text-[rgb(59_130_246)] uppercase tracking-widest mb-2 bg-[rgb(59_130_246)]/10 inline-block px-3 py-1 rounded-full">
                    Quest Invitation
                </p>
                <h3 className="text-lg font-black text-white leading-tight mb-6 tracking-tight">{notification.text}</h3>

                <div className="flex space-x-3">
                    <button
                        onClick={() => handleClick(true)}
                        disabled={!!isResponding}
                        className="flex-1 bg-[rgb(16_185_129)] hover:brightness-110 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center shadow-lg transition-all active:scale-95"
                    >
                        {isResponding === 'accept' ? <Loader2 size={16} className="animate-spin mr-2" /> : <Check size={16} className="mr-2" />} Accept
                    </button>
                    <button
                        onClick={() => handleClick(false)}
                        disabled={!!isResponding}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center transition-all active:scale-95"
                    >
                        {isResponding === 'decline' ? <Loader2 size={16} className="animate-spin mr-2" /> : <ThumbsDown size={16} className="mr-2" />} Decline
                    </button>
                </div>
            </div>
            <Mail className="absolute -right-6 -bottom-6 text-white/5" size={140} />
        </div>
    );
};

const HomePage: React.FC = () => {
  const { user, notifications } = useAuth();
  const { onToggleNotifications } = useOutletContext<{ onToggleNotifications: () => void }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [spiritSnack, setSpiritSnack] = useState<SpiritSnack | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{text: string, keywords: string[]} | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [latestMessage, setLatestMessage] = useState<LatestMessage>(fallbackMessage);
  const [showGuidedPrayer, setShowGuidedPrayer] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeQuestIndex, setActiveQuestIndex] = useState(0);
  const [isQuestAutoplayPaused, setIsQuestAutoplayPaused] = useState(false);

  // Dedupe by challenge id first (legacy duplicate entries can otherwise show
  // a stale zero-progress copy alongside/instead of the real, completed one).
  const uniqueChallengeIds = new Set((user?.activeChallenges || []).map(c => c.id));
  const activeChallenges = Array.from(uniqueChallengeIds)
    .map(id => getActiveChallengeProgress(user?.activeChallenges, id)!)
    .filter(c => c.completedDays < c.duration);
  const pendingChallengeInvites = notifications.filter(n => n.type === 'challenge_invitation' && !n.isRead);
  const questSlides: ({ kind: 'invite'; id: string; data: AppNotification } | { kind: 'challenge'; id: string; data: ActiveChallenge })[] = [
      ...pendingChallengeInvites.map(n => ({ kind: 'invite' as const, id: n.id, data: n })),
      ...activeChallenges.map(c => ({ kind: 'challenge' as const, id: c.id, data: c })),
  ];
  const clampedActiveQuestIndex = Math.min(activeQuestIndex, Math.max(questSlides.length - 1, 0));

  useEffect(() => {
    setSpiritSnack(getDailySpiritSnack());
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setDailyQuote(QUOTES[randomIndex]);

    const fetchAppData = async () => {
        const globalContent = await getGlobalContent();
        if (globalContent?.latestMessage) setLatestMessage(globalContent.latestMessage);
    };
    fetchAppData();
  }, []);

  useEffect(() => {
    if (questSlides.length <= 1 || isQuestAutoplayPaused) return;
    const interval = setInterval(() => {
        setActiveQuestIndex(prev => (prev + 1) % questSlides.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [questSlides.length, isQuestAutoplayPaused]);

  const handleShareApp = async () => {
    const url = window.location.origin;

    const shareData = {
        title: "Hey Life App",
        text: "Come join me on the Hey Life App! Let's grow together.",
        url: url
    };

    if (navigator.share) {
        try {
        await navigator.share(shareData);
        return;
        } catch (e) {
        console.log("Share cancelled");
        }
    }

    // Desktop fallback
    const shareLinks = [
        `https://wa.me/?text=${encodeURIComponent(shareData.text + " " + url)}`,
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(url)}`
    ];

    window.open(shareLinks[0], "_blank"); // default WhatsApp share
    };

  const handleShare = async (text: string, title: string) => {
        const shareData = {
            title: title,
            text: text,
            url: window.location.href
        };

        if (navigator.share) {
            try {
            await navigator.share(shareData);
            } catch (err) {
            console.error("Share cancelled", err);
            }
        } else {
            try {
            await navigator.clipboard.writeText(`${title}: ${text} ${window.location.href}`);
            alert("Copied to clipboard!");
            } catch (err) {
            console.error(err);
            }
        }
    };

  const handleCompleteChallengeDay = async (challengeId: string) => {
    if (!user) return;
    await completeChallengeDay(user.id, challengeId);
  };

  const handleRespondToInvite = async (notification: AppNotification, accepted: boolean) => {
    if (!user) return;
    try {
        await respondToChallengeInvitation(notification.relatedId, notification.id, user, accepted);
    } catch (e) {
        console.error(e);
        alert("Could not respond to the invitation. Please try again.");
    }
  };

  const scrollToQuestIndex = (index: number) => {
    setActiveQuestIndex(index);
  };

  const handlePrevQuest = () => {
    if (questSlides.length <= 1) return;
    setActiveQuestIndex(prev => (prev - 1 + questSlides.length) % questSlides.length);
  };

  const handleNextQuest = () => {
    if (questSlides.length <= 1) return;
    setActiveQuestIndex(prev => (prev + 1) % questSlides.length);
  };

  const questsWheelLockRef = useRef(false);
  const handleQuestsWheel = (e: React.WheelEvent) => {
    if (questSlides.length <= 1) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 10 || questsWheelLockRef.current) return;
    questsWheelLockRef.current = true;
    setActiveQuestIndex(prev => (prev + 1) % questSlides.length);
    setTimeout(() => { questsWheelLockRef.current = false; }, 700);
  };

  const getTimeGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  const getFirstName = () => {
    if (!user?.name) return '';
    return user.name.split(' ')[0];
  };

  const renderColorizedQuote = () => {
    if (!dailyQuote) return null;
    const { text, keywords } = dailyQuote;
    const cleanText = text.replace(/^"|"$/g, '').trim();
    
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = cleanText.split(regex);
    
    return (
      <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter drop-shadow-lg px-1">
        {parts.map((part, i) => {
          const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
          return (
            <span key={i} className={isKeyword ? "text-[rgb(255,117,93)]" : ""}>
              {part}
            </span>
          );
        })}
      </h1>
    );
  };

  if (!user) return null;

  const sermonThumbnail = latestMessage.thumbnail || `https://img.youtube.com/vi/${latestMessage.videoId}/maxresdefault.jpg`;

  return (
    <>
    <div className="p-4 space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white pb-24">
      
      {/* Header */}
      <div className="flex justify-between items-center px-2 pt-2">
          <h1 className="text-3xl font-black tracking-tighter">Dashboard</h1>
          <button onClick={onToggleNotifications} className="relative p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors shadow-inner border border-white/5">
              <Bell size={24} className="text-gray-300" />
          </button>
      </div>

      {/* 1. Greeting & Inspiration Box */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-gradient-to-br from-[#3B82F6] to-[#2563EB] border border-white/20 rounded-[2.5rem] p-8 py-10 shadow-2xl relative overflow-hidden text-center mx-auto">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
            
            <button 
                onClick={() => dailyQuote && handleShare(`"${dailyQuote.text}"`, "Daily Inspiration")}
                className="absolute top-6 right-6 bg-white/10 backdrop-blur-sm p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all shadow-lg active:scale-90 z-20"
            >
                <Share2 size={18} />
            </button>

            <div className="relative z-10 max-w-[95%] mx-auto">
                <p className="text-lg font-black tracking-wider text-white/90 mb-6 drop-shadow-md">
                    {getTimeGreetingPrefix()}, <span className="text-[rgb(255,117,93)]">{getFirstName()}</span>
                </p>
                {renderColorizedQuote()}
                <div className="mt-8 text-white/30 text-[8px] font-black uppercase tracking-[0.5em] flex items-center justify-center">
                    <div className="h-px w-4 bg-white/20 mr-3"></div>
                    Victor Akko
                    <div className="h-px w-4 bg-white/20 ml-3"></div>
                </div>
            </div>

            <Quote className="absolute top-6 left-6 text-white opacity-[0.03]" size={64} />
          </div>
      </div>

      {/* --- Faith Check --- */}
      <div 
        onClick={() => navigate('/assessment')}
        className="bg-gradient-to-r from-[#EF6D4D] to-[#E85A37] rounded-[2.5rem] p-7 shadow-2xl border border-white/10 flex items-center justify-between group cursor-pointer relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 delay-100"
      >
          <div className="flex items-center space-x-5 relative z-10">
              <div className="bg-white/20 p-5 rounded-3xl border border-white/20 backdrop-blur-md shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Compass className="text-white" size={28} />
              </div>
              <div>
                  <h3 className="font-black text-white text-xl leading-none tracking-tight"> {t('home.faithcheck')}</h3>
                  <p className="text-white/80 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">
                    {t('home.Visualizeyourgrowthmap')}
                  </p>
              </div>
          </div>
          <div className="bg-white/10 p-2 rounded-full group-hover:translate-x-2 transition-transform">
             <ChevronRight className="text-white/60" />
          </div>
      </div>

      {/* 2. Spirit Snack Box */}
      {spiritSnack && (
          <section className="relative rounded-[2.5rem] shadow-2xl overflow-hidden p-6 pb-6 flex flex-col justify-between bg-gradient-to-br from-[#962323] to-[#4a0a0a] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 group border border-white/5">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-[rgb(251_191_36/0.1)] text-[rgb(251,191,36)] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] inline-block border !border-[rgb(251_191_36/0.2)] backdrop-blur-sm shadow-inner">
                        Today's Spirit Snack
                    </div>
                    <button 
                        onClick={() => handleShare(`${t(spiritSnack.titleKey)}: "${t(spiritSnack.verseKey)}"`, "Daily Spirit Snack")}
                        className="p-2 rounded-full bg-white/10 border-2 border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all active:scale-90 shadow-lg"
                    >
                        <Share2 size={16} />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <h2 className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-xl uppercase">
                        {t(spiritSnack.titleKey)}
                    </h2>
                  </div>

                  <div className="mb-6 pl-4 border-l-[3px] border-[rgb(251_191_36)] relative">
                      <p className="text-lg md:text-xl font-medium text-white leading-relaxed font-serif opacity-95">
                          {t(spiritSnack.verseKey)}
                      </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <button 
                        onClick={() => setShowGuidedPrayer(true)} 
                        className="bg-transparent border-2 border-[rgb(251_191_36/0.3)] text-[rgb(251_191_36)] px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-[rgb(251_191_36/0.1)] shadow-xl"
                    >
                       {t('home.letsPray')}
                    </button>
                    
                    <p className="text-base font-black text-[rgb(251_191_36)] uppercase tracking-tighter drop-shadow-md pb-1">
                        {spiritSnack.reference}
                    </p>
                  </div>
              </div>
          </section>
      )}

      {/* 3. Latest Sermon Box */}
      <div 
        onClick={() => setIsVideoPlayerOpen(true)}
        className="relative h-64 w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group cursor-pointer"
      >
          <img 
            src={sermonThumbnail} 
            alt={latestMessage.title} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40"></div>
          
          {/* Watch Label - Top Left - Glass style */}
          <div className="absolute top-6 left-6 z-20">
              <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[rgb(255,117,93)]">Watch latest sermon</p>
              </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-[rgb(255_117_93)] p-7 rounded-[2rem] shadow-[0_0_40px_rgba(239,68,68,0.5)] group-hover:scale-110 transition-transform duration-500 border border-white/10 backdrop-blur-sm">
                  <Play size={36} className="text-white fill-white ml-1.5"/>
              </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-20">
              <h3 className="text-lg md:text-xl font-black text-white leading-none tracking-tight drop-shadow-2xl truncate">{latestMessage.title}</h3>
          </div>
      </div>

      {/* 5. Challenges Carousel */}
      <div className="space-y-4 pt-4">
          <div className="flex justify-between items-end px-3">
            <h2 className="text-2xl font-black tracking-tighter">Active quests</h2>
            <button onClick={() => navigate('/challenges')} className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(255_152_43)]">
                Browse all
            </button>
          </div>
          <div
            className="overflow-hidden px-3 pb-2"
            onMouseEnter={() => setIsQuestAutoplayPaused(true)}
            onMouseLeave={() => setIsQuestAutoplayPaused(false)}
            onWheel={handleQuestsWheel}
          >
              {questSlides.length > 0 ? (
                  <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${clampedActiveQuestIndex * 100}%)` }}
                  >
                      {questSlides.map(slide => (
                          <div key={slide.id} className="w-full flex-shrink-0 px-2">
                              {slide.kind === 'invite' ? (
                                  <ChallengeInviteCard
                                    notification={slide.data}
                                    onRespond={handleRespondToInvite}
                                  />
                              ) : (
                                  <ChallengeCarouselItem
                                    challenge={slide.data}
                                    onComplete={handleCompleteChallengeDay}
                                  />
                              )}
                          </div>
                      ))}
                  </div>
              ) : (
                  <div
                    onClick={() => navigate('/challenges')}
                    className="w-full bg-gray-800/40 border-2 border-dashed border-gray-700 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-gray-800/60 transition-colors"
                  >
                      <Trophy size={48} className="text-gray-600 mb-4 group-hover:scale-110 transition-transform"/>
                      <p className="font-black text-white uppercase tracking-[0.2em] text-sm">Unlock your first quest</p>
                  </div>
              )}
          </div>
          {questSlides.length > 1 && (
              <div className="flex justify-center items-center space-x-4 -mt-2">
                  <button
                    onClick={handlePrevQuest}
                    aria-label="Previous quest"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
                  >
                      <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center space-x-2">
                      {questSlides.map((slide, i) => (
                          <button
                            key={slide.id}
                            onClick={() => scrollToQuestIndex(i)}
                            aria-label={`Go to quest ${i + 1}`}
                            className={`h-2 rounded-full transition-all ${clampedActiveQuestIndex === i ? 'w-6 bg-[rgb(255_152_43)]' : 'w-2 bg-gray-700'}`}
                          />
                      ))}
                  </div>
                  <button
                    onClick={handleNextQuest}
                    aria-label="Next quest"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
                  >
                      <ChevronRight size={18} />
                  </button>
              </div>
          )}
      </div>

      {/* 6. Gym and Friends Wide Boxes */}
      <div className="space-y-5">
        <div 
            onClick={() => navigate(user.workoutPlan ? '/workout-plan' : '/workout-onboarding')}
            className="bg-[rgb(59_130_246)] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 flex items-center justify-between group cursor-pointer relative overflow-hidden"
        >
            <div className="flex items-center space-x-6 relative z-10">
                <div className="bg-white/20 p-5 rounded-3xl border border-white/20 backdrop-blur-md shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <Dumbbell className="text-white" size={32} />
                </div>
                <div>
                    <h3 className="font-black text-white text-2xl leading-none tracking-tighter">Hey Gym</h3>
                    <p className="text-blue-100 text-[10px] mt-2 font-black uppercase tracking-[0.2em] opacity-80">
                        {user.workoutPlan ? "Keep pushing your limits" : "Create my performance plan"}
                    </p>
                </div>
            </div>
            <div className="bg-white/10 p-2 rounded-full group-hover:translate-x-2 transition-transform">
                <ChevronRight className="text-white/60" />
            </div>
        </div>

        <div 
            onClick={handleShareApp}
            className="bg-[#8B5CF6] rounded-[2.5rem] p-8 shadow-2xl border border-white/5 flex items-center justify-between group cursor-pointer"
        >
            <div className="flex items-center space-x-6 relative z-10">
                <div className="bg-white/20 p-5 rounded-3xl border border-white/20 backdrop-blur-md shadow-inner group-hover:scale-110 transition-transform">
                    <UserPlus className="text-white" size={32} />
                </div>
                <div>
                    <h3 className="font-black text-white text-2xl leading-none tracking-tighter">Make God known</h3>
                    <p className="text-purple-100 text-[10px] mt-2 font-black uppercase tracking-[0.2em] opacity-80">Invite your world to Hey Life</p>
                </div>
            </div>
            <div className="bg-white/10 p-2 rounded-full group-hover:translate-x-2 transition-transform">
                <ChevronRight className="text-white/60" />
            </div>
        </div>
      </div>

      {/* 4. Feature Boxes Grid (2x2) */}
      <div className="grid grid-cols-2 gap-5 pt-4">
          <FeatureBox 
            title="Giving" 
            icon={Gift} 
            color="bg-[#10B981]" 
            accentColor="bg-black/10"
            onClick={() => navigate('/giving')}
          />
          <FeatureBox 
            title="Prayer wall" 
            icon={HandHelping} 
            color="bg-[#8B5CF6]" 
            accentColor="bg-black/10"
            onClick={() => navigate('/community')}
          />
          <FeatureBox 
            title="Spiritual journal" 
            icon={PenLine} 
            color="bg-gradient-to-br from-[#133666] to-[#0f2a50]" 
            accentColor="bg-white/10"
            onClick={() => navigate('/journal')}
          />
          <FeatureBox 
            title="Bible App" 
            icon={BookText} 
            color="bg-[#2E1C17]" 
            accentColor="bg-white/5"
            onClick={() => window.open('https://www.bible.com', '_blank')}
          />
      </div>

      <div className="pt-12 text-center opacity-10 pb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.8em]">Hey Life Global Experience</p>
      </div>
    </div>

    {isVideoPlayerOpen && <VideoPlayerModal videoId={latestMessage.videoId} onClose={() => setIsVideoPlayerOpen(false)} />}
    {showGuidedPrayer && spiritSnack && (
        <GuidedPrayerModal 
            snack={spiritSnack} 
            onClose={() => setShowGuidedPrayer(false)} 
        />
    )}
    {showInviteModal && (
        <InviteFriendModal 
            user={user} 
            onClose={() => setShowInviteModal(false)}
            target={{
                id: 'home',
                title: 'Hey Life App',
                type: 'lesson', 
                data: { title: 'Hey Life App' },
                courseId: 'app'
            }}
        />
    )}
    </>
  );
};

export default HomePage;
