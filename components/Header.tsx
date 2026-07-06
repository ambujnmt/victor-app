import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
    onToggleNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleNotifications }) => {
    const location = useLocation();
    const { unreadCount } = useAuth();
    const { t } = useLanguage();

    const getTitle = () => {
        const path = location.pathname.split('/')[1];
        if (!path || path === 'home') return t('header.dashboard');
        
        // Convert 'my-plan' to 'nav.my_plan' to match translation keys
        const formattedPath = path.replace(/-/g, '_').toLowerCase();
        const translationKey = `nav.${formattedPath}`;
        
        const translatedTitle = t(translationKey);
        
        // Return translation if found, otherwise humanize the path (e.g., "my-plan" -> "My Plan")
        if (translatedTitle !== translationKey) {
            return translatedTitle;
        }
        
        return path
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 shadow-lg z-40 pt-[env(safe-area-inset-top)]">
            <div className="flex justify-between items-center max-w-lg mx-auto p-4 h-16">
                <h1 className="text-xl font-bold text-white">{getTitle()}</h1>
                <button onClick={onToggleNotifications} className="relative text-gray-300 hover:text-white">
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(255_117_93)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-[rgb(255_117_93)] text-xs items-center justify-center">{unreadCount}</span>
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;