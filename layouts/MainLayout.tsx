import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import NotificationsPanel from '../components/NotificationsPanel';

const MainLayout: React.FC = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const onToggleNotifications = () => setIsNotificationsOpen(prev => !prev);

  return (
    <div className="min-h-screen text-gray-200 flex flex-col">
      <Header onToggleNotifications={onToggleNotifications} />
      <main className="flex-grow pb-20 pt-[calc(64px+env(safe-area-inset-top))]">
        <Outlet context={{ onToggleNotifications }} />
      </main>
      <BottomNav />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
};

export default MainLayout;