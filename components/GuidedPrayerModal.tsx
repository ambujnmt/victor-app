
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, PlayCircle, PauseCircle, RotateCcw, Volume2, VolumeX, Share2, Music, Heart, Send, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '../App';
import { updateUserData } from '../services/firebaseService';
import { getPrayerLines } from '../constants/staticData';
import { useLanguage } from '../contexts/LanguageContext';
import { SpiritSnack } from '../types';

// --- CUSTOM SONGS ---
const BACKGROUND_TRACKS = [
    { name: "God's Country", url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0268998518.firebasestorage.app/o/GodsCountry%20.mp3?alt=media&token=ff7ea473-474c-4cb1-9aa8-b343477b5c44" },
    { name: "God", url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0268998518.firebasestorage.app/o/GOD.wav?alt=media&token=456f6a74-e3ba-4ca2-b9ad-0e43b0a1f456" },
    { name: "Heaven", url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0268998518.firebasestorage.app/o/HEAVEN.wav?alt=media&token=ec90aece-bb37-41fc-9585-d939f06b9cb5" },
    { name: "Lab", url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0268998518.firebasestorage.app/o/LAB.wav?alt=media&token=b13dc208-8552-4914-a33b-a84997dabc1c" },
    { name: "Waves", url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0268998518.firebasestorage.app/o/WAVES.wav?alt=media&token=aa20c343-9f67-47fc-ade9-170a1b8125fa" }
];

interface GuidedPrayerModalProps {
    snack: SpiritSnack;
    onClose: () => void;
}

export const GuidedPrayerModal: React.FC<GuidedPrayerModalProps> = ({ snack, onClose }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    // UI State
    const [hasStarted, setHasStarted] = useState(false);
    const [hasAmened, setHasAmened] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Card Interaction State
    const [cardLiked, setCardLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(319900);
    const [commentCount, setCommentCount] = useState(5200);
    const [shareCount, setShareCount] = useState(95900);

    // Refs
    const prayerCardRef = useRef<HTMLDivElement>(null);

    // Prayer Control State
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    
    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [activeTrackIndex, setActiveTrackIndex] = useState(0); 
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<any>(null);

    // Get Today's Prayer Content from the passed Prop
    const fullPrayerText = t(snack.prayerKey);
    const PRAYER_LINES = useMemo(() => getPrayerLines(fullPrayerText), [fullPrayerText]);
    
    // DURATION LOGIC: Aim for ~38 seconds total (within 30-45 range)
    const lineInterval = useMemo(() => {
        const totalTargetMs = 38000; // 38 seconds
        const calculated = Math.floor(totalTargetMs / PRAYER_LINES.length);
        // Ensure each line stays for at least 4 seconds but no more than 10
        return Math.min(Math.max(calculated, 4000), 10000);
    }, [PRAYER_LINES]);

    // Initialize Audio Element
    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 1.0;
        audioRef.current = audio;
        
        if (BACKGROUND_TRACKS[0].url) {
            audio.src = BACKGROUND_TRACKS[0].url;
        }

        return () => {
            stopPrayer();
        };
    }, []);

    // Handle Track Switching
    useEffect(() => {
        if (!audioRef.current) return;
        const wasPlaying = !audioRef.current.paused;
        
        if (!BACKGROUND_TRACKS[activeTrackIndex].url) return;

        audioRef.current.pause();
        audioRef.current.src = BACKGROUND_TRACKS[activeTrackIndex].url;
        audioRef.current.load();
        
        if (wasPlaying && !isFinished && !hasAmened) {
            audioRef.current.play().catch(() => setIsPlaying(false));
        }
    }, [activeTrackIndex]);

    const stopPrayer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startTextTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrentLineIndex(prev => {
                if (prev >= PRAYER_LINES.length - 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    setIsFinished(true);
                    return prev;
                }
                return prev + 1;
            });
        }, lineInterval); 
    };

    const handleStart = (withMusic: boolean) => {
        setHasStarted(true);
        startTextTimer();
        if (withMusic && audioRef.current && BACKGROUND_TRACKS[activeTrackIndex].url) {
            setIsPlaying(true);
            setIsMuted(false);
            audioRef.current.muted = false;
            audioRef.current.play().catch(() => setIsPlaying(false));
        } else if (!withMusic) {
            setIsPlaying(false);
            setIsMuted(true);
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            setIsPlaying(false);
            audioRef.current?.pause();
        } else {
            if (BACKGROUND_TRACKS[activeTrackIndex].url) {
                setIsPlaying(true);
                audioRef.current?.play().catch(() => setIsPlaying(false));
                if (!timerRef.current) startTextTimer();
            }
        }
    };

    const handleRestart = () => {
        stopPrayer();
        setCurrentLineIndex(0);
        setHasAmened(false);
        setIsFinished(false);
        startTextTimer();
        if (!isMuted && audioRef.current && BACKGROUND_TRACKS[activeTrackIndex].url) {
             audioRef.current.play().catch(() => {});
             setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            const newMuteState = !isMuted;
            audioRef.current.muted = newMuteState;
            setIsMuted(newMuteState);
        }
    };
    
    const cycleTrack = () => {
        setActiveTrackIndex(prev => (prev + 1) % BACKGROUND_TRACKS.length);
    };

    const handleAmen = async () => {
        stopPrayer();
        setHasAmened(true);
        setIsPlaying(false);
        setShowConfetti(true);
        if (user) {
            await updateUserData(user.id, { points: (user.points || 0) + 50 });
        }
    };

    const formatK = (num: number) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const handleLikeCard = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (cardLiked) {
            setLikeCount(prev => prev - 1);
        } else {
            setLikeCount(prev => prev + 1);
        }
        setCardLiked(!cardLiked);
    };

    const handleShareAsImage = async () => {
        if (!prayerCardRef.current || !window.html2canvas) return;
        setIsSharing(true);
        try {
            const canvas = await window.html2canvas(prayerCardRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: null,
            });
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );
            if (!blob) throw new Error("Capture failed");
            const file = new File([blob], "PrayerCard.png", { type: "image/png" });
            // ? Try sharing image file
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "Hey Life Prayer Card",
                    text: "Check out this prayer card"
                });

                setShareCount(prev => prev + 1);
                return;
            }
            // ? Fallback ? share link instead of download
            if (navigator.share) {
                await navigator.share({
                    title: "Hey Life Prayer Card",
                    text: "Check out this prayer card",
                    url: window.location.href
                });

                setShareCount(prev => prev + 1);
                return;
            }
            // ? Last fallback ? download
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "PrayerCard.png";
            a.click();

        } catch (err) {
            console.error(err);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-500 overflow-hidden bg-black font-sans">
            <style>{`
                .bg-vibrant-prayer {
                    background: linear-gradient(160deg, #1e1b4b 0%, #4c1d95 35%, #9d174d 70%, #be123c 100%);
                    background-size: 400% 400%;
                    animation: gradientShift 15s ease infinite;
                }
                @keyframes gradientShift {
                    0 { background-position: 0% 50%; }
                    50 { background-position: 100% 50%; }
                    100 { background-position: 0% 50%; }
                }
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                .prayer-card-brilliant {
                    background: linear-gradient(165deg, #312e81 0%, #7e22ce 30%, #be123c 70%, #9f1239 100%);
                }
            `}</style>
            
            <div className={`absolute inset-0 bg-vibrant-prayer transition-opacity duration-1000 ${hasAmened ? 'opacity-60' : 'opacity-100'}`}>
                {/* Star Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
            </div>

            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
                    {Array.from({ length: 80 }).map((_, i) => (
                        <div key={i} className="absolute w-1.5 h-3" style={{
                            left: `${Math.random() * 100}%`,
                            top: `-5%`,
                            backgroundColor: ['#FF755D', '#FBBF24', '#FFFFFF', '#EF6D4D'][i % 4],
                            animation: `confettiFall ${3 + Math.random() * 3}s ease-out forwards`,
                            animationDelay: `${Math.random() * 0.5}s`
                        }}></div>
                    ))}
                </div>
            )}

            {/* Modal Close Button */}
            <button 
                onClick={onClose} 
                className="absolute top-8 right-8 text-white hover:text-gray-300 transition-all z-50 p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl"
            >
                <X size={24} />
            </button>

            <div className="w-full h-full flex flex-col relative z-10 max-w-lg mx-auto">
                {!hasStarted && (
                    <div className="flex flex-col items-center justify-center h-full space-y-12 p-8 animate-in zoom-in duration-500">
                        <div className="text-center">
                            <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter drop-shadow-2xl leading-none">{t(snack.titleKey)}</h2>
                            <p className="text-[rgb(251_191_36)] font-bold tracking-[0.3em] text-[10px] uppercase">A Moment of Peace</p>
                        </div>
                        <div className="space-y-4 w-full max-w-xs">
                            <button onClick={() => handleStart(true)} className="w-full bg-white text-[#4a102c] p-5 rounded-[2rem] flex items-center justify-center space-x-3 shadow-2xl hover:scale-105 transition-transform font-black uppercase tracking-widest">
                                <PlayCircle size={28} /><span className="text-lg">Guided Prayer</span>
                            </button>
                            <button onClick={() => handleStart(false)} className="w-full bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[2rem] flex items-center justify-center space-x-3 hover:bg-white/20 transition-colors text-white font-black uppercase tracking-widest">
                                <VolumeX size={24} /><span className="text-base">Pray in Silence</span>
                            </button>
                        </div>
                    </div>
                )}

                {hasStarted && !hasAmened && (
                    <div className="w-full h-full flex flex-col p-8">
                        <div className="text-center pt-12 pb-8">
                            {/* Fixed Label - Yellow and English */}
                            <span className="bg-[rgb(251_191_36)] text-black px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-0.2em shadow-lg">Guided Prayer</span>
                        </div>

                        <div className="flex-grow flex flex-col items-center justify-center w-full relative">
                            {!isFinished ? (
                                <div key={currentLineIndex} className="animate-in fade-in zoom-in duration-1000 px-4 text-center">
                                    <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.2] drop-shadow-2xl italic font-serif">
                                        "{PRAYER_LINES[currentLineIndex]}"
                                    </h2>
                                </div>
                            ) : (
                                <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                                    <button onClick={handleAmen} className="bg-gradient-to-r from-[rgb(251_191_36)] to-[#EF6D4D] text-black text-6xl font-black py-12 px-24 rounded-full hover:scale-110 transition-transform shadow-[0_0_60px_rgba(251,191,36,0.6)]">
                                        AMEN
                                    </button>
                                    <p className="text-white/60 mt-10 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Claim this moment</p>
                                </div>
                            )}
                        </div>

                        {!isFinished && (
                            <div className="flex flex-col items-center pb-16 space-y-8">
                                <div className="flex justify-center items-center space-x-14">
                                    <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">{isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}</button>
                                    <button onClick={handlePlayPause} className="bg-white p-6 rounded-full text-black hover:scale-110 transition-transform shadow-2xl">
                                        {isPlaying ? <PauseCircle size={40} fill="currentColor" /> : <PlayCircle size={40} fill="currentColor" />}
                                    </button>
                                    <button onClick={handleRestart} className="text-white/50 hover:text-white transition-colors"><RotateCcw size={32} /></button>
                                </div>
                                <button onClick={cycleTrack} className="flex items-center space-x-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-black/50 transition-all group">
                                    <Music size={16} className="text-[rgb(251_191_36)] group-hover:animate-bounce"/><span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{BACKGROUND_TRACKS[activeTrackIndex].name}</span>
                                </button>
                            </div>
                        )}
                        
                        {!isFinished && (
                            <div className="absolute bottom-0 left-0 h-2 bg-white/5 w-full">
                                <div 
                                    className="h-full bg-[rgb(251_191_36)] shadow-[0_0_15px_#FBBF24] transition-all ease-linear" 
                                    style={{ 
                                        width: `${((currentLineIndex + 1) / PRAYER_LINES.length) * 100}%`,
                                        transitionDuration: `${lineInterval}ms`
                                    }}
                                ></div>
                            </div>
                        )}
                    </div>
                )}

                {hasAmened && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="bg-[rgb(251_191_36)] text-black font-black px-6 py-2 rounded-full mb-8 text-[10px] uppercase tracking-widest animate-bounce shadow-xl">
                            +50 Points Earned
                        </div>

                        {/* --- BRILLIANT PRAYER CARD (SCREENSHOT STYLE) --- */}
                        <div ref={prayerCardRef} className="w-full max-w-[340px] prayer-card-brilliant rounded-[2.5rem] p-8 pb-6 shadow-[0_40px_120px_rgba(0,0,0,0.8)] border border-white/10 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                            
                            {/* Card Close Icon (Visual only) */}
                            <div className="absolute top-6 right-6 p-1.5 bg-black/30 rounded-full">
                                <X size={14} className="text-white/40" />
                            </div>

                            {/* Heart Icon at top */}
                            <div className="mb-6">
                                <Heart className="text-[#FF755D] fill-[#FF755D]" size={32} />
                            </div>

                            {/* Title with Gold Left Bar */}
                            <div className="flex items-stretch mb-6">
                                <div className="w-1.5 bg-[rgb(251_191_36)] rounded-full mr-4 shadow-[0_0_15px_rgba(251,191,36,0.6)]"></div>
                                <h3 className="text-[rgb(251_191_36)] font-black uppercase text-xl leading-none tracking-tight">
                                    {t(snack.titleKey)}
                                </h3>
                            </div>

                            {/* Prayer Content */}
                            <div className="mb-8">
                                <p className="text-[17px] font-medium leading-[1.6] italic text-white/95 font-serif mb-8">
                                    "{fullPrayerText}"
                                </p>
                                
                                {/* Bible Verse - CENTERED, CAPS, YELLOW */}
                                <p className="text-center text-[rgb(251_191_36)] font-black text-sm uppercase tracking-widest mb-1.5 drop-shadow-md">
                                    {snack.reference}
                                </p>
                                
                                {/* Branding - CENTERED, SMALL, DIRECTLY BELOW VERSE */}
                                <p className="text-center text-white/40 font-black text-[10px] uppercase tracking-[0.5em] mb-6">
                                    HEY LIFE APP
                                </p>
                            </div>

                            {/* Footer Separator */}
                            <div className="h-[1px] bg-white/10 w-full mb-4"></div>

                            {/* Interaction Bar (Screenshot Match - ACTIVE) */}
                            <div className="flex justify-around items-center pt-2 px-2 relative z-20">
                                <button onClick={handleLikeCard} className="flex flex-col items-center group transition-all active:scale-90">
                                    <Heart size={20} className={`${cardLiked ? 'text-[#FF755D] fill-[#FF755D]' : 'text-white/60'} group-hover:text-white mb-1 transition-colors`} />
                                    <span className={`text-[9px] font-black ${cardLiked ? 'text-[#FF755D]' : 'text-white/40'}`}>{formatK(likeCount)}</span>
                                </button>
                                <button className="flex flex-col items-center group transition-all active:scale-90">
                                    <MessageCircle size={20} className="text-white/60 group-hover:text-white mb-1" />
                                    <span className="text-[9px] font-black text-white/40">{formatK(commentCount)}</span>
                                </button>
                                <button onClick={handleShareAsImage} className="flex flex-col items-center group transition-all active:scale-90">
                                    <Share2 size={20} className="text-white/60 group-hover:text-white mb-1" />
                                    <span className="text-[9px] font-black text-white/40">{formatK(shareCount)}</span>
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleShareAsImage} 
                            disabled={isSharing}
                            className="mt-12 flex items-center space-x-3 bg-white/10 hover:bg-white/20 px-10 py-5 rounded-[2rem] transition-all font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 border border-white/10"
                        >
                            {isSharing ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                            <span className="text-[rgb(251_191_36)] uppercase">Share Prayer Card</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
