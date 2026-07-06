
import React, { useState } from 'react';
import { MessageCircle, Send, SmilePlus } from 'lucide-react';
import { Post, User, Comment } from '../types';
import { addCommentToPost, updatePostReaction } from '../services/firebaseService';

interface FeedInteractionBarProps {
  post: Post;
  currentUser: User;
  onAddComment: (postId: string, comment: Comment) => void;
}


const REACTIONS = ['🙌', '🙏', '❤️', '🔥', '💪', '✨'];

export const FeedInteractionBar: React.FC<FeedInteractionBarProps> = ({ post, currentUser,onAddComment }) => {
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    
    // Local state for optimistic updates
    const [localReactions, setLocalReactions] = useState<{ [key: string]: number }>(post.reactions || {});
    const [userReacted, setUserReacted] = useState<{ [key: string]: boolean }>(post.userReactions?.[currentUser.id] || {});

    const handleReaction = async (emoji: string) => {
        const alreadyReacted = userReacted[emoji];
        const change = alreadyReacted ? -1 : 1;

        // 1. Local Optimistic Update
        setLocalReactions(prev => ({
            ...prev,
            [emoji]: Math.max(0, (prev[emoji] || 0) + change)
        }));
        setUserReacted(prev => ({ ...prev, [emoji]: !alreadyReacted }));
        setIsEmojiPickerOpen(false);

        // 2. Database Sync
        try {
            await updatePostReaction(post.id, emoji, change);
        } catch (err) {
            console.error("Failed to sync reaction", err);
            // Rollback on failure
            setLocalReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) - change }));
            setUserReacted(prev => ({ ...prev, [emoji]: alreadyReacted }));
        }
    };

//     const handleSendComment = async () => {
//         if (!commentText.trim()) return;

// const newComment: Comment = {
//     user: {
//         id: currentUser.id,
//         name: currentUser.name,
//         avatar: currentUser.avatar
//     },
//     text: commentText.trim(),
//     timestamp: new Date().toISOString()
// };



//         const tempCommentText = commentText;
//         setCommentText('');

//         try {
//             await addCommentToPost(post.id, newComment);
//             // Parent usually handles the feed refresh or uses onSnapshot for real-time updates
//         } catch (err) {
//             // console.error("Failed to add comment", err);
//             setCommentText(tempCommentText);
//             // alert("Failed to post comment.");
//         }
//     };

    const handleSendComment = async () => {
  if (!commentText.trim()) return;

//   const newComment = {
//     text: commentText,
//     timestamp: new Date().toISOString(),
//     user: {
//       id: currentUser.id,
//       name: currentUser.name,
//       avatar: currentUser.avatar,
//     },
//   };

const newComment = {
  text: commentText.trim(),
  timestamp: new Date().toISOString(),
  user: {
    id: currentUser.id,
    name: currentUser.name,
    avatar: currentUser.avatar
  }
};

  // 🔥 Save to Firestore
  await addCommentToPost(post.id, newComment);

  // ✅ Update UI instantly
  onAddComment(post.id, newComment);

  setCommentText('');
};


    return (
        <div className="w-full">
            {/* Interaction Buttons Bar */}
            <div className="flex items-center space-x-6 p-4 border-t border-gray-700/50">
                <div className="relative">
                    <button 
                        onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all group"
                    >
                        <SmilePlus size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">Amen</span>
                    </button>

                    {/* Emoji Picker Popover */}
                    {isEmojiPickerOpen && (
                        <div className="absolute bottom-full left-0 mb-3 bg-gray-900 border border-gray-700 rounded-full p-2 flex space-x-1.5 shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-2 z-50">
                            {REACTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className={`p-2 hover:bg-white/10 rounded-full transition-all text-xl ${userReacted[emoji] ? 'bg-[rgb(255_117_93/0.2)] scale-110' : ''}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => {
                        setIsCommentOpen(!isCommentOpen);
                        setIsEmojiPickerOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all group"
                >
                    <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold">Comment</span>
                </button>
            </div>

            {/* Reaction Summary Pills */}
            {Object.entries(localReactions).some(([_, count]) => (count as number) > 0) && (
                <div className="flex flex-wrap gap-2 px-4 pb-4">
                    {Object.entries(localReactions).map(([emoji, count]) => (count as number) > 0 ? (
                        <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                                userReacted[emoji] 
                                ? 'bg-[rgb(255_117_93/0.2)] border-[rgb(255_117_93)] text-white' 
                                : 'bg-gray-800 border-gray-700 text-gray-400'
                            }`}
                        >
                            <span>{emoji}</span>
                            <span>{count as number}</span>
                        </button>
                    ) : null)}
                </div>
            )}

            {/* Inline Comment Input */}
            {isCommentOpen && (
                <div className="p-4 bg-black/20 border-t border-gray-800 animate-in slide-in-from-top-2">
                    <div className="flex items-center space-x-3">
                        <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover border border-gray-700" alt="Me" />
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                            placeholder="Add a comment..."
                            className="flex-grow bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[rgb(255_117_93)]"
                            autoFocus
                        />
                        <button 
                            onClick={handleSendComment}
                            disabled={!commentText.trim()}
                            className="p-2 text-[rgb(255_117_93)] disabled:opacity-30 disabled:text-gray-500 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
