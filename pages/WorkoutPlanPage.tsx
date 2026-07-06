
import React, { useState, useEffect, useMemo } from 'react';
import { User, WorkoutDay, CoachInsight, WorkoutLog } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, X, Trophy, MessageSquareQuote, RefreshCw, 
    Loader2, PlayCircle, BarChart3, Info, CheckCircle, 
    AlertCircle, TrendingUp, Activity, Zap, Bot
} from 'lucide-react';
import { useAuth } from '../App';
import { generateCoachInsight, adjustWorkoutPlan, generateWeeklyAnalysis } from '../services/geminiService';
import { logWorkoutCompletion, getWorkoutLogs, saveCoachInsight, updateUserData, getWorkoutLogsByWeek } from '../services/firebaseService';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer 
} from 'recharts';

interface WorkoutPlanPageProps {}

const FeedbackModal: React.FC<{ day: WorkoutDay, week: number, onClose: () => void, onSubmit: (difficulty: any, comments: string) => void }> = ({ day, week, onClose, onSubmit }) => {
    const [difficulty, setDifficulty] = useState<'Too Easy' | 'Just Right' | 'Too Hard' | ''>('');
    const [comments, setComments] = useState('');

    const handleSubmit = () => {
        if (!difficulty) {
            alert('Please select a difficulty rating.');
            return;
        }
        onSubmit(difficulty, comments);
    };

    return (
       <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center px-4 pb-[env(safe-area-inset-bottom)]">
             <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-700 pt-[env(safe-area-inset-top)] max-h-[90vh] overflow-y-auto">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Workout Complete!</h3>
                        <p className="text-sm text-gray-400">Week {week}, Day {day.day}: {day.title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700 p-2 rounded-full"><X size={20}/></button>
                </div>
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">How did it feel?</p>
                        <div className="grid grid-cols-3 gap-3">
                            {['Too Easy', 'Just Right', 'Too Hard'].map(level => (
                                <button 
                                    key={level} 
                                    onClick={() => setDifficulty(level as any)} 
                                    className={`p-4 rounded-xl text-sm font-bold border-2 transition-all ${difficulty === level ? 'bg-[rgb(255_117_93)] text-white border-[rgb(255_117_93)] transform scale-105 shadow-lg' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-300 mb-2 block uppercase tracking-wide">Coach's Notes (Optional)</label>
                        <textarea 
                            value={comments} 
                            onChange={e => setComments(e.target.value)} 
                            placeholder="Example: Squats felt heavy, form was good."
                            className="w-full p-3 h-24 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[rgb(59_130_246)]"
                        />
                    </div>
                    <button onClick={handleSubmit} className="w-full bg-[rgb(16_185_129)] text-white font-bold py-4 rounded-xl text-lg hover:bg-opacity-90 transition shadow-lg flex items-center justify-center">
                        <Trophy className="mr-2" size={20} /> Log Workout (+50 Pts)
                    </button>
                </div>
            </div>
        </div>
    );
};

const CoachVictorCard: React.FC<{ user: User }> = ({ user }) => {
    const [insight, setInsight] = useState<CoachInsight | undefined>(user.coachInsight);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lang = user.language === 'German' ? 'German' : 'English';

    const refreshInsight = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const logs = await getWorkoutLogs(user.id, 5); // Get last 5 logs
            const newInsight = await generateCoachInsight(user, logs);
            await saveCoachInsight(user.id, newInsight);
            setInsight(newInsight);
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('index')) {
                setError("Database index required. Please contact admin.");
            } else {
                setError("Failed to reach Coach Victor. Try again later.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOptimizePlan = async () => {
        if (!user.workoutPlan) return;
        setIsOptimizing(true);
        try {
            const logs = await getWorkoutLogs(user.id, 10);
            const updatedPlan = await adjustWorkoutPlan(user, logs);
            await updateUserData(user.id, { workoutPlan: updatedPlan });
            alert(lang === 'German' ? "Dein Plan wurde von Coach Victor optimiert!" : "Your plan has been optimized by Coach Victor!");
            window.location.reload(); // Refresh to show new plan
        } catch (e) {
            console.error(e);
            alert("Failed to optimize plan. Please try again.");
        } finally {
            setIsOptimizing(false);
        }
    };

    // Auto-generate if no insight exists OR if detailed analysis is missing
    useEffect(() => {
        if ((!insight || !insight.analysis) && !isGenerating) {
            refreshInsight();
        }
    }, []);

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
            <div className="bg-[#133666] p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <div className="bg-white p-1.5 rounded-full mr-3">
                        <img 
                            src={
                                user?.role === "admin" || user?.id === "0f2S6nTBi4gO9id7IjlnKxJMZ3v2"
                                ? "/images/victor.png"
                                : "https://api.dicebear.com/7.x/avataaars/svg?seed=Victor"
                            }
                            alt="Coach"
                            className="w-14 h-14 rounded-full border border-gray-500"
                            />                    
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase tracking-wide">Coach Victor</h3>
                        <p className="text-[10px] text-gray-300 font-medium uppercase">AI Performance Analyst</p>
                    </div>
                </div>
                <button 
                onClick={refreshInsight} 
                disabled={isGenerating} 
                className="text-[rgb(251_191_36)] hover:text-white transition-colors disabled:opacity-50"
                >
                <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
                </button>
            </div>
            
            <div className="p-6">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                        <Loader2 className="animate-spin mb-2" size={24}/>
                        <p className="text-sm">Analyzing your performance...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <AlertCircle className="text-[rgb(255_117_93)]" size={24} />
                        <p className="text-xs text-gray-400">{error}</p>
                    </div>
                ) : insight ? (
                   <div className="space-y-6">
                        <div className="flex items-start">
                            <MessageSquareQuote className="text-[rgb(255_117_93)] mr-3 flex-shrink-0 mt-1" size={24} />
                            <p className="text-lg text-white font-medium leading-relaxed italic">"{insight.message}"</p>
                        </div>

                        {insight.analysis && (
                            <div className="grid gap-4 mt-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-black text-[rgb(16_185_129)] uppercase mb-1">{lang === 'German' ? 'Was gut lief' : 'What Went Well'}</h4>
                                    <p className="text-sm text-gray-300">{insight.analysis.whatWentWell}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-black text-[rgb(251_191_36)] uppercase mb-1">{lang === 'German' ? 'Zu beobachten' : 'What to Observe'}</h4>
                                    <p className="text-sm text-gray-300">{insight.analysis.whatToObserve}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-black text-[rgb(255_117_93)] uppercase mb-1">{lang === 'German' ? 'Was zu ändern ist' : 'What to Change'}</h4>
                                    <p className="text-sm text-gray-300">{insight.analysis.whatToChange}</p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleOptimizePlan} 
                            disabled={isOptimizing}
                            className="w-full bg-[rgb(255_117_93)] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-50"
                        >
                            {isOptimizing ? <Loader2 className="animate-spin mr-2" size={18} /> : <RefreshCw className="mr-2" size={18} />}
                            {lang === 'German' ? 'Plan mit Coach Victor optimieren' : 'Optimize Plan with Coach Victor'}
                        </button>

                        <div className="flex justify-between items-end border-t border-gray-700 pt-4">
                             <div className="text-xs text-gray-500">
                                Last updated: {new Date(insight.generatedAt).toLocaleDateString()}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                insight.insightType === 'celebration' ? 'bg-green-900/50 text-green-400' :
                                insight.insightType === 'correction' ? 'bg-red-900/50 text-red-400' :
                                'bg-blue-900/50 text-blue-400'
                            }`}>
                                {insight.insightType}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-400">
                        <p>Complete your first workout to unlock Coach insights!</p>
                    </div>
                )}
            </div>
        </div>
    );
}


const PerformanceTab: React.FC<{ user: User }> = ({ user }) => {
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getWorkoutLogs(user.id, 20);
                setLogs([...data].reverse()); // Chronological order
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user.id]);

    const chartData = useMemo(() => {
        return logs.map(log => ({
            date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            difficulty: log.difficulty === 'Too Easy' ? 1 : log.difficulty === 'Just Right' ? 2 : 3,
            rawDifficulty: log.difficulty
        }));
    }, [logs]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[rgb(255_117_93)]" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-5 rounded-3xl shadow-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[rgb(16_185_129)]/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Workouts Done</p>
                    <p className="text-3xl font-black text-white italic">{user.completedWorkouts || 0}</p>
                    <div className="mt-2 flex items-center text-[10px] text-[rgb(16_185_129)] font-bold">
                        <TrendingUp size={12} className="mr-1" /> +12% this month
                    </div>
                </div>
                <div className="bg-gray-800 p-5 rounded-3xl shadow-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[rgb(251_191_36)]/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Points Earned</p>
                    <p className="text-3xl font-black text-[rgb(251_191_36)] italic">{(user.completedWorkouts || 0) * 50}</p>
                    <div className="mt-2 flex items-center text-[10px] text-[rgb(251_191_36)] font-bold">
                        <Zap size={12} className="mr-1" /> Rank: Elite
                    </div>
                </div>
            </div>

            {/* Consistency Chart */}
            <div className="bg-gray-800 p-6 rounded-[2rem] shadow-xl border border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase italic tracking-widest flex items-center">
                        <Activity className="mr-2 text-[rgb(255_117_93)]" size={18}/> Intensity History
                    </h3>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center text-[8px] font-bold text-gray-500 uppercase">
                            <span className="w-2 h-2 rounded-full bg-[rgb(255_117_93)] mr-1"></span> Difficulty
                        </div>
                    </div>
                </div>

                <div className="w-full h-[300px]">
                    {logs.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorDiff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E85A37" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#E85A37" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#9CA3AF" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fill: '#6B7280', fontWeight: 'bold' }}
                                />
                                <YAxis hide domain={[0, 4]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                    itemStyle={{ color: '#E85A37' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="difficulty" 
                                    stroke="#E85A37" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorDiff)" 
                                    dot={{ r: 4, fill: '#E85A37', strokeWidth: 2, stroke: '#1F2937' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-700 rounded-2xl">
                            <BarChart3 size={32} className="mb-2 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Data Recorded Yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Analysis Summary */}
            {user.coachInsight && user.coachInsight.analysis && (
                <div className="bg-gradient-to-br from-hey-church-blue/20 to-hey-church-purple/20 p-6 rounded-[2rem] border border-white/10 shadow-xl">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-white/10 rounded-xl mr-3">
                            <Bot size={20} className="text-white" />
                        </div>
                        <h3 className="text-sm font-black uppercase italic tracking-widest">Performance Analysis</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-[rgb(16_185_129)] uppercase tracking-widest mb-1">Victor's Verdict</p>
                            <p className="text-sm text-gray-200 leading-relaxed italic">"{user.coachInsight.message}"</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-start space-x-3">
                                <div className="mt-1 bg-green-500/20 p-1 rounded-full"><CheckCircle size={12} className="text-green-400" /></div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Success Point</p>
                                    <p className="text-xs text-gray-300">{user.coachInsight.analysis.whatWentWell}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="mt-1 bg-yellow-500/20 p-1 rounded-full"><Info size={12} className="text-[rgb(251_191_36)]" /></div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Observation</p>
                                    <p className="text-xs text-gray-300">{user.coachInsight.analysis.whatToObserve}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WorkoutPlanPage: React.FC<WorkoutPlanPageProps> = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const plan = user?.workoutPlan;
    
    const [activeTab, setActiveTab] = useState<'plan' | 'coach' | 'performance'>('plan');
    const [activeWeek, setActiveWeek] = useState(1);
  
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedDayForFeedback, setSelectedDayForFeedback] = useState<WorkoutDay | null>(null);
  
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<CoachInsight | null>(null);
  const [isAnalyzingWeek, setIsAnalyzingWeek] = useState(false);

  // Set active week based on start date logic on mount
  useEffect(() => {
    if (user?.workoutPlanStartDate) {
         const startDate = new Date(user.workoutPlanStartDate);
         const today = new Date();
         const diffTime = Math.abs(today.getTime() - startDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         const currentWeek = Math.ceil(diffDays / 7);
         if(currentWeek > 0 && currentWeek <= (plan?.duration || 12)) {
             setActiveWeek(currentWeek);
         }
    }
  }, [user]);

  const handleOpenFeedbackModal = (day: WorkoutDay) => {
    setSelectedDayForFeedback(day);
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
      setIsFeedbackModalOpen(false);
      setSelectedDayForFeedback(null);
  };

  const handleSubmitFeedback = async (difficulty: any, comments: string) => {
      if(!user || !selectedDayForFeedback) return;
      
      try {
        await logWorkoutCompletion(user.id, activeWeek, selectedDayForFeedback.day, difficulty, comments);
        alert('Great job! You earned 50 points for completing this workout.');
      } catch (e) {
        console.error("Failed to log workout", e);
        alert("Error saving workout log.");
      }
      
      handleCloseFeedbackModal();
  };

  const handleRequestWeeklyAnalysis = async () => {
      if (!user) return;
      setIsAnalyzingWeek(true);
      try {
          const weekLogs = await getWorkoutLogsByWeek(user.id, activeWeek);
          if (weekLogs.length === 0) {
              alert(user.language === 'German' ? "Du hast in dieser Woche noch keine Workouts geloggt." : "You haven't logged any workouts for this week yet.");
              setIsAnalyzingWeek(false);
              return;
          }
          const analysis = await generateWeeklyAnalysis(user, weekLogs, activeWeek);
          setWeeklyAnalysis(analysis);
      } catch (error) {
          console.error("Weekly analysis error:", error);
          alert("Coach Victor is currently unavailable for weekly analysis.");
      } finally {
          setIsAnalyzingWeek(false);
      }
  };

  if (!user) {
    return <div className="p-4 text-white">Loading...</div>;
  }
  
  if (!plan) {
    return (
      <div className="min-h-screen bg-[rgb(19,54,102)] flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-2xl font-bold">No workout plan found.</h2>
        <button onClick={() => navigate('/my-plan')} className="mt-4 bg-[rgb(255_117_93)] font-bold py-3 px-6 rounded-full">Go to Profile</button>
      </div>
    );
  }
  
  const selectedWeekData = plan.weeks.find(w => w.week === activeWeek) || plan.weeks[0];

  return (
    <div className="pt-[env(safe-area-inset-top)] p-4 pb-24 space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
          <button onClick={() => navigate('/my-plan')} className="flex items-center text-[rgb(255_152_43)] font-bold">
              <ArrowLeft size={20} className="mr-2"/> Back
          </button>
          <div className="bg-gray-800 p-1 rounded-lg flex space-x-1">
             <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${activeTab === 'plan' ? 'bg-[#133666] text-white' : 'text-gray-400'}`}>
                Plan
             </button>
             <button onClick={() => setActiveTab('coach')} className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${activeTab === 'coach' ? 'bg-[#133666] text-white' : 'text-gray-400'}`}>
                Coach
             </button>
             <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${activeTab === 'performance' ? 'bg-[#133666] text-white' : 'text-gray-400'}`}>
                Performance
             </button>
          </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight">{plan.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{plan.duration}-Week Personalized Program</p>
        </div>
        <button 
          onClick={() => navigate('/workout-onboarding')}
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-black px-4 py-2 rounded-xl border border-white/10 transition-all uppercase tracking-widest"
        >
          {user.language === 'German' ? 'Neuer Plan' : 'New Plan'}
        </button>
      </div>

      {activeTab === 'coach' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <CoachVictorCard user={user} />
              
              <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <h3 className="font-bold text-lg mb-4 flex items-center"><Info size={20} className="mr-2 text-[rgb(59_130_246)]"/> Program Stats</h3>
                  <div className="space-y-4">
                      <div>
                          <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Program Completion</span>
                              <span className="font-bold">{Math.min(100, Math.round((activeWeek / plan.duration) * 100))}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-[rgb(255_117_93)] h-2 rounded-full" style={{ width: `${(activeWeek / plan.duration) * 100}%` }}></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'performance' && (
          <PerformanceTab user={user} />
      )}

      {activeTab === 'plan' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            {/* Week Selector */}
            <div className="space-y-4">
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex space-x-2">
                        {plan.weeks.map(week => (
                            <button
                                key={week.week}
                                onClick={() => {
                                    setActiveWeek(week.week);
                                    setWeeklyAnalysis(null); // Reset analysis when changing week
                                }}
                                className={`flex-shrink-0 w-16 h-16 flex flex-col items-center justify-center rounded-2xl transition-all border-2 ${
                                    activeWeek === week.week 
                                    ? 'bg-[rgb(255_117_93)] border-[rgb(255_117_93)] text-white shadow-lg scale-105' 
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                <span className="text-[10px] font-bold uppercase">Week</span>
                                <span className="text-xl font-extrabold">{week.week}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleRequestWeeklyAnalysis}
                    disabled={isAnalyzingWeek}
                    className="w-full bg-hey-church-blue/20 hover:bg-hey-church-blue/30 text-hey-church-blue border border-hey-church-blue/30 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all disabled:opacity-50"
                >
                    {isAnalyzingWeek ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                    ) : (
                        <Bot className="mr-2" size={16} />
                    )}
                    {user.language === 'German' ? `Woche ${activeWeek} analysieren` : `Analyze Week ${activeWeek}`}
                </button>

                {weeklyAnalysis && (
                    <div className="bg-gradient-to-br from-hey-church-blue/30 to-hey-church-purple/30 p-6 rounded-[2rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-white/10 rounded-xl mr-3">
                                    <Bot size={20} className="text-white" />
                                </div>
                                <h3 className="text-sm font-black uppercase italic tracking-widest">Week {activeWeek} Report</h3>
                            </div>
                            <button onClick={() => setWeeklyAnalysis(null)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <p className="text-sm text-white italic mb-4 leading-relaxed">"{weeklyAnalysis.message}"</p>
                        
                        <div className="grid gap-3">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <p className="text-[8px] font-black text-[rgb(16_185_129)] uppercase tracking-widest mb-1">Successes</p>
                                <p className="text-xs text-gray-300">{weeklyAnalysis.analysis?.whatWentWell}</p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <p className="text-[8px] font-black text-[rgb(251_191_36)] uppercase tracking-widest mb-1">Observations</p>
                                <p className="text-xs text-gray-300">{weeklyAnalysis.analysis?.whatToObserve}</p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <p className="text-[8px] font-black text-[rgb(255_117_93)] uppercase tracking-widest mb-1">Next Week Plan</p>
                                <p className="text-xs text-gray-300">{weeklyAnalysis.analysis?.whatToChange}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Days List */}
            <div className="space-y-4">
                {selectedWeekData.days.map(day => (
                    <div key={day.day} className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700/50">
                        <div className="p-5 flex justify-between items-start">
                            <div>
                                <h3 className="font-extrabold text-lg text-white">Day {day.day}</h3>
                                <p className="text-[rgb(255_152_43)] font-bold">{day.title}</p>
                            </div>
                            {day.exercises.length > 0 ? (
                                <span className="bg-[#133666] text-xs font-bold px-3 py-1 rounded-full text-blue-200">
                                    {day.exercises.length} Exercises
                                </span>
                            ) : (
                                <span className="bg-gray-700 text-xs font-bold px-3 py-1 rounded-full text-gray-400">Rest</span>
                            )}
                        </div>

                        {day.exercises.length > 0 && (
                            <>
                                <div className="px-5 pb-5 space-y-3">
                                    {day.exercises.map((ex, idx) => (
                                        <div key={idx} className="bg-gray-900/50 p-3 rounded-xl flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-sm text-white">{ex.name}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {ex.sets} sets {"\u00D7"} {ex.reps} {"\u2022"} <span className="text-[rgb(251_191_36)]">{ex.weight}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">Rest</p>
                                                <p className="text-xs font-bold text-gray-300">{ex.rest}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-gray-900/30 p-4 border-t border-gray-700">
                                    <button
                                        onClick={() => handleOpenFeedbackModal(day)}
                                        className="w-full bg-[rgb(16_185_129)] text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-opacity-90 transition-transform active:scale-95 flex items-center justify-center shadow-md"
                                    >
                                        <CheckCircle className="mr-2" size={18}/> Log Workout
                                    </button>
                                </div>
                            </>
                        )}
                        {day.exercises.length === 0 && (
                             <div className="px-5 pb-5 text-gray-500 text-sm italic">
                                Active recovery. Go for a walk or stretch.
                             </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4">
                <button 
                    onClick={() => navigate('/workout-onboarding')}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center group"
                >
                    <RefreshCw className="mr-2 text-[rgb(251_191_36)] group-hover:rotate-180 transition-transform duration-500" size={20} />
                    {user.language === 'German' ? 'Neuen Trainingsplan erstellen' : 'Create New Workout Plan'}
                </button>
                <p className="text-center text-[10px] text-gray-500 mt-3 uppercase tracking-widest">
                    {user.language === 'German' ? 'Dies wird deinen aktuellen Fortschritt zurücksetzen' : 'This will reset your current progress'}
                </p>
            </div>
        </div>
      )}

      {isFeedbackModalOpen && selectedDayForFeedback && (
        <FeedbackModal
            day={selectedDayForFeedback}
            week={activeWeek}
            onClose={handleCloseFeedbackModal}
            onSubmit={handleSubmitFeedback}
        />
       )}
    </div>
  );
};

export default WorkoutPlanPage;
