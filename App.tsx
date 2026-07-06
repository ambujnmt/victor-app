
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AcademyPage from './pages/AcademyPage';
import ChallengesPage from './pages/ChallengesPage';
import CommunityPage from './pages/CommunityPage';
import MyPlanPage from './pages/MyPlanPage';
import SettingsPage from './pages/SettingsPage';
import SessionDetailsPage from './pages/SessionDetailsPage';
import AdminPage from './pages/AdminPage';
import MainLayout from './layouts/MainLayout';
import WelcomePage from './pages/WelcomePage';
import OnboardingPage from './pages/OnboardingPage';
import { User, AppNotification } from './types';
import LearningGroupPage from './pages/LearningGroupPage';
import WorkoutOnboardingPage from './pages/WorkoutOnboardingPage';
import WorkoutPlanPage from './pages/WorkoutPlanPage';
import { getFirebaseServices } from './firebase/firebaseConfig';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import LeaderDashboardPage from './pages/LeaderDashboardPage';
import GivingPage from './pages/GivingPage';
import { LanguageProvider } from './contexts/LanguageContext';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import { getUserNotifications, updateUserData } from './services/firebaseService';
import DataSyncPage from './pages/DataSyncPage';
import ChallengeDetailsPage from './pages/ChallengeDetailsPage';
import HeyFamPage from './pages/HeyFamPage';
import JournalPage from './pages/JournalPage';
import AssessmentPage from './pages/AssessmentPage';
import ScrollToTop from './components/ScrollToTop';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  notifications: AppNotification[];
  unreadCount: number;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const initialLandingDone = useRef(false);
  
  useEffect(() => {
  if (!loading && user && user.onboarded && !initialLandingDone.current) {
    const hash = window.location.hash;
      if (!hash || hash === '#/' || hash === '') {
        navigate('/home', { replace: true });
      }

      initialLandingDone.current = true;
    }
  }, [loading, user, navigate]);

  if (loading) {
     return (
      <div className="bg-[rgb(19,54,102)] min-h-screen flex flex-col items-center justify-center text-white">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold">Loading Your Profile...</p>
        <p className="mt-1 text-sm text-gray-400">This can take a moment...</p>
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </>
      ) : !user.onboarded ? (
        <>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </>
      ) : (
        <>
          <Route path="/workout-onboarding" element={<WorkoutOnboardingPage />} />
          <Route path="/workout-plan" element={<WorkoutPlanPage />} />
          <Route path="/leader-dashboard" element={<LeaderDashboardPage />} />
          <Route path="/giving" element={<GivingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          
          {user.role === 'admin' && (
            <>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/sync" element={<DataSyncPage />} />
            </>
          )}
          
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/academy" element={<AcademyPage />} />
            <Route path="/academy/group/:groupId" element={<LearningGroupPage />} />
            <Route path="/academy/:courseId/session/:sessionId" element={<SessionDetailsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/challenges/:challengeId" element={<ChallengeDetailsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/fam/:famId" element={<HeyFamPage />} />
            <Route path="/my-plan" element={<MyPlanPage />} />
            <Route path="/journal" element={<JournalPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </>
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const { auth, db } = getFirebaseServices();

    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeNotifications: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeNotifications) unsubscribeNotifications();
        if (timeoutId) clearTimeout(timeoutId);
        
        if (fbUser) {
            setFirebaseUser(fbUser);
            setLoading(true);
            let timedOut = false;

            timeoutId = setTimeout(() => {
                timedOut = true;
                signOut(auth);
            }, 15000);

            const userDocRef = doc(db, 'users', fbUser.uid);
            unsubscribeUser = onSnapshot(userDocRef, (docSnapshot) => {
                clearTimeout(timeoutId);
                if (timedOut) return;

                if (docSnapshot.exists()) {
                    const userData = { id: docSnapshot.id, ...docSnapshot.data() } as User;
                    if (fbUser.email === 'admin@heychurch.de' && userData.role !== 'admin') {
                        updateUserData(fbUser.uid, { role: 'admin' });
                        userData.role = 'admin'; 
                    }
                    setUser(userData);
                    setLoading(false);

                    if (unsubscribeNotifications) unsubscribeNotifications();
                    const notificationsQuery = getUserNotifications(fbUser.uid);
                    unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
                        const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
                        fetchedNotifications.sort((a, b) => {
                            const timeA = a.createdAt && typeof a.createdAt === 'object' && 'toMillis' in a.createdAt ? a.createdAt.toMillis() : new Date(a.createdAt as string).getTime();
                            const timeB = b.createdAt && typeof b.createdAt === 'object' && 'toMillis' in b.createdAt ? b.createdAt.toMillis() : new Date(b.createdAt as string).getTime();
                            return timeB - timeA;
                        });
                        setNotifications(fetchedNotifications);
                    });
                }
            }, (error) => {
                clearTimeout(timeoutId);
                if (timedOut) return;
                setLoading(false);
            });
        } else {
            setFirebaseUser(null);
            setUser(null);
            setLoading(false);
        }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeNotifications) unsubscribeNotifications();
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <LanguageProvider user={user}>
      <AuthContext.Provider value={{ 
          user, 
          firebaseUser, 
          loading, 
          notifications, 
          unreadCount: notifications.filter(n => !n.isRead).length 
      }}>
        <HashRouter>
          <ScrollToTop />
          <AppContent />
        </HashRouter>
      </AuthContext.Provider>
    </LanguageProvider>
  );
};

export default App;

export const SetupRouter: React.FC<{ error?: string; source?: string }> = ({ error, source }) => (
  <HashRouter>
    <Routes>
      <Route path="*" element={<SetupPage error={error} source={source} />} />
    </Routes>
  </HashRouter>
);
