
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Post, HeyFam, PostUser, PrayerRequest, LeaderboardUser, SpiritSnack } from '../types';
import { Heart, MessageCircle, Send, HandHelping, Trophy, Sparkles, Users, Loader2, PlayCircle, X, PauseCircle, RotateCcw, Volume2, VolumeX, CheckCircle, Share2, Copy, Music, Quote } from 'lucide-react';
import { useAuth } from '../App';
import { getPosts, getHeyFams, addPost, getAllUsers, getPrayerRequests, addPrayerRequest, incrementPrayerCount, updateUserData } from '../services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { GuidedPrayerModal } from '../components/GuidedPrayerModal';
import { FeedInteractionBar } from '../components/FeedInteractionBar';
// FIX: Import getDailySpiritSnack to provide snack for GuidedPrayerModal
import { getDailySpiritSnack } from '../constants/staticData';




const PrayerRequestCard: React.FC<{
    request: PrayerRequest;
    currentUserId: string;
    currentUserAvatar?: string;
    onPray: (requestId: string) => void;
    t: (key: string, options?: any) => string;
}> = ({ request, currentUserId, currentUserAvatar, onPray, t }) => {
    const hasPrayed = request.prayedBy?.includes(currentUserId);
    const displayName = request.isAnonymous ? 'Anonymous' : request.userName;
    let displayAvatar = request.userAvatar;
    if (!request.isAnonymous && request.userId === currentUserId && currentUserAvatar) {
        displayAvatar = currentUserAvatar;
    } else if (request.isAnonymous) {
        displayAvatar = `https://i.pravatar.cc/150?u=anonymous`;
    }

    const formatTimestamp = (timestamp: Timestamp | string) => {
        if (!timestamp) return 'Just now';
        if (typeof timestamp === 'string') return new Date(timestamp).toLocaleString();
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-5 space-y-3">
            <div className="flex items-center mb-3">
                <img src={displayAvatar} alt={displayName} className="w-12 h-12 rounded-full mr-4 border-2 border-[#8B5CF6] object-cover" />
                <div>
                    <p className="font-bold text-white text-lg">{displayName}</p>
                    <p className="text-xs text-gray-400">{formatTimestamp(request.timestamp)}</p>
                </div>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{request.requestText}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <div className="flex items-center space-x-2 text-[rgb(255_152_43)]">
                    <Heart size={18} />
                    <span className="font-semibold text-sm">{t('community.prayer.prayed_for', { count: request.prayerCount })}</span>
                </div>
                <button
                    onClick={() => onPray(request.id)}
                    disabled={hasPrayed}
                    className={`font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all text-sm ${hasPrayed
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-[rgb(255_117_93)] text-white hover:bg-opacity-90 hover:scale-105'
                        }`}
                >
                    {hasPrayed ? t('community.prayer.prayed') : t('community.prayer.i_prayed')}
                </button>
            </div>
        </div>
    );
};

