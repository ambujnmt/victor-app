import React, { useState, useEffect, useMemo } from 'react';
import { Link,useLocation  } from 'react-router-dom';
import { Course, Session } from '../types';
import { PlayCircle, Lock, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft, Loader2, BookOpen, Play, UserPlus, Hash, Filter, Search, X } from 'lucide-react';
import { useAuth } from '../App';
import { getCourses , saveCourseReaction, getCourseLikesCount, checkUserLikedCourse, removeCourseReaction, addCourseComment, getCourseCommentsCount, getCourseComments } from '../services/firebaseService';

import { useLanguage } from '../contexts/LanguageContext';
import { InteractionBar } from '../components/InteractionBar';
import { PATHS } from '../constants/academyPaths';
import InviteFriendModal from '../components/InviteFriendModal';

const HeyShotCard: React.FC<{ session: Session; autoPlay?: boolean }> = ({ session, autoPlay = false }) => {
    const { user } = useAuth();
    const [showInteractions, setShowInteractions] = useState(false);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [userLiked, setUserLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);   
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentsCount, setCommentsCount] = useState(0);
    const [comments, setComments] = useState<any[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);

    useEffect(() => {
        if (isPlaying) {
            const timer = setTimeout(() => {
                setShowInteractions(true);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [isPlaying]);

    useEffect(() => {
        const loadLikes = async () => {
            const count = await getCourseLikesCount(session.id);
            setLikesCount(count);

            const comments = await getCourseCommentsCount(session.id);
            setCommentsCount(comments);

            const commentsList = await getCourseComments(session.id);
            setComments(commentsList);

            if (user) {
                const liked = await checkUserLikedCourse(session.id, user.id);
                setIsLiked(liked);
            }
        };

        loadLikes();
    }, [session.id, user]);

    const handleLike = async () => {
        if (!user) {
            alert("Login first");
            return;
        }

        if (!isLiked) {
            await saveCourseReaction(session.id, user.id);
            setLikesCount(prev => prev + 1);
            setIsLiked(true);
        } else {
            await removeCourseReaction(session.id, user.id);
            setLikesCount(prev => prev - 1);
            setIsLiked(false);
        }
    };

    const handleAddComment = async () => {
        if (!user) {
            alert("Login first");
            return;
        }
        if (!commentText.trim()) return;
        try {
            setIsSending(true);
            await addCourseComment(
                session.id,
                user.id,
                user.name || "User",
                commentText
            );
            setCommentsCount(prev => prev + 1);
            const commentsList = await getCourseComments(session.id);
            setComments(commentsList);
            setCommentText("");
            setShowCommentBox(false);
        } catch (error) {
            console.error("Comment error:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleShare = async () => {
        const shareUrl = `https://youtube.com/watch?v=${session.videoId}`;

        const shareData = {
            title: session.title,
            text: session.title,
            url: shareUrl
        };

        if (navigator.share) {
            try {
            await navigator.share(shareData);
            } catch (err) {
            console.log("Share cancelled", err);
            }
        } else {
            try {
            await navigator.clipboard.writeText(shareUrl);
            alert("Link copied! Now you can paste it anywhere.");
            } catch {
            window.open(shareUrl, "_blank");
            }
        }
    };

    return (
           <div className="relative w-[85vw] md:w-[360px] h-[75vh] mt-[env(safe-area-inset-top)] mb-[env(safe-area-inset-bottom)] flex-shrink-0 bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 snap-center mx-2 flex flex-col justify-center">
            <div className="absolute inset-0 bg-gray-900">
                {!isPlaying ? (
                    <div className="relative w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
                        <img 
                            src={session.thumbnail || `https://img.youtube.com/vi/${session.videoId}/hqdefault.jpg`} 
                            alt={session.title} 
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                                <Play size={48} className="text-white fill-white ml-2"/>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full overflow-hidden pointer-events-none">
                        {!videoLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                                <img
                                    src={session.thumbnail || `https://img.youtube.com/vi/${session.videoId}/hqdefault.jpg`}
                                    alt={session.title}
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
                                />
                                <Loader2 className="relative animate-spin text-white" size={36} />
                            </div>
                        )}
                        <iframe
                            onLoad={() => setVideoLoaded(true)}
                            src={`https://www.youtube.com/embed/${session.videoId}?autoplay=1&modestbranding=1&rel=0&controls=0&playsinline=1&loop=1&playlist=${session.videoId}`}
                            title={session.title}
                            className={`absolute top-1/2 left-1/2 w-[300%] h-full -translate-x-1/2 -translate-y-1/2 pointer-events-auto object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none"></div>

            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start z-10 pointer-events-auto">
                <div className="mb-4 w-full">
                    <div className="flex flex-wrap gap-1 mb-2">
                        <span className="bg-[rgb(255_117_93)] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-md">
                            Hey Shot
                        </span>
                        {session.tags?.filter(tag => tag.trim() !== '').map((tag, i) => (
                            <span key={i} className="bg-black/40 backdrop-blur-md text-white/80 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-white/10">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase leading-tight drop-shadow-lg max-w-[95%] line-clamp-2">
                        {session.title}
                    </h2>
                </div>
                
                <div 
                    className={`w-full mt-2 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) transform bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/10 shadow-lg${
                        showInteractions ? 'translate-x-0 opacity-100' : 'translate-x-[20%] opacity-0'
                    }`}
                >
                    <InteractionBar 
                        initialLikes={likesCount}
                        initialComments={commentsCount}
                        initialShares={0}
                        iconSize={20}
                        isLiked={isLiked}
                        onLike={handleLike}
                        onComment={() => setShowCommentBox(true)}
                        onShare={handleShare}
                    />
                </div>
            </div>
            {showCommentBox && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-end z-30">
                    <div className="w-full bg-gray-900 p-4 rounded-t-2xl border-t border-gray-700">
                        <div className="max-h-40 overflow-y-auto mb-3 space-y-2">
                            {comments.length === 0 ? (
                                <p className="text-gray-400 text-sm">No comments yet</p>
                            ) : (
                                comments.map((c) => (
                                    <div key={c.id} className="bg-gray-800 p-2 rounded-lg">
                                        <p className="text-xs text-orange-400 font-semibold">
                                            {c.username}
                                        </p>
                                        <p className="text-sm text-white">
                                            {c.comment}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white font-bold text-sm">Add Comment</h3>
                            <button
                                onClick={() => setShowCommentBox(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write your comment..."
                            className="w-full bg-gray-800 text-white text-sm p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgb(255_152_43)]"
                            rows={3}
                        />

                        <button
                            onClick={handleAddComment}
                            disabled={isSending}
                            className="mt-3 w-full bg-[rgb(255_117_93)] hover:bg-[rgb(255_117_93/0.8)] text-white font-bold py-2 rounded-lg transition disabled:opacity-60"
                        >
                            {isSending ? "Sending..." : "Post Comment"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CourseCard: React.FC<{ course: Course; isLocked: boolean; onInvite: (c: Course) => void }> = ({ course, isLocked, onInvite }) => {
    const [expanded, setExpanded] = useState(false);
    const { user } = useAuth();

    const completedCount = course.sessions.filter(s => user?.sessionProgress?.[s.id] === 'completed').length;
    const progress = course.sessions.length > 0 ? (completedCount / course.sessions.length) * 100 : 0;

    return (
        <div className={`bg-gray-800 rounded-xl overflow-hidden mb-4 transition-all border border-gray-700 shadow-md ${isLocked ? 'opacity-75' : ''}`}>
            <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-750"
                onClick={() => !isLocked && setExpanded(!expanded)}
            >
                <div className="flex items-center">
                    <img src={course.thumbnail} alt={course.title} className="w-14 h-14 rounded-lg object-cover mr-4 shadow-sm"/>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{course.title}</h3>
                         {course.description && !course.description.startsWith('course.') && (
                                <p className="text-gray-400 text-sm leading-relaxed mt-1 max-w-[95%]">
                                    {course.description}
                                </p>
                         )}
                        <p className="text-xs text-gray-400 mt-1">{course.sessions.length} Sessions</p>
                    </div>
                </div>
                
                {isLocked ? (
                    <Lock size={20} className="text-gray-500"/>
                ) : (
                    <div className="flex items-center space-x-3">
                        {(user?.role === 'leader' || user?.role === 'admin') && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onInvite(course); }}
                                className="p-2 bg-[rgb(59_130_246/0.1)] text-[rgb(59_130_246)] rounded-lg hover:bg-[rgb(59_130_246/0.2)] transition-colors"
                                title="Invite to Course"
                            >
                                <UserPlus size={18} />
                            </button>
                        )}
                        
                        <div className="mr-2 text-right hidden sm:block">
                            <div className="w-20 bg-gray-700 h-1.5 rounded-full mt-1">
                                <div className="bg-[rgb(16_185_129)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}/>
                    </div>
                )}
            </div>

            {expanded && !isLocked && (
                <div className="bg-gray-900/50 p-2 space-y-1 border-t border-gray-700/50">
                    {course.sessions
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((session, idx) => {
                        const isCompleted = user?.sessionProgress?.[session.id] === 'completed';
                        return (
                            <Link 
                                to={`/academy/${course.id}/session/${session.id}`}
                                state={{ from: 'course' }}
                                onClick={() => {
                                    sessionStorage.setItem('lastCourse', course.id);
                                    sessionStorage.setItem('lastPath', course.pathId);
                                }}
                                className="flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                            >
                                <div className="mr-3 text-gray-500 font-mono text-xs w-6 flex-shrink-0">{session.order || idx + 1}</div>
                                <div className="flex-grow min-w-0">
                                    <p className={`text-sm font-medium truncate ${isCompleted ? 'text-gray-400 line-through decoration-gray-600' : 'text-white'}`}>{session.title}</p>
                                </div>
                                {isCompleted ? <CheckCircle size={18} className="text-[rgb(16_185_129)] flex-shrink-0 ml-2"/> : <PlayCircle size={18} className="text-gray-600 group-hover:text-white flex-shrink-0 ml-2"/>}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const PathCard: React.FC<{ path: any; onClick: () => void; progress: number }> = ({ path, onClick, progress }) => {
    const { t } = useLanguage();
    const Icon = path.icon;

    return (
        <button 
            onClick={onClick}
            className="w-full text-left relative overflow-hidden rounded-2xl shadow-xl mb-6 group transition-all hover:scale-[1.02] active:scale-95"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${path.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
            <div className="absolute -right-6 -bottom-6 opacity-10">
                <Icon size={140} className="text-white transform rotate-12" />
            </div>

            <div className="relative p-6 z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                        <Icon size={32} className="text-white" />
                    </div>
                    {progress > 0 && (
                        <div className="bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-[rgb(16_185_129)] mr-2 animate-pulse"></div>
                            <p className="text-xs font-bold text-white">{Math.round(progress)}%</p>
                        </div>
                    )}
                </div>

                <h2 className="text-3xl font-extrabold text-white uppercase tracking-tight mb-2 drop-shadow-md">{t(path.title)}</h2>
                {path.desc && !path.desc.startsWith('path.') && (
                  <p className="text-white/90 text-sm font-medium max-w-[85%] leading-relaxed">{path.desc}</p>
                )}

                <div className="mt-6 w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-white h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </button>
    );
};

const AcademyPage: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const location = useLocation();
    const [activePathId, setActivePathId] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteModalCourse, setInviteModalCourse] = useState<Course | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeShotSession, setActiveShotSession] = useState<Session | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const allCourses = await getCourses();
            setCourses(allCourses);
            setLoading(false);
        };
        fetchCourses();
    }, []);

    useEffect(() => {
    if (location.state?.restorePath) {
        setActivePathId(location.state.restorePath);
    }
}, [location.state]);

    const pathProgress = useMemo(() => {
        const progressMap: {[key: string]: number} = {};
        PATHS.forEach(path => {
            const pathCourses = courses.filter(c => c.pathId === path.id);
            if (pathCourses.length === 0) {
                progressMap[path.id] = 0;
                return;
            }
            let totalSessions = 0;
            let completedSessions = 0;
            pathCourses.forEach(course => {
                totalSessions += course.sessions.length;
                completedSessions += course.sessions.filter(s => user?.sessionProgress?.[s.id] === 'completed').length;
            });
            progressMap[path.id] = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
        });
        return progressMap;
    }, [courses, user]);

    const heyShotSessions = useMemo(() => {
        const shotCourse = courses.find(c => c.pathId === 'hey_shots');
        return shotCourse
            ? [...shotCourse.sessions].sort((a, b) => (a.order || 0) - (b.order || 0))
            : [];
    }, [courses]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        heyShotSessions.forEach(s => {
            s.tags?.forEach(tag => {
                if (tag.trim() !== '') tags.add(tag);
            });
        });
        return Array.from(tags).sort();
    }, [heyShotSessions]);

    const filteredHeyShots = useMemo(() => {
        return heyShotSessions.filter(s => {
            const matchesTag = !selectedTag || s.tags?.includes(selectedTag);
            const matchesQuery = !searchQuery.trim() || 
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesTag && matchesQuery;
        });
    }, [heyShotSessions, selectedTag, searchQuery]);

    const activePath = PATHS.find(p => p.id === activePathId);
    const mainPaths = PATHS.filter(p => p.id !== 'hey_shots');

    const activeShotIndex = activeShotSession ? filteredHeyShots.findIndex(s => s.id === activeShotSession.id) : -1;
    const goToShot = (delta: number) => {
        if (activeShotIndex === -1) return;
        const nextIndex = activeShotIndex + delta;
        if (nextIndex < 0 || nextIndex >= filteredHeyShots.length) return;
        setActiveShotSession(filteredHeyShots[nextIndex]);
    };

    const filteredCourses = courses
        .filter(c => c.pathId === activePathId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

    if (loading) return <div className="min-h-screen bg-[rgb(19,54,102)] flex items-center justify-center"><Loader2 className="animate-spin text-white h-10 w-10"/></div>;

    if (activePathId === 'hey_shots') {
        const allShots = filteredCourses
        .flatMap(c => c.sessions)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
        return (
            <div className="bg-black fixed inset-0 z-50 flex flex-col">
                <div className="pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 px-4 flex items-center bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-20">
                    <button onClick={() => setActivePathId(null)} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="ml-4">
                        <h1 className="text-xl font-extrabold uppercase tracking-widest text-[rgb(255_117_93)] drop-shadow-md leading-none">Hey Shots</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Swipe for more</p>
                    </div>
                </div>
                <div className="flex-grow flex items-center overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 py-20 gap-4">
                    {allShots.map(session => <HeyShotCard key={session.id} session={session} />)}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </div>
        );
    }

    if (activePathId && activePath) {
        return (
            <div className="bg-[rgb(19,54,102)] min-h-screen text-white p-4 pb-24">
                <button onClick={() => setActivePathId(null)} className="flex items-center text-[rgb(255_152_43)] mb-6 font-bold hover:text-white transition-colors">
                    <ArrowLeft size={20} className="mr-2"/> Back to Paths
                </button>
                <div className={`p-6 rounded-2xl bg-gradient-to-br ${activePath.color} mb-8 shadow-xl relative overflow-hidden`}>
                    <activePath.icon size={100} className="absolute -right-4 -bottom-4 text-white opacity-10 transform rotate-12"/>
                    <h1 className="text-3xl font-extrabold text-white uppercase tracking-tight relative z-10">{t(activePath.title)}</h1>
                    <p className="text-white/90 text-sm mt-2 font-medium relative z-10">{t(activePath.desc)}</p>
                </div>
                <div className="space-y-4">
                    {filteredCourses.map(course => (
                        <CourseCard 
                            key={course.id} 
                            course={course} 
                            isLocked={!course.isPublished} 
                            onInvite={(c) => setInviteModalCourse(c)}
                        />
                    ))}
                    {filteredCourses.length === 0 && <div className="text-center py-16 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700/50"><BookOpen size={48} className="mx-auto mb-4 opacity-30"/><p>Coming Soon</p></div>}
                </div>
                {inviteModalCourse && user && (
                    <InviteFriendModal
                        target={{
                            id: inviteModalCourse.id,
                            title: inviteModalCourse.title,
                            type: 'course',
                            data: inviteModalCourse
                        }}
                        user={user}
                        onClose={() => inviteModalCourse && setInviteModalCourse(null)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="bg-[rgb(19,54,102)] min-h-screen text-white p-4 pb-24">
            <h1 className="text-3xl font-extrabold uppercase mb-2">Academy</h1>
            <p className="text-gray-400 text-sm mb-8">Choose a path to begin your journey.</p>
            <div className="space-y-4">
                <div className="space-y-4">
                    {mainPaths.map(path => <PathCard key={path.id} path={path} onClick={() => {
                        setActivePathId(path.id);
                        sessionStorage.setItem('lastPath', path.id);
                    }} progress={pathProgress[path.id] || 0} />)}
                </div>
                {heyShotSessions.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-extrabold text-white flex items-center">
                                <span className="bg-[rgb(255_117_93)] w-2 h-6 mr-3 rounded-full"></span>
                                LATEST HEY SHOTS
                            </h2>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-4 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-500 group-focus-within:text-[rgb(255_152_43)] transition-colors" />
                            </div>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search topic (e.g. Sex, Yoga, Angst)..."
                                className="w-full bg-gray-800/80 border border-gray-700 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[rgb(255_152_43/0.5)] focus:bg-gray-800 transition-all shadow-xl"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Tag Filter Bar */}
                        <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            <button 
                                onClick={() => setSelectedTag(null)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border transition-all ${!selectedTag ? 'bg-[rgb(255_117_93)] border-[rgb(255_117_93)] text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-white'}`}
                            >
                                All
                            </button>
                            {allTags.map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border transition-all ${selectedTag === tag ? 'bg-[rgb(59_130_246)] border-[rgb(59_130_246)] text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-white'}`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>

                        {/* Filtered Reel */}
                        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide snap-x">
                            {filteredHeyShots.length > 0 ? (
                                filteredHeyShots.map((session) => (
                                    <div key={session.id} onClick={() => setActiveShotSession(session)} className="flex-shrink-0 w-32 h-56 rounded-xl overflow-hidden relative shadow-lg cursor-pointer group snap-start bg-gray-900 border border-white/10 transition-transform hover:scale-105">
                                        <img src={session.thumbnail || `https://img.youtube.com/vi/${session.videoId}/hqdefault.jpg`} alt={session.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(255_117_93)]/80 via-[rgb(255_117_93/0.2)] to-transparent"></div>
                                        <Play size={80} className="absolute -right-4 -bottom-4 text-white opacity-10 transform rotate-12" />
                                        <div className="absolute inset-0 p-3 flex flex-col justify-between z-10">
                                            <div className="self-start p-2 bg-white/20 backdrop-blur-md rounded-full shadow-sm border border-white/20"><Play size={14} className="text-white fill-white" /></div>
                                            <div>
                                                <p className="text-white text-xs font-extrabold uppercase leading-tight drop-shadow-md line-clamp-2">
                                                    {session.title}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full py-10 text-center bg-gray-800/40 rounded-[2rem] border border-dashed border-gray-700 flex flex-col items-center justify-center min-w-[280px]">
                                    <Filter size={32} className="text-gray-600 mb-2 opacity-50" />
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No matches found</p>
                                    <button onClick={() => {setSearchQuery(''); setSelectedTag(null);}} className="mt-2 text-[rgb(255_152_43)] font-black text-[10px] uppercase tracking-widest hover:underline">Clear all filters</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {activeShotSession && (
                <div className="bg-black fixed inset-0 z-50 flex flex-col">
                    <div className="pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 px-4 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-20">
                        <div className="flex items-center">
                            <button onClick={() => setActiveShotSession(null)} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <div className="ml-4">
                                <h1 className="text-xl font-extrabold uppercase tracking-widest text-[rgb(255_117_93)] drop-shadow-md leading-none">Hey Shots</h1>
                            </div>
                        </div>
                        {activeShotIndex !== -1 && filteredHeyShots.length > 1 && (
                            <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-black border border-white/10">
                                {activeShotIndex + 1} / {filteredHeyShots.length}
                            </span>
                        )}
                    </div>
                    <div className="flex-grow flex items-center justify-center px-4 py-20 relative">
                        <HeyShotCard key={activeShotSession.id} session={activeShotSession} autoPlay />

                        {activeShotIndex > 0 && (
                            <button
                                onClick={() => goToShot(-1)}
                                className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
                                aria-label="Previous short"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        {activeShotIndex !== -1 && activeShotIndex < filteredHeyShots.length - 1 && (
                            <button
                                onClick={() => goToShot(1)}
                                className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
                                aria-label="Next short"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>

                    {activeShotIndex !== -1 && activeShotIndex < filteredHeyShots.length - 1 && (
                        <button
                            onClick={() => goToShot(1)}
                            className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/70 animate-bounce z-20"
                            aria-label="Next short"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest mb-1">Tap for next</span>
                            <ChevronDown size={22} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AcademyPage;