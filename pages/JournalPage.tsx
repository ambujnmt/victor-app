
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Save, Sparkles, Calendar, BookOpen, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { JournalEntry } from '../types';
import { addJournalEntry, getJournalEntries, updateMonthlyReflection, updateUserData } from '../services/firebaseService';
import { generateMonthlyReflection } from '../services/geminiService';
import { JOURNAL_PROMPTS } from '../constants/staticData';

const JournalPage: React.FC = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isAgreeing, setIsAgreeing] = useState(false);
    
    // Journal Entry State
    const [mood, setMood] = useState<number>(3);
    const [content, setContent] = useState('');
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [history, setHistory] = useState<JournalEntry[]>([]);
    
    // Voice Recognition State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Initialize Prompt
    useEffect(() => {
        const randomPromptKey = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
        setCurrentPrompt(t(randomPromptKey));
    }, [t]);

    // Fetch History
    useEffect(() => {
        if (user) {
            getJournalEntries(user.id).then(setHistory);
        }
    }, [user]);

    // Setup Speech Recognition
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        const langCode = language === 'German' ? 'de-DE' : 'en-US';
        recognition.lang = langCode;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                 setContent(prev => {
                     const prefix = prev && !prev.endsWith(' ') ? ' ' : '';
                     return prev + prefix + finalTranscript;
                 });
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;

        return () => recognitionRef.current?.stop();
    }, [language]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                setIsListening(false);
            }
        }
    };

    const handleAcceptJournalTerms = async () => {
        if (!user) return;
        setIsAgreeing(true);
        try {
            await updateUserData(user.id, { acceptedJournalTerms: true });
        } catch (error) {
            alert("Error saving consent.");
        } finally {
            setIsAgreeing(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim() || !user) return;
        setIsLoading(true);
        
        const newEntry: Omit<JournalEntry, 'id'> = {
            userId: user.id,
            date: new Date().toISOString(),
            mood,
            promptId: 'random',
            promptText: currentPrompt,
            content,
            tags: []
        };
        
        try {
            await addJournalEntry(user.id, newEntry);
            const updatedHistory = await getJournalEntries(user.id);
            setHistory(updatedHistory);
            setContent('');
            setActiveTab('history');
        } catch (error) {
            alert("Could not save entry.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReflection = async () => {
        if (!user) return;
        setIsGeneratingAI(true);
        try {
            const reflectionText = await generateMonthlyReflection(user, history);
            const reflection = {
                month: new Date().toLocaleDateString(language === 'German' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' }),
                content: reflectionText,
                generatedAt: new Date().toISOString()
            };
            await updateMonthlyReflection(user.id, reflection);
        } catch (error) {
            alert("Failed to generate reflection.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const moodEmojis = ['😫', '😔', '😐', '🙂', '🤩'];

    // --- RENDER TERMS BLOCK ---
    if (user && !user.acceptedJournalTerms) {
        return (
            <div className="min-h-screen bg-[rgb(19,54,102)] text-white p-6 flex flex-col justify-center items-center">
                <div className="max-w-md w-full bg-gray-800 rounded-[2.5rem] p-10 shadow-2xl border border-white/10 space-y-8 animate-in zoom-in duration-500">
                    <div className="text-center">
                        <div className="bg-[rgb(59_130_246/0.1)] p-5 rounded-full inline-block mb-4">
                            <ShieldCheck size={40} className="text-[rgb(59_130_246)]" />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">{t('legal.journal.short')}</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <p className="text-gray-300 leading-relaxed italic text-center">
                            "{t('legal.journal.short_desc')}"
                        </p>
                        
                        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[rgb(251_191_36)] flex items-center">
                                <AlertTriangle size={14} className="mr-2"/> Essential Info
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                {t('legal.checkbox.journal')}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleAcceptJournalTerms}
                        disabled={isAgreeing}
                        className="w-full bg-[rgb(255_117_93)] py-5 rounded-2xl font-black text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center"
                    >
                        {isAgreeing ? <Loader2 size={24} className="animate-spin" /> : "I AGREE & ENTER"}
                    </button>
                    
                    <button onClick={() => navigate('/my-plan')} className="w-full text-center text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[rgb(19,54,102)] text-white p-4 pb-24">
             <div className="flex items-center mb-6">
                <button onClick={() => navigate('/my-plan')} className="text-[rgb(255_152_43)]">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-extrabold uppercase ml-4">{t('journal.title')}</h1>
            </div>

            <div className="flex bg-gray-800 p-1 rounded-lg mb-6">
                <button onClick={() => setActiveTab('write')} className={`flex-1 py-2 font-bold rounded-md transition ${activeTab === 'write' ? 'bg-[rgb(59_130_246)]' : 'text-gray-400'}`}>{t('journal.prompt.label')}</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 font-bold rounded-md transition ${activeTab === 'history' ? 'bg-[rgb(59_130_246)]' : 'text-gray-400'}`}>{t('journal.history')}</button>
            </div>

            {activeTab === 'write' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-gray-800 p-4 rounded-xl shadow-lg text-center">
                        <h2 className="text-lg font-bold mb-3">{t('journal.mood.question')}</h2>
                        <div className="flex justify-between max-w-xs mx-auto">
                            {moodEmojis.map((emoji, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setMood(idx + 1)}
                                    className={`text-3xl transition-transform hover:scale-125 ${mood === idx + 1 ? 'scale-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'opacity-50 grayscale'}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-[rgb(251_191_36)]">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Today's Prompt</p>
                        <p className="text-lg font-medium italic">"{currentPrompt}"</p>
                    </div>

                    <div className="relative">
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-64 bg-gray-800 rounded-xl p-4 text-white text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-[rgb(59_130_246)]"
                            placeholder={t('journal.write.placeholder')}
                        />
                        <button 
                            onClick={toggleListening}
                            className={`absolute bottom-4 right-4 p-4 rounded-full shadow-lg transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[rgb(59_130_246)] hover:bg-[rgb(59_130_246/0.8)]'}`}
                        >
                            {isListening ? <MicOff size={24}/> : <Mic size={24}/>}
                        </button>
                    </div>
                    {isListening && <p className="text-center text-sm text-[rgb(59_130_246)] animate-pulse font-bold">{t('journal.listening')}</p>}

                    <button 
                        onClick={handleSave} 
                        disabled={isLoading || !content.trim()} 
                        className="w-full bg-[rgb(16_185_129)] py-4 rounded-xl font-bold text-xl flex items-center justify-center shadow-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> {t('journal.save')}</>}
                    </button>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-gradient-to-br from-indigo-900 to-[#8B5CF6] p-6 rounded-xl shadow-lg text-white">
                        <div className="flex items-center mb-3">
                            <Sparkles className="text-[rgb(251_191_36)] mr-3" size={28}/>
                            <h2 className="text-xl font-bold">{t('journal.ai_insight')}</h2>
                        </div>
                        
                        {user?.monthlyReflection ? (
                            <div className="bg-black/20 p-4 rounded-lg mt-2">
                                <p className="text-xs font-bold uppercase text-[rgb(251_191_36)] mb-2">{user.monthlyReflection.month}</p>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed italic">"{user.monthlyReflection.content}"</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-200 mb-4">{t('journal.ai_insight_desc')}</p>
                                <button 
                                    onClick={handleGenerateReflection}
                                    disabled={isGeneratingAI || history.length < 3}
                                    className="w-full bg-white text-[#8B5CF6] font-bold py-2 rounded-lg disabled:opacity-50"
                                >
                                    {isGeneratingAI ? t('my_plan.ai.generating') : t('journal.generate')}
                                </button>
                                {history.length < 3 && <p className="text-xs text-center mt-2 opacity-70">Write at least 3 entries to unlock.</p>}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {history.length > 0 ? history.map(entry => (
                            <div key={entry.id} className="bg-gray-800 p-5 rounded-xl shadow-md border-l-4 border-[rgb(59_130_246)]">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center text-gray-400 text-sm">
                                        <Calendar size={14} className="mr-1"/>
                                        {new Date(entry.date).toLocaleDateString()}
                                    </div>
                                    <div className="text-xl">{moodEmojis[entry.mood - 1]}</div>
                                </div>
                                <p className="text-xs text-[rgb(255_152_43)] font-bold mb-2 uppercase tracking-wide">{entry.promptText}</p>
                                <p className="text-gray-200">{entry.content}</p>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-400">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-30"/>
                                <p>{t('journal.empty')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalPage;
