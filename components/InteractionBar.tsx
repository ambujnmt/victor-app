import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';

interface InteractionBarProps {
    initialLikes?: number;
    initialComments?: number;
    initialShares?: number;
    isLiked?: boolean;
    onLike?: (liked: boolean) => void;
    onShare?: () => void;
    onComment?: () => void;
    className?: string;
    iconSize?: number;
}

export const InteractionBar: React.FC<InteractionBarProps> = ({ 
    initialLikes = 0, 
    initialComments = 0, 
    initialShares = 0,
    isLiked = false,
    onLike,
    onShare,
    onComment,
    className = "",
    iconSize = 16 
}) => {

    const [liked, setLiked] = useState(isLiked);
    const [likes, setLikes] = useState(initialLikes);
    const [comments, setComments] = useState(initialComments);

    useEffect(() => {
        setLikes(initialLikes);
    }, [initialLikes]);

    useEffect(() => {
        setLiked(isLiked);
    }, [isLiked]);

    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const formatCount = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();

        const newLikedState = !liked;
        setLiked(newLikedState);
        setLikes(prev => newLikedState ? prev + 1 : prev - 1);

        if (onLike) {
            onLike(newLikedState);
        }
    };
    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onComment) onComment();
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (onShare) onShare();
    };

    return (
        <div className={`flex items-center justify-center gap-12 w-full ${className}`}>
            
            {/* Like */}
            <button 
                onClick={handleLike} 
                className="flex flex-col items-center group transition-transform active:scale-95 p-2 rounded-full hover:bg-white/5"
            >
                <div className={`transition-all ${liked ? 'text-[rgb(255_117_93)] scale-110' : 'text-white group-hover:text-gray-200'}`}>
                    <Heart size={iconSize} fill={liked ? "currentColor" : "none"} strokeWidth={1.5} />
                </div>
                <span className="text-white font-medium text-[9px] mt-0.5">
                    {formatCount(likes)}
                </span>
            </button>

            {/* Comment */}
            <button 
                onClick={handleCommentClick}
                className="flex flex-col items-center group transition-transform active:scale-95 p-2 rounded-full hover:bg-white/5"
            >
                <MessageCircle size={iconSize} strokeWidth={1.5} />
                <span className="text-white font-medium text-[9px] mt-0.5">
                    {formatCount(comments)}
                </span>
            </button>

            {/* Share */}
            <button 
                onClick={handleShareClick} 
                className="flex flex-col items-center group transition-transform active:scale-95 p-2 rounded-full hover:bg-white/5"
            >
                <Share size={iconSize} strokeWidth={1.5} />
                <span className="text-white font-medium text-[9px] mt-0.5">
                    {formatCount(initialShares)}
                </span>
            </button>
        </div>
    );
};