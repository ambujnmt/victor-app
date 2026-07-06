import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Award, Users, ClipboardList } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const BottomNav: React.FC = () => {
  const { t } = useLanguage();

  const navItems = [
    { path: '/home', icon: Home, label: t('nav.home') },
    { path: '/academy', icon: BookOpen, label: t('nav.academy') },
    { path: '/challenges', icon: Award, label: t('nav.challenges') },
    { path: '/community', icon: Users, label: t('nav.community') },
    { path: '/my-plan', icon: ClipboardList, label: t('nav.my_plan') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg z-20">
      <div className="flex justify-around max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 transition-colors hover:text-[rgb(255_152_43)] ${
                isActive ? 'text-[rgb(255_152_43)]' : 'text-gray-400'
              }`
            }
          >
            <Icon size={24} />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;