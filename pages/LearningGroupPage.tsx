import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, PlayCircle, Send, ExternalLink } from 'lucide-react';
import { GroupMessage, User, LearningGroup, Course, Submission } from '../types';
import { getLearningGroup, getCourses, getUserSubmissions, addMessageToGroup, getAllUsers } from '../services/firebaseService';
import { useAuth } from '../App';
import { Timestamp } from 'firebase/firestore';

const LearningGroupPage: React.FC = () => {
    const { groupId } = useParams<{groupId: string}>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [group, setGroup] = useState<LearningGroup | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId || !currentUser) return;
        
        const fetchData = async () => {
            setLoading(true);
            const [fetchedGroup, fetchedCourses, fetchedSubmissions, fetchedUsers] = await Promise.all([
                getLearningGroup(groupId),
                getCourses(),
                getUserSubmissions(currentUser.id),
                getAllUsers(),
            ]);
            setGroup(fetchedGroup);
            setCourses(fetchedCourses);
            setUserSubmissions(fetchedSubmissions);
            setAllUsers(fetchedUsers);
            setLoading(false);
        };

        fetchData();
    }, [groupId, currentUser]);

    if (loading) {
        return <div className="p-4 text-white">Loading group...</div>;
    }

    if (!group) {
        return <div className="p-4 text-white">Learning group not found.</div>;
    }

    const leader = allUsers.find(u => u.id === group.leaderId);
    
    const handlePostMessage = async () => {
        if(!newMessage.trim() || !currentUser || !groupId) return;
        
        const message: GroupMessage = {
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            timestamp: new Date().toISOString(), // Will be converted to server timestamp
            content: newMessage,
        };
        
        await addMessageToGroup(groupId, message);
        
        // Optimistically update UI
        setGroup(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
        setNewMessage('');
    };
    
    const renderLesson = (lesson: any, index: number) => {
        if (lesson.type === 'internal') {
            const course = courses.find(c => c.id === lesson.courseId);
            const session = course?.sessions.find(s => s.id === lesson.sessionId);
            if (!course || !session) return null;
            
            const isCompleted = userSubmissions.some(
                sub => sub.courseId === course.id && sub.sessionId === session.id
            );

            return (
                <Link 
                    to={`/academy/${course.id}/session/${session.id}`} 
                    key={index}
                    className="flex items-center p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                >
                    <div className="mr-4">
                        {isCompleted ? <CheckCircle className="text-green-500" size={24} /> : <PlayCircle className="text-[rgb(255_152_43)]" size={24} />}
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-white">{`Step ${index + 1}: ${lesson.title}`}</p>
                        <p className="text-xs text-gray-400">{course.title}</p>
                    </div>
                    <div className="text-gray-400 text-2xl font-bold">&rarr;</div>
                </Link>
            );
        }

        if (lesson.type === 'external') {
            return (
                <a 
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={index}
                    className="flex items-center p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                >
                    <div className="mr-4"><ExternalLink className="text-[rgb(255_152_43)]" size={24} /></div>
                    <div className="flex-grow">
                        <p className="font-bold text-white">{`Step ${index + 1}: ${lesson.title}`}</p>
                        <p className="text-xs text-gray-400">{lesson.description}</p>
                    </div>
                     <div className="text-gray-400 text-2xl font-bold">&rarr;</div>
                </a>
            );
        }
        return null;
    }
    
    const formatTimestamp = (timestamp: Timestamp | string) => {
        if (!timestamp) return 'Just now';
        if (typeof timestamp === 'string') return timestamp; // For optimistic updates
        return new Date(timestamp.seconds * 1000).toLocaleString();
    }

    return (
        <div className="p-4 space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white">
            <div>
                 <button onClick={() => navigate('/academy')} className="text-[rgb(255_152_43)] mb-4">&larr; Back to Academy</button>
                <h1 className="text-3xl font-extrabold uppercase">{group.name}</h1>
                <p className="text-gray-400">Led by {leader?.name || 'Unknown Leader'}</p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-3">Learning Path</h2>
                <div className="space-y-2">
                    {group.content.map(renderLesson)}
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-3">Community Discussion</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {group.messages.map((msg, index) => {
                        // LIVE SYNC FIX: Display current user's live avatar if IDs match
                        const displayAvatar = (currentUser && msg.userId === currentUser.id) ? currentUser.avatar : msg.userAvatar;
                        return (
                            <div key={index} className="flex items-start space-x-3">
                                <img src={displayAvatar} alt={msg.userName} className="w-10 h-10 rounded-full object-cover"/>
                                <div>
                                    <div className="flex items-baseline space-x-2">
                                        <p className="font-bold text-white">{msg.userName}</p>
                                        <p className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</p>
                                    </div>
                                    <p className="text-gray-300">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-4 flex space-x-2">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    />
                    <button onClick={handlePostMessage} className="bg-[rgb(255_117_93)] p-3 rounded-lg text-white">
                        <Send size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LearningGroupPage;