
import React, { useState, useEffect, useMemo } from 'react';
import { Challenge, ActiveChallenge } from '../types';
// Add MessageCircle for the new chat icon
import { Check, Loader2, Users, UserPlus, MessageCircle, Trophy } from 'lucide-react';
import { useAuth } from '../App';
import { getChallenges, startChallenge, getActiveChallengeProgress } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import InviteFriendModal from '../components/InviteFriendModal';

const ChallengeCard: React.FC<{
  challenge: Challenge;
  progress?: ActiveChallenge;
  isStarting: boolean;
  onInvite: (challenge: Challenge) => void;
  onStart: (challenge: Challenge) => void;
}> = ({ challenge, progress, isStarting, onInvite, onStart }) => {
  const isCompleted = !!progress && progress.completedDays >= progress.duration;
  const isActive = !!progress && !isCompleted;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const participantCount = challenge.participantIds?.length || 0;
  
  const handleInviteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInvite(challenge);
  };

  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStart(challenge);
  };

  return (
    <div 
      onClick={() => navigate(`/challenges/${challenge.id}`)}
      className="bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col hover:bg-gray-700 transition-colors cursor-pointer relative"
    >
        {/* Points badge in the top right corner */}
        <div className="absolute top-4 right-4 bg-[rgb(251_191_36)] text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">
            +{challenge.points} Points
        </div>

        <div className="flex-grow pr-20"> {/* Add padding to the right to avoid overlap with points */}
            <h3 className="font-extrabold text-xl text-white">{t(challenge.title)}</h3>
            <p className="text-xs text-[rgb(255_152_43)] font-semibold uppercase tracking-wider mt-1">{challenge.category}</p>
            
            <p className="text-sm text-gray-300 mt-2">
                {t(challenge.description)}
            </p>
        </div>

        <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-700/50">
            {/* Social info: participants and chat */}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center" title={`${participantCount} people participating`}>
                    <Users size={16} className="mr-1.5"/>
                    <span>{participantCount}</span>
                </div>
                <div className="flex items-center" title="Join the challenge chat">
                    <MessageCircle size={16} className="mr-1.5"/>
                    <span>Chat</span>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleInviteClick}
                className="font-semibold py-2 px-4 rounded-lg flex items-center justify-center text-sm bg-[rgb(59_130_246)] text-white hover:bg-opacity-80 transition-transform hover:scale-105"
              >
                <UserPlus size={16} className="mr-2"/> Invite
              </button>
              {isCompleted ? (
                <div className="font-bold py-2 px-4 rounded-lg flex items-center justify-center text-sm bg-[rgb(251_191_36)] text-gray-900 cursor-default">
                  <Trophy size={16} className="mr-1.5"/> Completed
                </div>
              ) : isActive ? (
                <div className="font-bold py-2 px-4 rounded-lg flex items-center justify-center text-sm bg-green-500 text-white cursor-default">
                  <Check size={16} className="mr-1"/> In Progress
                </div>
              ) : (
                <button
                  onClick={handleStartClick}
                  disabled={isStarting}
                  className="font-bold py-2 px-5 rounded-lg flex items-center justify-center text-sm bg-[rgb(255_117_93)] text-white hover:bg-opacity-90 transition-transform hover:scale-105 disabled:bg-gray-600 disabled:scale-100"
                >
                  {isStarting ? <Loader2 size={16} className="animate-spin"/> : 'Start'}
                </button>
              )}
            </div>
        </div>
    </div>
  );
};


const ChallengesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [durationFilter, setDurationFilter] = useState<number>(3);
  const [inviteModalChallenge, setInviteModalChallenge] = useState<Challenge | null>(null);
  const [startingChallengeId, setStartingChallengeId] = useState<string | null>(null);
 
  useEffect(() => {
    const fetchChallenges = async () => {
        setLoading(true);
        const fetchedChallenges = await getChallenges();
        setChallenges(fetchedChallenges);
        setLoading(false);
    };
    fetchChallenges();
  }, []);

  const filteredChallenges = useMemo(() => {
    return challenges.filter(c => {
      return Number(c.duration) === Number(durationFilter);
    });
  }, [challenges, durationFilter]);
  
  const handleStart = async (challenge: Challenge) => {
    if (!user) return;
    setStartingChallengeId(challenge.id);
    try {
        await startChallenge(user.id, challenge);
        // The user's activeChallenges will update via the onAuthStateChanged listener in App.tsx.
    } catch (error) {
        console.error("Failed to start challenge:", error);
        alert("There was an error starting this challenge. Please try again.");
    } finally {
        setStartingChallengeId(null);
    }
  };

  const durations = [3, 5, 7, 14, 21];

  return (
    <>
      <div className="p-4 space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white">
         {/* <div className="pt-2">
            <p className="text-gray-300 text-lg font-bold italic tracking-tight">{t('challenges.subtitle')}</p>
        </div> */}        
        <div className="bg-gray-800 p-1 rounded-xl shadow-md flex justify-between space-x-1 overflow-x-auto">
          {durations.map(day => (
            <button
              key={day}
              onClick={() => setDurationFilter(day)}
              className={`flex-1 min-w-[60px] py-2 text-sm font-bold rounded-lg transition-colors ${durationFilter === day ? 'bg-[rgb(255_117_93)] text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              {t('challenges.days', { count: day })}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="text-center p-8 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin h-8 w-8 mb-2" />
            <p>{t('challenges.loading')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChallenges.length > 0 ? (
              filteredChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  progress={getActiveChallengeProgress(user?.activeChallenges, challenge.id)}
                  isStarting={startingChallengeId === challenge.id}
                  onInvite={setInviteModalChallenge}
                  onStart={handleStart}
                />
              ))
            ) : (
              <div className="text-center bg-gray-800 p-8 rounded-lg">
                <p className="text-gray-400">No challenges found for this duration.</p>
                <p className="text-sm text-gray-500 mt-2">Try selecting another option or syncing the database from the admin panel if you are an admin.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {inviteModalChallenge && user && (
        <InviteFriendModal
          target={{
              id: inviteModalChallenge.id,
              title: inviteModalChallenge.title,
              type: 'challenge',
              data: inviteModalChallenge
          }}
          user={user}
          onClose={() => setInviteModalChallenge(null)}
        />
      )}
    </>
  );
};

export default ChallengesPage;
