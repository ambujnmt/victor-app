
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { User, Challenge, Course, HeyFam } from '../types';
import * as firebaseService from '../services/firebaseService';
import { 
    ArrowLeft, Users, CheckCircle, Send, Award, 
    MessageSquare, Loader2, PlusCircle, Settings, 
    Save, Upload, X, BookOpen, UserPlus, ShieldCheck, Search, UserCheck 
} from 'lucide-react';
import InviteFriendModal from '../components/InviteFriendModal';

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
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
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

const LeaderDashboardPage: React.FC = () => {
    const { user: leader } = useAuth();
    const navigate = useNavigate();
    
    // Data States
    const [ledGroups, setLedGroups] = useState<HeyFam[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<HeyFam | null>(null);
    
    // UI Tools States
    const [announcement, setAnnouncement] = useState('');
    const [challengeSuggestion, setChallengeSuggestion] = useState('');
    const [courseAssignment, setCourseAssignment] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    
    // Modal & Loading States
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<HeyFam>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingFam, setIsCreatingFam] = useState(false);
    const [newFam, setNewFam] = useState({ name: '', description: '', meetingTime: '', meetingLocation: '' });
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!leader) return;
            setLoading(true);
            try {
                const [fams, users, challenges, courses] = await Promise.all([
                    firebaseService.getHeyFams(),
                    firebaseService.getAllUsers(),
                    firebaseService.getChallenges(),
                    firebaseService.getCourses()
                ]);
                
                const userLedGroups = fams.filter(g => g.leaderId === leader.id);
                setLedGroups(userLedGroups);
                setAllUsers(users);
                setAllChallenges(challenges);
                setAllCourses(courses);

                // Re-select group if we have one, otherwise pick the first
                if (selectedGroup) {
                    const refreshed = userLedGroups.find(g => g.id === selectedGroup.id);
                    if (refreshed) setSelectedGroup(refreshed);
                } else if (userLedGroups.length > 0) {
                    setSelectedGroup(userLedGroups[0]);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [leader]);

    const groupMembers = useMemo(() => {
        if (!selectedGroup) return [];
        return allUsers.filter(u => selectedGroup.memberIds.includes(u.id));
    }, [selectedGroup, allUsers]);

    const searchableUsers = useMemo(() => {
        if (!userSearchQuery.trim()) return [];
        const query = userSearchQuery.toLowerCase();
        return allUsers
            .filter(u => !selectedGroup?.memberIds.includes(u.id)) // Only show users NOT in group
            .filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
            .slice(0, 5);
    }, [allUsers, userSearchQuery, selectedGroup]);
    
    const handleAddMember = async (userToAdd: User) => {
        if (!selectedGroup || !leader) return;
        try {
            await firebaseService.joinHeyFam(userToAdd.id, selectedGroup.id);
            // Local update to selectedGroup to prevent re-fetch flicker
            setSelectedGroup(prev => prev ? { ...prev, memberIds: [...prev.memberIds, userToAdd.id] } : null);
            setUserSearchQuery('');
            alert(`${userToAdd.name} has been added to the roster!`);
        } catch (error) {
            console.error(error);
            alert("Failed to add member.");
        }
    };

    const handleSendAnnouncement = async () => {
        if (!announcement.trim() || !selectedGroup || !leader) return;
        await firebaseService.addMessageToHeyFam(selectedGroup.id, { 
            userId: leader.id, userName: leader.name, userAvatar: leader.avatar, 
            content: announcement, type: 'announcement' 
        });
        setAnnouncement('');
        alert('Announcement sent!');
    };
    
    const handleSuggestChallenge = async () => {
        if (!challengeSuggestion || !selectedGroup || !leader) return;
        const challenge = allChallenges.find(c => c.id === challengeSuggestion);
        if (challenge) {
            await firebaseService.addMessageToHeyFam(selectedGroup.id, { 
                 userId: leader.id, userName: leader.name, userAvatar: leader.avatar, 
                 content: `I challenge us to try the "${challenge.title}" challenge together!`,
                 type: 'announcement'
            });
            setChallengeSuggestion('');
            alert('Challenge suggested!');
        }
    };

    const handleAssignCourse = async () => {
        if (!courseAssignment || !selectedGroup || !leader) return;
        const course = allCourses.find(c => c.id === courseAssignment);
        if (course) {
            const promises = groupMembers.map(member => 
                firebaseService.sendCourseInvitation(leader, member.email, course)
            );
            await Promise.all(promises);
            
            await firebaseService.addMessageToHeyFam(selectedGroup.id, { 
                userId: leader.id, userName: leader.name, userAvatar: leader.avatar, 
                content: `Class Update: I have assigned the course "${course.title}" to everyone in this group. Check your notifications!`,
                type: 'announcement'
           });
           
            setCourseAssignment('');
            alert(`Assigned "${course.title}" to all ${groupMembers.length} members!`);
        }
    };

    const handleCreateFam = async () => {
        if(!leader || !newFam.name || !newFam.description) return;
        setIsSaving(true);
        const famData: Omit<HeyFam, 'id'> = {
            name: newFam.name, description: newFam.description,
            meetingTime: newFam.meetingTime, meetingLocation: newFam.meetingLocation,
            leaderId: leader.id, memberIds: [leader.id],
            avatar: `https://ui-avatars.com/api/?name=${newFam.name}&background=random`,
            messages: [], resources: [], memberCount: 1
        };
        try {
            const id = await firebaseService.createHeyFam(famData);
            await firebaseService.joinHeyFam(leader.id, id);
            window.location.reload(); 
        } catch(e) { 
            console.error(e); 
            setIsSaving(false);
            alert("Error creating group.");
        }
    };

    const openEditModal = () => {
        if (selectedGroup) {
            setEditForm({
                name: selectedGroup.name, description: selectedGroup.description,
                meetingTime: selectedGroup.meetingTime, meetingLocation: selectedGroup.meetingLocation,
                avatar: selectedGroup.avatar
            });
            setIsEditing(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedGroup || !editForm.name) return;
        setIsSaving(true);
        try {
            await firebaseService.updateHeyFam(selectedGroup.id, editForm);
            // Manually update selected group data to avoid blank page
            setSelectedGroup(prev => prev ? { ...prev, ...editForm } : null);
            setIsSaving(false);
            setIsEditing(false);
        } catch (e) {
            console.error("Save Error:", e);
            setIsSaving(false);
            alert("Error updating group.");
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

    if (loading) return <div className="min-h-screen bg-[rgb(19,54,102)] flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8"/></div>;

    return (
        <div className="pt-[calc(env(safe-area-inset-top)+16px)] space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white pb-24 font-sans">
            <div className="flex justify-between items-center">
                <button onClick={() => navigate('/my-plan')} className="flex items-center text-[rgb(255_152_43)] font-bold hover:text-white transition-colors">
                    <ArrowLeft size={16} className="mr-2"/> Back to Profile
                </button>
                <div className="flex items-center space-x-2">
                    <ShieldCheck size={14} className="text-[rgb(59_130_246)]" />
                    <div className="text-[10px] bg-[rgb(59_130_246/0.1)] text-[rgb(59_130_246)] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-[rgb(59_130_246/0.2)]">Leader Mode</div>
                </div>
            </div>
            
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">My Groups</h1>

            <div className="bg-gray-800 p-1 rounded-[2rem] shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="bg-gray-900 rounded-[1.8rem] p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs font-black flex items-center uppercase tracking-widest text-gray-500"><Users className="mr-2 text-[rgb(255_152_43)]" size={16}/> Select Group to Manage</h2>
                        <button onClick={() => setIsCreatingFam(!isCreatingFam)} className="text-[9px] bg-[rgb(16_185_129)] text-white px-4 py-2 rounded-xl flex items-center font-black uppercase tracking-[0.1em] shadow-lg active:scale-95 transition-all">
                            <PlusCircle size={12} className="mr-1.5"/> Launch New
                        </button>
                    </div>
                    
                    {ledGroups.length > 0 ? (
                        <div className="relative">
                            <select 
                                value={selectedGroup?.id || ''} 
                                onChange={e => {
                                    const g = ledGroups.find(g => g.id === e.target.value);
                                    if (g) setSelectedGroup(g);
                                }}
                                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white font-black text-lg italic outline-none focus:border-[rgb(59_130_246)] appearance-none pr-10"
                            >
                                {ledGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><Users size={20}/></div>
                        </div>
                    ) : (
                         <div className="py-10 text-center border-2 border-dashed border-gray-800 rounded-2xl">
                             <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No Active Groups Found</p>
                         </div>
                    )}
                </div>

                {isCreatingFam && (
                    <div className="p-6 space-y-3 bg-[rgb(19,54,102)]/30 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-black text-[rgb(16_185_129)] uppercase tracking-widest">New Group Setup</p>
                        <input placeholder="Group Name" value={newFam.name} onChange={e => setNewFam({...newFam, name: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-800 text-white border border-gray-700 outline-none focus:border-[rgb(16_185_129)] font-bold"/>
                        <textarea placeholder="Mission Statement / Description" value={newFam.description} onChange={e => setNewFam({...newFam, description: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-800 text-white border border-gray-700 outline-none h-24 text-sm"/>
                        <button onClick={handleCreateFam} disabled={isSaving} className="w-full bg-[rgb(16_185_129)] text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                            {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Publish Group'}
                        </button>
                    </div>
                )}
            </div>
            
            {selectedGroup && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* ID Card Display */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1 rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden">
                        <div className="bg-gray-900/60 p-8 rounded-[2.3rem] flex items-start justify-between relative z-10 backdrop-blur-sm">
                            <div className="flex items-center">
                                <div className="relative">
                                    <img src={selectedGroup.avatar} className="w-24 h-24 rounded-[2rem] border-4 border-[rgb(59_130_246)] object-cover shadow-2xl mr-6"/>
                                    <div className="absolute -bottom-2 -right-2 bg-[rgb(16_185_129)] text-white p-1.5 rounded-lg border-2 border-gray-900 shadow-xl"><CheckCircle size={14}/></div>
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">{selectedGroup.name}</h2>
                                    </div>
                                    <p className="text-xs text-[rgb(59_130_246)] font-black uppercase tracking-[0.2em] mt-2 flex items-center">
                                        <Users size={14} className="mr-2"/> {groupMembers.length} ACTIVE MEMBERS
                                    </p>
                                </div>
                            </div>
                            <button onClick={openEditModal} className="bg-gray-800 hover:bg-gray-700 text-[rgb(255_152_43)] p-4 rounded-3xl transition-all shadow-xl active:scale-90 border border-white/5"><Settings size={24}/></button>
                        </div>
                    </div>

                    {/* Tools Section */}
                    <div className="bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl space-y-8 border border-white/5">
                         <div className="flex justify-between items-end border-b border-gray-700 pb-4">
                            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center">
                                <MessageSquare className="mr-3 text-[rgb(255_152_43)]" size={26}/> Command Center
                            </h2>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Group ID: {selectedGroup.id.slice(-6)}</span>
                         </div>
                         
                         <div className="space-y-8">
                            <div className="bg-[rgb(59_130_246/0.05)] p-6 rounded-[2rem] border border-[rgb(59_130_246/0.2)] flex items-center justify-between group">
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-wide text-lg">Send Invitations</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Share an invite link or email</p>
                                </div>
                                <button 
                                    onClick={() => setShowInviteModal(true)}
                                    className="bg-[rgb(59_130_246)] text-white p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center font-black uppercase text-[10px] tracking-widest"
                                >
                                    <UserPlus className="mr-2" size={20}/> Invite
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Post Global Announcement</label>
                                <div className="flex gap-3">
                                    <input value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="Message to everyone in group..." className="flex-grow p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white text-sm outline-none focus:border-[rgb(255_117_93)] transition-all font-medium"/>
                                    <button onClick={handleSendAnnouncement} className="bg-[rgb(255_117_93)] p-4 rounded-2xl text-white hover:brightness-110 shadow-lg active:scale-95 transition-all"><Send size={20}/></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Shared Challenge</label>
                                    <div className="flex gap-2">
                                        <select value={challengeSuggestion} onChange={e => setChallengeSuggestion(e.target.value)} className="flex-grow p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white text-xs outline-none font-bold">
                                            <option value="">-- Choose Challenge --</option>
                                            {allChallenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                        <button onClick={handleSuggestChallenge} className="bg-[rgb(255,117,93)] p-4 rounded-2xl text-white hover:brightness-110 shadow-lg active:scale-95 transition-all"><Award size={20}/></button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Course Assignment</label>
                                    <div className="flex gap-2">
                                        <select value={courseAssignment} onChange={e => setCourseAssignment(e.target.value)} className="flex-grow p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white text-xs outline-none font-bold">
                                            <option value="">-- Choose Course Path --</option>
                                            {allCourses.filter(c => c.isPublished).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                        <button onClick={handleAssignCourse} className="bg-[rgb(16_185_129)] p-4 rounded-2xl text-white hover:brightness-110 shadow-lg active:scale-95 transition-all"><BookOpen size={20}/></button>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                    
                    {/* Roster & Direct Add Section */}
                    <div className="bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center"><Users className="mr-3 text-gray-500" size={24}/> Member Roster</h2>
                            <span className="bg-black/40 px-4 py-1.5 rounded-full text-[10px] font-black text-[rgb(251_191_36)] border border-white/5">{groupMembers.length} IN CIRCLE</span>
                        </div>

                        {/* Direct Member Search Tool */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[rgb(255_152_43)] uppercase tracking-[0.3em] ml-2 flex items-center">
                                <Search size={12} className="mr-1.5"/> Find & Add Members
                            </label>
                            <div className="relative">
                                <input 
                                    value={userSearchQuery} 
                                    onChange={e => setUserSearchQuery(e.target.value)} 
                                    placeholder="Search by name or email..." 
                                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white text-sm outline-none focus:border-[rgb(59_130_246)]"
                                />
                                {userSearchQuery && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {searchableUsers.length > 0 ? (
                                            searchableUsers.map(u => (
                                                <button 
                                                    key={u.id} 
                                                    onClick={() => handleAddMember(u)}
                                                    className="w-full p-4 flex items-center justify-between hover:bg-[rgb(59_130_246/0.1)] transition-colors border-b border-gray-700 last:border-0"
                                                >
                                                    <div className="flex items-center">
                                                        <img src={u.avatar} className="w-10 h-10 rounded-full mr-3 border border-gray-600"/>
                                                        <div className="text-left">
                                                            <p className="font-bold text-sm leading-none">{u.name}</p>
                                                            <p className="text-[10px] text-gray-500 mt-1">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    <UserCheck size={18} className="text-[rgb(59_130_246)]"/>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-gray-500 italic">No matching members found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-3 scrollbar-hide">
                            {groupMembers.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-4 bg-black/20 rounded-[1.5rem] border border-white/5 hover:bg-black/30 transition-all group">
                                    <div className="flex items-center">
                                        <img src={m.avatar} className="w-12 h-12 rounded-xl mr-4 border border-gray-700 object-cover shadow-lg group-hover:scale-105 transition-transform"/>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm uppercase italic leading-none">{m.name}</span>
                                            <span className="text-[8px] text-[rgb(255_152_43)] font-black uppercase tracking-widest mt-1.5">
                                                {m.id === selectedGroup.leaderId ? 'Group Leader' : `${m.points} XP EARNED`}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/community')} className="p-3 text-gray-600 hover:text-white transition-colors bg-white/5 rounded-xl"><MessageSquare size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && selectedGroup && (
                <InviteFriendModal
                    user={leader!}
                    onClose={() => setShowInviteModal(false)}
                    target={{
                        id: selectedGroup.id,
                        title: selectedGroup.name,
                        type: 'group',
                        data: selectedGroup
                    }}
                />
            )}

            {/* Edit Group Settings Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-gray-800 w-full max-w-md rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] p-10 relative border border-white/10 overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setIsEditing(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full transition-all"><X size={20}/></button>
                        
                        <div className="mb-10 text-center">
                             <h2 className="text-3xl font-black uppercase italic flex items-center justify-center mb-2">
                                <Settings className="mr-3 text-[rgb(255_152_43)]" size={32}/> Group Settings
                             </h2>
                             <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Update Group Identity & Vision</p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex flex-col items-center">
                                <div className="relative mb-4">
                                    <img src={editForm.avatar} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-[rgb(59_130_246)] shadow-2xl"/>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={isProcessingImage}
                                        className="absolute -bottom-2 -right-2 p-3 bg-[rgb(59_130_246)] text-white rounded-2xl shadow-2xl hover:scale-105 active:scale-90 transition-all border-4 border-gray-800"
                                    >
                                        {isProcessingImage ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>}
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 block mb-2">Display Name</label>
                                    <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-5 bg-gray-900 rounded-[1.5rem] text-white font-black text-xl italic outline-none focus:border-[rgb(59_130_246)] border border-gray-700 shadow-inner" placeholder="Group Name"/>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 block mb-2">Mission Statement</label>
                                    <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-5 bg-gray-900 rounded-[1.5rem] text-white text-sm h-32 outline-none border border-gray-700 shadow-inner leading-relaxed" placeholder="Short Vision/Description"/>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 block mb-2">Time</label>
                                        <input value={editForm.meetingTime || ''} onChange={e => setEditForm({...editForm, meetingTime: e.target.value})} className="w-full p-5 bg-gray-900 rounded-[1.5rem] text-white text-xs font-bold border border-gray-700 shadow-inner" placeholder="When?"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 block mb-2">Venue</label>
                                        <input value={editForm.meetingLocation || ''} onChange={e => setEditForm({...editForm, meetingLocation: e.target.value})} className="w-full p-5 bg-gray-900 rounded-[1.5rem] text-white text-xs font-bold border border-gray-700 shadow-inner" placeholder="Where?"/>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveEdit} 
                                disabled={isSaving}
                                className="w-full bg-[rgb(16_185_129)] text-white font-black py-6 rounded-[2rem] mt-4 flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-lg"
                            >
                                {isSaving ? <Loader2 className="animate-spin mr-3" /> : <Save className="mr-3" size={24}/>}
                                {isSaving ? 'UPDATING...' : 'SAVE CHANGES'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderDashboardPage;
