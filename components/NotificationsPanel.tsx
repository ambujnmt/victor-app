
import React, { useState } from 'react';
import { useAuth } from '../App';
import { AppNotification } from '../types';
import { X, Check, Bell, ThumbsDown, ArrowRight, PlayCircle, BookOpen, UserPlus, Loader2 } from 'lucide-react';
import { respondToChallengeInvitation, markNotificationAsRead, respondToGroupInvitation } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationCard: React.FC<{ notification: AppNotification; onClosePanel: () => void }> = ({ notification, onClosePanel }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isResponding, setIsResponding] = useState(false);

    const handleResponse = async (accepted: boolean) => {
        if (!user || isResponding) return;
        setIsResponding(true);
        try {
            if (notification.type === 'challenge_invitation') {
                await respondToChallengeInvitation(notification.relatedId, notification.id, user, accepted);
                if (accepted) {
                    onClosePanel();
                    navigate(`/challenges/${notification.relatedId}`);
                }
            } else if (notification.type === 'group_invitation') {
                await respondToGroupInvitation(notification.relatedId, notification.id, user, accepted);
                if (accepted) {
                    onClosePanel();
                    navigate(`/community/fam/${notification.relatedId}`);
                }
            }
        } catch (error) {
            console.error("Failed to respond to invitation:", error);
            alert("Could not respond to the invitation. Please try again.");
        } finally {
            setIsResponding(false);
        }
    };

    const handleMarkAsRead = async () => {
        if (!user) return;
        await markNotificationAsRead(user.id, notification.id);
    };

    const handleViewChallenge = () => {
        navigate('/challenges');
        onClosePanel();
    };
    
    const handleViewLesson = () => {
        navigate(`/academy/${notification.relatedId}`);
        onClosePanel();
        handleMarkAsRead();
    };

    const handleViewCourse = () => {
        navigate(`/academy`); 
        onClosePanel();
        handleMarkAsRead();
    };

    const timeAgo = (date: any) => {
        if (!date || !date.seconds) return 'just now';
        const seconds = Math.floor((new Date().getTime() - new Date(date.seconds * 1000).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div className={`p-4 rounded-xl border ${notification.isRead ? 'bg-gray-800 border-gray-700/50' : 'bg-[rgb(59_130_246/0.1)] border-[rgb(59_130_246/0.3)] shadow-lg'}`}>
            <p className="text-sm text-gray-300 font-medium leading-relaxed">{notification.text}</p>
            <p className="text-[10px] text-gray-500 font-black uppercase mt-2 tracking-widest">{timeAgo(notification.createdAt)}</p>
            
            {(notification.type === 'challenge_invitation' || notification.type === 'group_invitation') && !notification.isRead && (
                <div className="flex space-x-2 mt-4">
                    <button onClick={() => handleResponse(true)} disabled={isResponding} className="flex-1 bg-[rgb(16_185_129)] hover:brightness-110 disabled:opacity-50 text-white font-black py-2.5 px-3 text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95">
                        {isResponding ? <Loader2 size={14} className="mr-1.5 animate-spin"/> : <Check size={14} className="mr-1.5"/>} Accept
                    </button>
                    <button onClick={() => handleResponse(false)} disabled={isResponding} className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 font-black py-2.5 px-3 text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center transition-all active:scale-95">
                        <ThumbsDown size={14} className="mr-1.5"/> Decline
                    </button>
                </div>
            )}

            {notification.type === 'group_challenge_suggestion' && !notification.isRead && (
                 <button onClick={handleViewChallenge} className="w-full mt-4 bg-[rgb(255,117,93)] text-white font-black py-2.5 px-3 text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center shadow-lg">
                    View Challenge <ArrowRight size={14} className="ml-1.5"/>
                </button>
            )}
            {notification.type === 'lesson_invitation' && (
                 <button onClick={handleViewLesson} className="w-full mt-4 bg-[rgb(255_117_93)] text-white font-black py-2.5 px-3 text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center shadow-lg">
                    Watch Lesson <PlayCircle size={14} className="ml-1.5"/>
                </button>
            )}
            {notification.type === 'course_invitation' && (
                 <button onClick={handleViewCourse} className="w-full mt-4 bg-[#8B5CF6] text-white font-black py-2.5 px-3 text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center shadow-lg">
                    Go to Course <BookOpen size={14} className="ml-1.5"/>
                </button>
            )}
            {notification.type === 'generic' && !notification.isRead && (
                 <button onClick={handleMarkAsRead} className="w-full mt-4 bg-gray-700 text-white font-black py-2.5 px-3 text-[10px] uppercase tracking-widest rounded-lg">
                    Mark as Read
                </button>
            )}
        </div>
    );
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
    const { notifications } = useAuth();

    return (
        <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out border-l border-white/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center flex-shrink-0 bg-gray-900/50 backdrop-blur-md">
                    <h3 className="text-xl font-black uppercase italic flex items-center"><Bell className="mr-3 text-[rgb(251_191_36)]" size={24}/> Notifications</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-grow bg-[rgb(19,54,102)]/30">
                    {notifications.length > 0 ? (
                        notifications.map(n => <NotificationCard key={n.id} notification={n} onClosePanel={onClose}/>)
                    ) : (
                        <div className="text-center py-20">
                            <div className="bg-white/5 inline-block p-6 rounded-full mb-6 text-gray-600">
                                <Bell size={48} />
                            </div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest">You're all caught up!</p>
                            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] mt-2">Check back later for updates</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPanel;