const PostCard: React.FC<{
    post: Post;
    currentUser: User;
    onAddComment: (postId: string, comment: any) => void;
}> = ({ post, currentUser, onAddComment }) => {

    const formatTimestamp = (timestamp: Timestamp | string) => {
        if (!timestamp) return 'Just now';
        if (typeof timestamp === 'string') return new Date(timestamp).toLocaleString();
        return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    const displayAvatar = post.user.id === currentUser.id ? currentUser.avatar : post.user.avatar;

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
            <div className="p-4">
                <div className="flex items-center mb-4">
                    <img src={displayAvatar} alt={post.user.name} className="w-12 h-12 rounded-full mr-4 border-2 border-[#8B5CF6] object-cover" />
                    <div>
                        <p className="font-bold text-white text-lg">{post.user.name}</p>
                        <p className="text-xs text-gray-400">{formatTimestamp(post.timestamp)}</p>
                    </div>
                </div>
                <p className="text-gray-300 mb-4">{post.content}</p>
            </div>
            {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="w-full h-auto" />}

            {/* Feature 1: Interaction Bar Integration */}
            <FeedInteractionBar
                post={post}
                currentUser={currentUser}
                onAddComment={onAddComment}
            />

            {/* Basic Comments Display (Scrollable) */}
            {post.comments?.length > 0 && (
                <div className="px-4 pb-4 space-y-2 max-h-40 overflow-y-auto border-t border-gray-700/30 pt-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Recent Comments</p>
                    {post.comments.map((comment, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs">
                            <img src={comment.user.avatar} className="w-5 h-5 rounded-full object-cover mt-0.5" />
                            <div className="flex-grow">
                                <span className="font-bold text-[#8B5CF6] mr-1.5">{comment.user.name}:</span>
                                <span className="text-gray-300">{comment.text}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const HeyFamCard: React.FC<{ fam: HeyFam }> = ({ fam }) => (
    <Link to={`/community/fam/${fam.id}`} className="block bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors">
        <div className="flex items-center space-x-4">
            <img src={fam.avatar} alt={fam.name} className="w-16 h-16 rounded-full border-2 border-[rgb(59_130_246)] object-cover" />
            <div>
                <h3 className="font-bold text-lg text-white">{fam.name}</h3>
                <p className="text-sm text-gray-400">{fam.memberCount || fam.memberIds.length} members</p>
                {fam.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{fam.description}</p>}
            </div>
        </div>
    </Link>
);

const LeaderboardTab: React.FC<{ allUsers: User[], currentUser: User, t: (key: string) => string }> = ({ allUsers, currentUser, t }) => {
    const [filter, setFilter] = useState('all');
    const leaderboardData = useMemo<LeaderboardUser[]>(() => {
        let usersToRank = allUsers;
        if (filter === 'my_fams') {
            const currentUserFamIds = new Set(currentUser.heyFamIds || []);
            usersToRank = allUsers.filter(u => u.heyFamIds?.some(famId => currentUserFamIds.has(famId)));
        }
        return usersToRank
            .sort((a, b) => b.points - a.points)
            .map((user, index) => ({ ...user, rank: index + 1 }));
    }, [allUsers, currentUser, filter]);

    return (
        <div className="space-y-4">
            <div className="flex bg-gray-900 rounded-lg p-1">
                <button onClick={() => setFilter('all')} className={`flex-1 font-bold py-2 text-sm rounded-md ${filter === 'all' ? 'bg-[rgb(255_117_93)]' : ''}`}>{t('community.leaderboard.all_time')}</button>
                <button onClick={() => setFilter('my_fams')} className={`flex-1 font-bold py-2 text-sm rounded-md ${filter === 'my_fams' ? 'bg-[rgb(255_117_93)]' : ''}`}>{t('community.leaderboard.my_fams')}</button>
            </div>
            {leaderboardData.length > 0 ? (
                <div className="space-y-2">
                    {leaderboardData.map(user => {
                        const displayAvatar = user.id === currentUser.id ? currentUser.avatar : user.avatar;
                        return (
                            <div key={user.id} className={`flex items-center p-3 rounded-lg ${user.id === currentUser.id ? 'bg-[#8B5CF6] border-2 border-[rgb(255_152_43)]' : 'bg-gray-900'}`}>
                                <span className="font-bold text-lg w-8 text-center">{user.rank}</span>
                                <img src={displayAvatar} alt={user.name} className="w-10 h-10 rounded-full mx-3 object-cover" />
                                <p className="font-semibold flex-grow">{user.name}</p>
                                <p className="font-bold text-[rgb(251_191_36)]">{user.points} pts</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center bg-gray-800 p-8 rounded-lg">
                    <p className="text-gray-400">The leaderboard is currently empty.</p>
                </div>
            )}
        </div>
    );
};

const TabButton: React.FC<{ icon: React.ElementType; label: string; active: boolean; onClick: () => void; }> = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
      ${active ? 'bg-[rgb(255_117_93)] text-white scale-105 shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
    >
        <Icon size={24} />
        <span className="text-xs font-bold mt-1">{label}</span>
    </button>
);

const CommunityPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();
    const [posts, setPosts] = useState<Post[]>([]);
    const [heyFams, setHeyFams] = useState<HeyFam[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
    const [newPost, setNewPost] = useState('');
    const [newRequestText, setNewRequestText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [activeTab, setActiveTab] = useState<'feed' | 'fams' | 'prayer' | 'leaderboard'>('feed');
    const [loading, setLoading] = useState(true);
    const [showGuidedPrayer, setShowGuidedPrayer] = useState(false);
    // FIX: Added spiritSnack state to satisfy GuidedPrayerModal requirements
    const [spiritSnack, setSpiritSnack] = useState<SpiritSnack | null>(null);


    const handleAddComment = (postId: string, newComment: any) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? { ...post, comments: [...(post.comments || []), newComment] }
                    : post
            )
        );
    };


    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedPosts, fetchedFams, fetchedRequests, fetchedUsers] = await Promise.all([getPosts(), getHeyFams(), getPrayerRequests(), getAllUsers()]);
            const getTime = (timestamp: Timestamp | string | undefined): number => {
                if (!timestamp) return 0;
                if (timestamp instanceof Timestamp) return timestamp.toMillis();
                const date = new Date(timestamp);
                return isNaN(date.getTime()) ? 0 : date.getTime();
            };
            fetchedPosts.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
            fetchedRequests.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
            setPosts(fetchedPosts);
            setHeyFams(fetchedFams);
            setPrayerRequests(fetchedRequests);
            setAllUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch community data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // FIX: Initialize spiritSnack on component mount
        setSpiritSnack(getDailySpiritSnack());
        fetchData();
    }, []);

    const handlePostMessage = async () => {
        if (newPost.trim() === '' || !currentUser) return;
        const postUser: PostUser = { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar };
        const post: Omit<Post, 'id'> = {
            user: postUser,
            timestamp: new Date().toISOString(),
            content: newPost,
            amens: 0,
            comments: [],
            reactions: {},
            userReactions: {}
        };
        await addPost(post);
        setNewPost('');
        await fetchData();
    };

    const handleSubmitRequest = async () => {
        if (!newRequestText.trim() || !currentUser) return;
        const newRequest: Omit<PrayerRequest, 'id'> = {
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            requestText: newRequestText.trim(),
            isAnonymous,
            timestamp: new Date().toISOString(),
            prayerCount: 0,
            prayedBy: [],
        };
        await addPrayerRequest(newRequest);
        setNewRequestText('');
        setIsAnonymous(false);
        await fetchData();
    };

    const handlePray = async (requestId: string) => {
        if (!currentUser) return;
        setPrayerRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === requestId && !req.prayedBy.includes(currentUser.id)
                    ? { ...req, prayerCount: req.prayerCount + 1, prayedBy: [...req.prayedBy, currentUser.id] }
                    : req
            )
        );
        await incrementPrayerCount(requestId, currentUser);
    };

    if (!currentUser) return null;

    return (
        <>
            <div className="p-4 space-y-6 bg-[rgb(19_54_102)] min-h-screen text-white">
                <h1 className="text-3xl font-extrabold uppercase">{t('community.title')}</h1>

                <div className="grid grid-cols-4 gap-2 mb-6">
                    <TabButton icon={Sparkles} label={t('community.tab_feed')} active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
                    <TabButton icon={HandHelping} label={t('community.tab_prayer')} active={activeTab === 'prayer'} onClick={() => setActiveTab('prayer')} />
                    <TabButton icon={Users} label={t('community.tab_fams')} active={activeTab === 'fams'} onClick={() => setActiveTab('fams')} />
                    <TabButton icon={Trophy} label={t('community.tab_leaderboard')} active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
                </div>

                {activeTab === 'feed' && (
                    <div className="space-y-4 pb-20">
                        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
                            <textarea
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-[rgb(255_117_93)] focus:border-[rgb(255_117_93)]"
                                placeholder={t('community.post_placeholder', { name: currentUser.name })}
                                rows={3}
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                            />
                            <button
                                onClick={handlePostMessage}
                                className="mt-3 w-full bg-[rgb(255_117_93)] text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 flex items-center justify-center transition"
                            >
                                <Send size={18} className="mr-2" /> {t('community.post_button')}
                            </button>
                        </div>
                        {loading ? <div className="text-center p-8 flex flex-col items-center justify-center text-gray-400"><Loader2 className="animate-spin h-8 w-8 mb-2" /><p>{t('community.loading_feed')}</p></div> : posts.length > 0 ? (
                            <div className="space-y-4">
                                {posts.map(post => (
                                    // <PostCard key={post.id} post={post} currentUser={currentUser} />
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        currentUser={currentUser}
                                        onAddComment={handleAddComment}
                                    />

                                ))}
                            </div>
                        ) : (
                            <div className="text-center bg-gray-800 p-8 rounded-lg">
                                <p className="text-gray-400">The feed is quiet right now.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'prayer' && (
                    <div className="space-y-6 pb-20">
                        <button
                            onClick={() => setShowGuidedPrayer(true)}
                            className="w-full bg-gradient-to-r from-blue-900 to-[rgb(59_130_246)] rounded-xl p-6 shadow-lg flex items-center justify-between group hover:scale-[1.01] transition-transform"
                        >
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-white mb-1 flex items-center"><PlayCircle className="mr-2" /> Guided Prayer</h3>
                                <p className="text-blue-100 text-sm">Take a minute to breathe and connect with God.</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-full"><Sparkles className="text-white" /></div>
                        </button>
                        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="font-bold text-lg mb-2 flex items-center"><HandHelping className="mr-2 text-[rgb(255_152_43)]" /> {t('community.prayer.title')}</h2>
                            <textarea
                                className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-[rgb(255_117_93)] focus:border-[rgb(255_117_93)]"
                                placeholder={t('community.prayer.placeholder')}
                                value={newRequestText}
                                onChange={(e) => setNewRequestText(e.target.value)}
                            />
                            <div className="flex justify-between items-center mt-3">
                                <label className="flex items-center text-sm text-gray-400 select-none">
                                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="mr-2 h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(255_117_93)] focus:ring-[rgb(255_117_93)]" />
                                    {t('community.prayer.anonymous')}
                                </label>
                                <button onClick={handleSubmitRequest} disabled={!newRequestText.trim()} className="bg-[rgb(255_117_93)] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition disabled:bg-gray-600">
                                    <Send size={16} className="mr-2" /> {t('community.prayer.submit')}
                                </button>
                            </div>
                        </div>
                        {loading ? <div className="text-center p-8 flex flex-col items-center justify-center text-gray-400"><Loader2 className="animate-spin h-8 w-8 mb-2" /><p>{t('community.prayer.loading')}</p></div> : prayerRequests.length > 0 ? (
                            <div className="space-y-4">
                                {prayerRequests.map(req => (
                                    <PrayerRequestCard key={req.id} request={req} currentUserId={currentUser!.id} currentUserAvatar={currentUser.avatar} onPray={handlePray} t={t} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center bg-gray-800 p-8 rounded-lg">
                                <p className="text-gray-400">{t('community.prayer.empty_title')}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'fams' && (
                    <div className="space-y-4 pb-20">
                        <h2 className="text-2xl font-extrabold uppercase">{t('community.fams.title')}</h2>
                        {loading ? <div className="text-center p-8 flex flex-col items-center justify-center text-gray-400"><Loader2 className="animate-spin h-8 w-8 mb-2" /><p>{t('community.fams.loading')}</p></div> : heyFams.length > 0 ? (
                            heyFams.map(fam => <HeyFamCard key={fam.id} fam={fam} />)
                        ) : (
                            <div className="text-center bg-gray-800 p-8 rounded-lg">
                                <p className="text-gray-400">{t('community.fams.empty')}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-4 pb-20">
                        <h2 className="text-2xl font-extrabold uppercase mb-3">{t('community.leaderboard.title')}</h2>
                        {loading ? <div className="text-center p-8 flex flex-col items-center justify-center text-gray-400"><Loader2 className="animate-spin h-8 w-8 mb-2" /><p>{t('community.leaderboard.loading')}</p></div> : <LeaderboardTab allUsers={allUsers} currentUser={currentUser} t={t} />}
                    </div>
                )}
            </div>
            {/* FIX: Passed required snack prop to GuidedPrayerModal */}
            {showGuidedPrayer && spiritSnack && <GuidedPrayerModal snack={spiritSnack} onClose={() => setShowGuidedPrayer(false)} />}
        </>
    );
};

export default CommunityPage;
