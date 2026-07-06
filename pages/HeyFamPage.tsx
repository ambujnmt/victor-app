
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HeyFam, User, ResourceLink } from '../types';
import { useAuth } from '../App';
import * as firebaseService from '../services/firebaseService';
import { Loader2, Send, ArrowLeft, MapPin, Clock, Users, Link as LinkIcon, FileText, Music, Video, MessageSquare, Info, Plus, Trash2, Settings, X, Save, Upload } from 'lucide-react';

// --- HELPER: IMAGE PROCESSING ---
const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context error'));
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

const HeyFamPage: React.FC = () => {
    const { famId } = useParams<{ famId: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [fam, setFam] = useState<HeyFam | null>(null);
    const [participants, setParticipants] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chat' | 'info' | 'members'>('chat');
    
    // Chat State
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Resource State (Leader Only)
    const [isAddingResource, setIsAddingResource] = useState(false);
    const [newResource, setNewResource] = useState<{title: string, url: string, type: ResourceLink['type']}>({ title: '', url: '', type: 'link' });

    // Edit State (Leader Only)
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<HeyFam>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    useEffect(() => {
        if (!famId) {
            navigate('/community');
            return;
        }

        const unsubscribe = firebaseService.listenToHeyFam(famId, (updatedFam) => {
            setFam(updatedFam);
            if (updatedFam.memberIds && updatedFam.memberIds.length > 0) {
                firebaseService.getUsersByIds(updatedFam.memberIds).then(setParticipants);
            } else {
                setParticipants([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [famId, navigate]);

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [fam?.messages, activeTab]);

    const isMember = useMemo(() => {
        return currentUser && fam?.memberIds.includes(currentUser.id);
    }, [currentUser, fam]);

    const isLeader = useMemo(() => {
        return currentUser && fam?.leaderId === currentUser.id;
    }, [currentUser, fam]);

    const sortedMessages = useMemo(() => {
        if (!fam?.messages) return [];
        const msgs = [...fam.messages];
        return msgs.sort((a, b) => {
             const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp.toMillis();
             const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp.toMillis();
             return timeA - timeB;
        });
    }, [fam?.messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !fam || isSending) return;
        setIsSending(true);
        try {
            await firebaseService.addMessageToHeyFam(fam.id, {
                userId: currentUser.id,
                userName: currentUser.name,
                userAvatar: currentUser.avatar,
                content: newMessage.trim(),
                type: 'message'
            });
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleJoin = async () => {
        if (!currentUser || !fam) return;
        try {
            await firebaseService.joinHeyFam(currentUser.id, fam.id);
        } catch (error) {
            alert("Could not join group.");
        }
    };

    const handleLeave = async () => {
         if (!currentUser || !fam) return;
        if (window.confirm("Are you sure you want to leave this group?")) {
            try {
                await firebaseService.leaveHeyFam(currentUser.id, fam.id);
                navigate('/community');
            } catch (error) {
                alert("Could not leave group.");
            }
        }
    };

    const handleAddResource = async () => {
        if (!fam || !newResource.title || !newResource.url) return;
        const resource: ResourceLink = {
            id: `res_${Date.now()}`,
            ...newResource
        };
        await firebaseService.addResourceToHeyFam(fam.id, resource);
        setIsAddingResource(false);
        setNewResource({ title: '', url: '', type: 'link' });
    };

    const openEditModal = () => {
        if (fam) {
            setEditForm({
                name: fam.name,
                description: fam.description,
                meetingTime: fam.meetingTime,
                meetingLocation: fam.meetingLocation,
                avatar: fam.avatar
            });
            setIsEditing(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!fam || !editForm.name || !editForm.description) {
            alert("Name and description are required.");
            return;
        }
        try {
            await firebaseService.updateHeyFam(fam.id, editForm);
            setIsEditing(false);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update group info.");
        }
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsProcessingImage(true);
            try {
                const base64 = await processImage(e.target.files[0]);
                setEditForm(prev => ({ ...prev, avatar: base64 }));
            } catch (error) {
                console.error("Image upload failed", error);
                alert("Failed to process image.");
            } finally {
                setIsProcessingImage(false);
            }
        }
    };
    
    const formatTime = (ts: any) => {
         if (!ts) return '';
         const d = typeof ts === 'string' ? new Date(ts) : ts.toDate();
         return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="min-h-screen bg-[rgb(19,54,102)] flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>;
    if (!fam) return <div className="p-4 text-white">Group not found.</div>;

    return (
        <div className="bg-[rgb(19,54,102)] min-h-screen flex flex-col text-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate('/community')} className="text-[rgb(255_152_43)]"><ArrowLeft /></button>
                    <div className="flex space-x-3">
                        {isLeader && (
                             <button onClick={openEditModal} className="bg-gray-700 p-2 rounded-full hover:bg-gray-600 text-[rgb(255_152_43)]">
                                <Settings size={20}/>
                             </button>
                        )}
                        {isMember && !isLeader && (
                            <button onClick={handleLeave} className="text-xs text-red-400 underline">Leave Group</button>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <img src={fam.avatar} alt={fam.name} className="w-16 h-16 rounded-full border-2 border-[rgb(255,117,93)] object-cover"/>
                    <div className="flex-grow">
                        <h1 className="text-xl font-bold">{fam.name}</h1>
                        <p className="text-sm text-gray-400">{fam.memberIds.length} Members</p>
                    </div>
                     {!isMember && (
                        <button onClick={handleJoin} className="bg-[rgb(255_117_93)] px-4 py-2 rounded-full font-bold">Join</button>
                    )}
                </div>
                
                {isMember && (
                    <div className="flex mt-4 bg-gray-700 rounded-lg p-1">
                        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center ${activeTab === 'chat' ? 'bg-[rgb(59_130_246)] text-white' : 'text-gray-400'}`}>
                            <MessageSquare size={16} className="mr-1"/> Chat
                        </button>
                        <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center ${activeTab === 'info' ? 'bg-[rgb(59_130_246)] text-white' : 'text-gray-400'}`}>
                            <Info size={16} className="mr-1"/> Info
                        </button>
                         <button onClick={() => setActiveTab('members')} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center ${activeTab === 'members' ? 'bg-[rgb(59_130_246)] text-white' : 'text-gray-400'}`}>
                            <Users size={16} className="mr-1"/> Members
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto pb-20"> 
                {!isMember ? (
                    <div className="p-8 text-center text-gray-400">
                        <p className="mb-4">Join this Hey Fam to view the chat, members, and resources!</p>
                        <p className="italic text-sm">"{fam.description}"</p>
                    </div>
                ) : (
                    <>
                    {activeTab === 'chat' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-grow p-4 space-y-4">
                                {sortedMessages.map((msg, i) => {
                                    const isMe = msg.userId === currentUser?.id;
                                    const isAnnouncement = msg.type === 'announcement';
                                    
                                    // LIVE SYNC FIX: Display current user's live avatar
                                    const displayAvatar = isMe && currentUser ? currentUser.avatar : msg.userAvatar;

                                    if (isAnnouncement) {
                                        return (
                                            <div key={i} className="flex justify-center my-4">
                                                <div className="bg-[rgb(251_191_36/0.2)] border border-[rgb(251_191_36)] text-[rgb(251_191_36)] px-4 py-2 rounded-lg text-sm text-center max-w-xs">
                                                    <p className="font-bold uppercase text-xs mb-1">Announcement</p>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <img src={displayAvatar} className="w-8 h-8 rounded-full mx-2 self-end object-cover"/>
                                                <div className={`p-3 rounded-2xl ${isMe ? 'bg-[rgb(59_130_246)] text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                                    {!isMe && <p className="text-xs font-bold text-[rgb(255_152_43)] mb-1">{msg.userName}</p>}
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p className="text-[10px] opacity-50 text-right mt-1">{formatTime(msg.timestamp)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={chatEndRef} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="p-4 space-y-6">
                            <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
                                <h2 className="font-bold text-lg mb-2">About Us</h2>
                                <p className="text-gray-300">{fam.description}</p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center text-gray-300">
                                        <Clock size={18} className="mr-3 text-[rgb(255_152_43)]"/>
                                        <span>{fam.meetingTime || 'Time TBD'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-300">
                                        <MapPin size={18} className="mr-3 text-[rgb(255_152_43)]"/>
                                        <span>{fam.meetingLocation || 'Location TBD'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="font-bold text-lg">Resources</h2>
                                    {isLeader && <button onClick={() => setIsAddingResource(!isAddingResource)} className="text-[rgb(16_185_129)]"><Plus size={20}/></button>}
                                </div>
                                
                                {isAddingResource && (
                                    <div className="bg-gray-700 p-3 rounded-lg mb-4 space-y-2">
                                        <input placeholder="Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-sm"/>
                                        <input placeholder="URL" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-sm"/>
                                        <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value as any})} className="w-full p-2 rounded bg-gray-800 text-sm">
                                            <option value="link">Link</option>
                                            <option value="pdf">PDF</option>
                                            <option value="music">Music</option>
                                            <option value="video">Video</option>
                                        </select>
                                        <button onClick={handleAddResource} className="w-full bg-[rgb(16_185_129)] py-2 rounded font-bold text-sm">Add</button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {fam.resources?.length > 0 ? fam.resources.map(res => {
                                        const Icon = res.type === 'music' ? Music : res.type === 'video' ? Video : res.type === 'pdf' ? FileText : LinkIcon;
                                        return (
                                            <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                                                <Icon size={20} className="mr-3 text-[rgb(255_152_43)]"/>
                                                <span className="font-semibold flex-grow">{res.title}</span>
                                                <LinkIcon size={14} className="text-gray-500"/>
                                            </a>
                                        )
                                    }) : <p className="text-gray-500 text-sm">No resources added yet.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="p-4">
                             <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                                {participants.map((p, i) => {
                                    // LIVE SYNC FIX: Display current user's live avatar
                                    const displayAvatar = (currentUser && p.id === currentUser.id) ? currentUser.avatar : p.avatar;
                                    return (
                                        <div key={p.id} className={`flex items-center p-4 ${i !== participants.length -1 ? 'border-b border-gray-700' : ''}`}>
                                            <img src={displayAvatar} className="w-10 h-10 rounded-full mr-3 object-cover"/>
                                            <div className="flex-grow">
                                                <p className="font-bold">{p.name} {p.id === fam.leaderId && <span className="text-xs bg-[rgb(251_191_36)] text-black px-2 py-0.5 rounded-full ml-2">Leader</span>}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    )}
                    </>
                )}
            </div>

            {/* Chat Input Footer */}
            {isMember && activeTab === 'chat' && (
                 <div className="fixed bottom-[72px] left-0 right-0 p-3 bg-gray-900 border-t border-gray-700">
                    <div className="max-w-lg mx-auto flex items-center gap-2">
                         <input 
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Say something..."
                            className="flex-grow p-3 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[rgb(255_152_43)]"
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} className="bg-[rgb(255_117_93)] p-3 rounded-full text-white disabled:bg-gray-700">
                            <Send size={20}/>
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
                        <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                        <h2 className="text-xl font-bold mb-4 flex items-center"><Settings className="mr-2 text-[rgb(255_152_43)]"/> Edit Group Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-400">Group Name</label>
                                <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 bg-gray-700 rounded-md mt-1 text-white"/>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-400">Picture URL</label>
                                <div className="flex gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input 
                                            value={editForm.avatar || ''} 
                                            onChange={e => setEditForm({...editForm, avatar: e.target.value})} 
                                            className="w-full p-3 bg-gray-700 rounded-md text-white placeholder-gray-500" 
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isProcessingImage}
                                        className="bg-gray-700 border border-gray-600 text-white px-3 rounded-md flex items-center justify-center hover:bg-gray-600 transition-colors"
                                        title="Upload Image"
                                    >
                                        {isProcessingImage ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                        accept="image/*"
                                    />
                                </div>
                                {editForm.avatar && (
                                    <img src={editForm.avatar} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded-md border border-gray-600"/>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-400">Description</label>
                                <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-3 bg-gray-700 rounded-md mt-1 text-white h-24"/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-bold text-gray-400">Meeting Time</label>
                                    <input value={editForm.meetingTime || ''} onChange={e => setEditForm({...editForm, meetingTime: e.target.value})} className="w-full p-3 bg-gray-700 rounded-md mt-1 text-white"/>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400">Location</label>
                                    <input value={editForm.meetingLocation || ''} onChange={e => setEditForm({...editForm, meetingLocation: e.target.value})} className="w-full p-3 bg-gray-700 rounded-md mt-1 text-white"/>
                                </div>
                            </div>
                            <button onClick={handleSaveEdit} className="w-full bg-[rgb(255_117_93)] font-bold py-3 rounded-lg mt-2 flex items-center justify-center">
                                <Save className="mr-2" size={18}/> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeyFamPage;
