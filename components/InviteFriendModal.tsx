
import React, { useState } from 'react';
import { User, Challenge, Session, Course, HeyFam } from '../types';
import { X, Send, Loader2, Share2 } from 'lucide-react';
import { sendChallengeInvitation, sendLessonInvitation, sendCourseInvitation, sendGroupInvitation } from '../services/firebaseService';

interface InviteFriendModalProps {
    target: {
        id: string;
        title: string;
        type: 'challenge' | 'lesson' | 'course' | 'group';
        data?: any; // Object matching the type
        courseId?: string; // Required if type is 'lesson'
    };
    user: User;
    onClose: () => void;
}

const InviteFriendModal: React.FC<InviteFriendModalProps> = ({ target, user, onClose }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSendDirectInvitation = async () => {
        if (!email.trim()) {
            setStatus('error');
            setMessage('Please enter an email address.');
            return;
        }
        setStatus('sending');
        setMessage('');
        
        let result;
        
        if (target.type === 'challenge') {
             result = await sendChallengeInvitation(user, email, target.data as Challenge);
        } else if (target.type === 'lesson' && target.courseId) {
             result = await sendLessonInvitation(user, email, target.data as Session, target.courseId);
        } else if (target.type === 'course') {
             result = await sendCourseInvitation(user, email, target.data as Course);
        } else if (target.type === 'group') {
             result = await sendGroupInvitation(user, email, target.data as HeyFam);
        } else {
            result = { success: false, message: "Invalid invitation type." };
        }

        if (result.success) {
            setStatus('success');
        } else {
            setStatus('error');
        }
        setMessage(result.message);
    };

    const handleShareLink = () => {
        let link = "";
        let text = "";

        if (target.type === 'lesson') {
            link = `${window.location.origin}/#/academy/${target.courseId}/session/${target.id}`;
            text = `${user.name} invited you to watch the lesson "${target.title}" on Hey Life!`;
        } else if (target.type === 'course') {
            link = `${window.location.origin}/#/academy`; 
            text = `${user.name} invited you to take the full course "${target.title}" on Hey Life!`;
        } else if (target.type === 'group') {
            link = `${window.location.origin}/#/community/fam/${target.id}`;
            text = `${user.name} invited you to join the group "${target.title}" on Hey Life!`;
        } else {
            link = `${window.location.origin}/#/challenges/${target.id}?invite=true`;
            text = `${user.name} invited you to the "${target.title}" challenge on Hey Life!`;
        }

        if (navigator.share) {
            navigator.share({
                title: `Join me on Hey Life!`,
                text: text,
                url: link,
            }).catch(error => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(`${text} ${link}`);
            alert('Link copied to clipboard!');
        }
    };

    const typeLabel = {
        'challenge': 'Challenge',
        'lesson': 'Lesson',
        'course': 'Course',
        'group': 'Hey Fam'
    }[target.type];

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-[2rem] shadow-2xl max-w-md w-full flex flex-col border border-white/5">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-bold">Invite to {typeLabel}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-full"><X size={20}/></button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-1">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Share target:</p>
                        <p className="text-white font-black text-xl italic uppercase leading-tight">"{target.title}"</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Social Sharing</p>
                        <button onClick={handleShareLink} className="w-full bg-white text-gray-900 font-black py-4 px-4 rounded-2xl hover:bg-gray-100 flex items-center justify-center transition-all active:scale-95 shadow-xl">
                            <Share2 className="mr-3" size={20}/> Share Invite Link
                        </button>
                    </div>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="flex-shrink mx-4 text-gray-600 text-[10px] font-black uppercase tracking-widest">OR</span>
                        <div className="flex-grow border-t border-gray-700"></div>
                    </div>
                    
                    <div className="space-y-3">
                         <p className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Direct Notification</p>
                        <div className="flex space-x-2">
                             <input 
                                type="email" 
                                placeholder="Enter member email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="flex-grow p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[rgb(255_117_93)] transition-all"
                            />
                            <button onClick={handleSendDirectInvitation} disabled={status === 'sending'} className="bg-[rgb(255_117_93)] text-white font-black p-4 rounded-2xl hover:brightness-110 flex items-center justify-center transition-all active:scale-95 disabled:bg-gray-600">
                                {status === 'sending' ? <Loader2 className="animate-spin" size={24}/> : <Send size={24}/>}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-2xl text-xs font-bold text-center animate-in zoom-in ${status === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800/30' : 'bg-red-900/30 text-red-400 border border-red-800/30'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteFriendModal;
