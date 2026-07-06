
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate,useSearchParams } from 'react-router-dom';
import { Challenge, User, ChallengeMessage } from '../types';
import { useAuth } from '../App';
import * as firebaseService from '../services/firebaseService';
import { Loader2, Users, Send, Check, LogOut, AlertTriangle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';;

const ChallengeDetailsPage: React.FC = () => {
    const { challengeId } = useParams<{ challengeId: string }>();
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [participants, setParticipants] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isCompletingDay, setIsCompletingDay] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [searchParams] = useSearchParams();
    const autoJoinAttemptedRef = useRef(false);

    const invite = searchParams.get('invite');


    useEffect(() => {
        if (!currentUser || !challengeId || !challenge || autoJoinAttemptedRef.current) return;
        if (invite === 'true') {
            autoJoinAttemptedRef.current = true;
            handleAutoJoin();
        }
    }, [invite, currentUser, challengeId, challenge]);

    useEffect(() => {
        if (!challengeId) {
            navigate('/challenges');
            return;
        }

        const unsubscribe = firebaseService.listenToChallenge(challengeId, (updatedChallenge) => {
            setChallenge(updatedChallenge);
            if (updatedChallenge.participantIds && updatedChallenge.participantIds.length > 0) {
                firebaseService.getUsersByIds(updatedChallenge.participantIds).then(setParticipants);
            } else {
                setParticipants([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [challengeId, navigate]);

     useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [challenge?.messages]);

    const sortedMessages = useMemo(() => {
        if (!challenge?.messages) return [];
        
        const getTime = (timestamp: any): number => {
          if (!timestamp) return 0;
          if (timestamp.seconds) {
            return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
          }
          if (typeof timestamp === 'string') {
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          }
          return 0;
        };
    
        return [...challenge.messages].sort((a, b) => getTime(a.timestamp) - getTime(b.timestamp));
    }, [challenge?.messages]);

    const handleStartChallenge = async () => {
        if (!currentUser || !challenge) return;
        try {
            await firebaseService.startChallenge(currentUser.id, challenge);
        } catch (error) {
            console.error("Failed to start challenge:", error);
            alert("Could not start this challenge. Please try again.");
        }
    };

    const handleAutoJoin = async () => {
        if (!currentUser || !challenge) return;
        try {
            await firebaseService.startChallenge(currentUser.id, challenge);
        } catch (error) {
            console.error("Auto join failed:", error);
        }
    };

    const handleCompleteDay = async () => {
        if (!currentUser || !challenge || isCompletingDay) return;
        setIsCompletingDay(true);
        try {
            await firebaseService.completeChallengeDay(currentUser.id, challenge.id);
        } catch (error) {
            console.error("Failed to mark today as complete:", error);
            alert("Could not mark today as complete. Please try again.");
        } finally {
            setIsCompletingDay(false);
        }
    };

    const handleLeaveChallenge = async () => {
        if (!currentUser || !challenge || !window.confirm("Are you sure you want to stop this challenge? Your progress will be lost.")) return;
        setIsLeaving(true);
        try {
            await firebaseService.leaveChallenge(currentUser.id, challenge.id);
            navigate('/challenges');
        } catch (error) {
            console.error("Failed to leave challenge:", error);
            alert("Failed to leave the challenge.");
        } finally {
            setIsLeaving(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !challenge || isSending) return;

        setIsSending(true);

        const messagePayload = {
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            content: newMessage.trim(),
        };
        
        const messageToSend = newMessage;
        setNewMessage(''); 

        try {
            await firebaseService.addMessageToChallenge(challenge.id, messagePayload);
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Could not send your message. Please try again.");
            setNewMessage(messageToSend);
        } finally {
            setIsSending(false);
        }
    };

    const formatTimestamp = (timestamp: any): string => {
        try {
            if (!timestamp) return '...';
            if (typeof timestamp.toDate === 'function') {
                return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            if (typeof timestamp === 'string') {
                const d = new Date(timestamp);
                if (!isNaN(d.getTime())) {
                     return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            }
            return '--:--';
        } catch (e) {
            console.error("Error formatting timestamp:", timestamp, e);
            return 'error';
        }
    };


    if (loading) {
        return <div className="min-h-screen bg-[rgb(19,54,102)] flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8"/></div>;
    }

    if (!challenge) {
        return <div className="p-4 text-center text-white">Challenge not found.</div>;
    }

    const activeChallengeProgress = firebaseService.getActiveChallengeProgress(currentUser?.activeChallenges, challenge.id);
    const isActive = !!activeChallengeProgress;
    const isDayCompleted = !!activeChallengeProgress && activeChallengeProgress.completedDays >= activeChallengeProgress.duration;

    return (
        <div className="p-4 space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                    <button onClick={() => navigate('/challenges')} className="text-[rgb(255_152_43)]">&larr; Back to Challenges</button>
                    {isActive && (
                        <button 
                            onClick={handleLeaveChallenge}
                            disabled={isLeaving}
                            className="text-xs text-gray-500 hover:text-red-400 flex items-center bg-white/5 px-3 py-1.5 rounded-full transition-colors"
                        >
                            {isLeaving ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <LogOut size={12} className="mr-1.5" />}
                            Leave Challenge
                        </button>
                    )}
                </div>
                <div className="bg-gray-800 rounded-xl shadow-lg p-5">
                    <h1 className="font-extrabold text-2xl text-white">{t(challenge.title)}</h1>
                    <p className="text-sm text-gray-300 mt-2">{t(challenge.description)}</p>
                    <blockquote className="mt-4 pl-4 border-l-4 border-[rgb(251_191_36)] italic text-gray-400">
                        "{t(challenge.why)}"
                    </blockquote>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                        <span className="font-bold text-lg text-[rgb(251_191_36)]">+{challenge.points} Points</span>
                        {!isActive && (
                            <button
                                onClick={handleStartChallenge}
                                className="font-bold py-2 px-6 rounded-lg flex items-center justify-center transition-all text-base bg-[rgb(255_117_93)] text-white hover:bg-opacity-90 hover:scale-105"
                            >
                                Start Challenge
                            </button>
                        )}
                        {isActive && isDayCompleted && (
                            <div className="font-bold py-2 px-6 rounded-lg flex items-center justify-center text-base bg-green-500 text-white">
                                <Check size={18} className="mr-2"/>Challenge Completed!
                            </div>
                        )}
                        {isActive && !isDayCompleted && (
                            <button
                                onClick={handleCompleteDay}
                                disabled={isCompletingDay}
                                className="font-bold py-2 px-6 rounded-lg flex items-center justify-center transition-all text-base bg-green-500 text-white hover:bg-opacity-90 hover:scale-105 disabled:bg-gray-600 disabled:scale-100"
                            >
                                {isCompletingDay ? <Loader2 size={18} className="animate-spin mr-2"/> : <Check size={18} className="mr-2"/>}
                                Mark Today as Complete
                            </button>
                        )}
                    </div>
                    {isActive && !isDayCompleted && activeChallengeProgress && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-400 font-semibold mb-1.5">
                                Day {activeChallengeProgress.completedDays + 1} of {activeChallengeProgress.duration}
                            </p>
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-[rgb(255_117_93)] h-full transition-all duration-1000"
                                    style={{ width: `${(activeChallengeProgress.completedDays / activeChallengeProgress.duration) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h2 className="font-bold text-lg mb-3 flex items-center"><Users className="mr-2 text-[rgb(255_152_43)]"/> Fellow Challengers ({participants.length})</h2>
                    <div className="flex flex-wrap gap-2">
                        {participants.map(p => (
                            <img key={p.id} src={p.avatar} alt={p.name} title={p.name} className="w-10 h-10 rounded-full border-2 border-gray-600"/>
                        ))}
                        {participants.length === 0 && <p className="text-sm text-gray-500">Be the first to join!</p>}
                    </div>
                </div>
            </div>

            {/* Chat Section */}
            <div className="flex-grow bg-gray-800 rounded-xl shadow-lg mt-6 flex flex-col">
                 <h2 className="font-bold text-lg p-4 border-b border-gray-700 flex-shrink-0">Encouragement Hub</h2>
                 <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {sortedMessages.length > 0 ? (
                        sortedMessages.map((msg, index) => {
                             if (!msg || typeof msg !== 'object') {
                                return <div key={index} className="text-red-500 text-xs text-center">Invalid message data detected.</div>;
                            }
                            const isCurrentUser = msg.userId === currentUser?.id;
                            return (
                                <div key={msg.userId + index + msg.content} className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                    <img src={msg.userAvatar} alt={msg.userName} className="w-8 h-8 rounded-full"/>
                                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-3 rounded-xl max-w-xs md:max-w-md ${isCurrentUser ? 'bg-[rgb(59_130_246)] rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                                            {!isCurrentUser && <p className="text-xs font-bold text-[rgb(255_152_43)] mb-1">{msg.userName}</p>}
                                            <p className="text-sm text-white">{msg.content}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{formatTimestamp(msg.timestamp)}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-gray-500 pt-10">
                            <p>No messages yet.</p>
                            <p className="text-xs mt-1">Be the first to send some encouragement!</p>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                 </div>
                 <div className="flex-shrink-0 p-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                            placeholder="Encourage someone..."
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:ring-2 focus:ring-[rgb(255_117_93)] focus:border-[rgb(255_117_93)]"
                            disabled={isSending}
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={isSending || !newMessage.trim()} 
                            className="bg-[rgb(255_117_93)] p-3 rounded-full text-white disabled:bg-gray-600 transition-colors"
                        >
                            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChallengeDetailsPage;
