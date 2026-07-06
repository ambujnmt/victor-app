import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { generateWorkoutPlan } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../App';
import { updateUserData } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';

// ? FIXED KEYS (important)
const equipmentOptions = [
  'bodyweight',
  'dumbbells',
  'barbell',
  'kettlebells',
  'bands',
  'pullup',
  'fullgym',
  'crossfit'
];

const inspirationTexts = [
  "Your only limit is you.",
  "Consistency is the key to mastery.",
  "Train your body, honor your soul.",
  "Small steps, every day, lead to big results.",
];

const WorkoutOnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage(); // ? i18n
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [inspiration, setInspiration] = useState(inspirationTexts[0]);

  const [answers, setAnswers] = useState({
    goal: 'strength',
    experience: 'beginner',
    frequency: 3,
    duration: 12,
    age: user?.age || 30,
    height: user?.height || 180,
    weight: user?.weight || 80,
    equipment: [] as string[],
    oneRepMax: { squat: 0, deadlift: 0, bench: 0 },
    injuries: '',
  });

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setInspiration(prev => {
          const idx = (inspirationTexts.indexOf(prev) + 1) % inspirationTexts.length;
          return inspirationTexts[idx];
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // ? i18n titles
  const steps = [
    { key: 'goal', title: t('workout.goal.title') },
    { key: 'experience', title: t('workout.experience.title') },
    { key: 'frequency', title: t('workout.frequency.title') },
    { key: 'duration', title: t('workout.duration.title') },
    { key: 'biometrics', title: t('workout.biometrics.title') },
    { key: 'equipment', title: t('workout.equipment.title') },
    { key: 'oneRepMax', title: t('workout.1rm.title') },
    { key: 'injuries', title: t('workout.injuries.title') },
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleToggleEquipment = (item: string) => {
    setAnswers(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(i => i !== item)
        : [...prev.equipment, item]
    }));
  };

  const handleGeneratePlan = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const plan = await generateWorkoutPlan(answers);
      await updateUserData(user.id, {
        workoutPlan: plan,
        onboardingAnswers: answers,
        age: answers.age,
        height: answers.height,
        weight: answers.weight,
        workoutPlanStartDate: new Date().toISOString()
      });
      navigate('/workout-plan');
    } catch (error) {
      console.error(error);
      alert(t('workout.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // ? LOADING SCREEN
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(19,54,102)] flex flex-col items-center justify-center p-8 text-center">
        <Sparkles size={64} className="text-[rgb(251_191_36)] animate-pulse mb-6" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          {t('workout.loading.title')}
        </h2>
        <p className="mt-4 text-gray-400 max-w-xs font-medium">
          {t('workout.loading.desc', { duration: answers.duration })}
        </p>
        <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10 italic text-[rgb(255_152_43)]">
          "{inspiration}"
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const current = steps[step];

    switch (current.key) {

      case 'goal':
        return (
          <div className="grid gap-3">
            {['strength', 'muscle', 'weight_loss', 'longevity'].map(o => (
              <button key={o}
                onClick={() => { setAnswers({ ...answers, goal: o }); handleNext(); }}
                className={`p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all ${answers.goal === o ? 'border-[rgb(255_117_93)] bg-[rgb(255_117_93/0.2)]' : 'border-gray-700 bg-gray-800'}`}>
                {t(`workout.goal.${o}`)}
              </button>
            ))}
          </div>
        );

      case 'experience':
        return (
          <div className="grid gap-3">
            {['beginner', 'intermediate', 'advanced'].map(o => (
              <button key={o}
                onClick={() => { setAnswers({ ...answers, experience: o }); handleNext(); }}
                className={`p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all ${answers.experience === o ? 'border-[rgb(255_117_93)] bg-[rgb(255_117_93/0.2)]' : 'border-gray-700 bg-gray-800'}`}>

                {t(`workout.experience.${o}`)}

                <p className="text-xs font-normal text-gray-400 mt-1">
                  {t(`workout.experience.${o}.desc`)}
                </p>
              </button>
            ))}
          </div>
        );

      case 'frequency':
        return (
          <div className="grid gap-3">
            {[2, 3, 4, 5, 6].map(num => (
              <button key={num}
                onClick={() => { setAnswers({ ...answers, frequency: num }); handleNext(); }}
                className={`p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all ${answers.frequency === num ? 'border-[rgb(255_117_93)] bg-[rgb(255_117_93/0.2)]' : 'border-gray-700 bg-gray-800'}`}>
                {num} {t('workout.frequency.days')}
              </button>
            ))}
          </div>
        );

      case 'duration':
        return (
          <div className="grid gap-4">
            {[4, 8, 12].map(weeks => (
              <button key={weeks}
                onClick={() => { setAnswers({ ...answers, duration: weeks }); handleNext(); }}
                className={`p-6 rounded-3xl border-2 text-left transition-all ${answers.duration === weeks ? 'border-[rgb(16_185_129)] bg-[rgb(16_185_129/0.1)]' : 'border-gray-700 bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-2xl font-black text-white">
                      {t('workout.duration.weeks', { count: weeks })}
                    </span>
                    <span className="text-sm font-bold text-gray-500 uppercase">
                      {weeks === 12 ? t('workout.duration.full') : t('workout.duration.focus')}
                    </span>
                  </div>
                  <Calendar />
                </div>
              </button>
            ))}
          </div>
        );

      case 'biometrics':
        return (
          <div className="space-y-4">
            {['weight', 'height', 'age'].map(field => (
              <div key={field} className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <label className="text-xs font-black text-gray-500 uppercase">
                  {t(`workout.${field}`)}
                </label>
                <input
                  type="number"
                  value={(answers as any)[field]}
                  onChange={e => setAnswers({ ...answers, [field]: +e.target.value })}
                  className="w-full bg-transparent text-2xl font-bold mt-1 outline-none text-white"
                />
              </div>
            ))}
          </div>
        );

      case 'equipment':
        return (
          <div className="grid gap-2">
            {equipmentOptions.map(opt => (
              <button key={opt}
                onClick={() => handleToggleEquipment(opt)}
                className={`p-4 rounded-xl border-2 flex items-center justify-between font-bold transition-all ${answers.equipment.includes(opt) ? 'border-[rgb(59_130_246)] bg-[rgb(59_130_246/0.1)] text-white' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>
                {t(`workout.equipment.${opt}`)}
                {answers.equipment.includes(opt) && <CheckCircle2 size={18} />}
              </button>
            ))}
          </div>
        );

      case 'oneRepMax':
        return (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm mb-4">{t('workout.1rm.desc')}</p>
            {['squat', 'bench', 'deadlift'].map(lift => (
              <div key={lift} className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <label className="text-xs font-black text-gray-500 uppercase">{lift.toUpperCase()} 1RM (kg)</label>
                <input type="number"
                  value={(answers.oneRepMax as any)[lift]}
                  onChange={e => setAnswers({ ...answers, oneRepMax: { ...answers.oneRepMax, [lift]: +e.target.value } })}
                  className="w-full bg-transparent text-2xl font-bold mt-1 outline-none text-white" />
              </div>
            ))}
          </div>
        );

      case 'injuries':
        return (
          <div className="space-y-4">
            <div className="bg-[rgb(255_117_93/0.1)] p-4 rounded-2xl border border-[rgb(255_117_93/0.3)] flex items-start">
              <AlertCircle size={20} className="text-[rgb(255_117_93)] mr-3 mt-1 flex-shrink-0" />
              <p className="text-sm text-gray-300">{t('workout.injuries.desc')}</p>
            </div>
            <textarea
              value={answers.injuries}
              onChange={e => setAnswers({ ...answers, injuries: e.target.value })}
              placeholder={t('workout.injuries.placeholder')}
              className="w-full h-40 p-4 bg-gray-800 border-2 border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(255_117_93)]"
            />
          </div>
        );

      default:
        return <p>{t('workout.processing')}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(19,54,102)] text-white p-6 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">

        <div className="flex items-center justify-between mb-8">
          <button onClick={handleBack}><ArrowLeft /></button>

          <div className="flex-grow mx-4 bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[rgb(255_117_93)] h-full" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>

          <span>{step + 1}/{steps.length}</span>
        </div>

        <h1 className="text-4xl font-black mb-8">{steps[step].title}</h1>

        {renderContent()}
      </div>

      <div className="max-w-md mx-auto w-full mt-8">
        {step === steps.length - 1 ? (
          <button onClick={handleGeneratePlan} className="w-full bg-[rgb(255_117_93)] py-5 rounded-3xl font-black">
            {t('workout.generate')}
          </button>
        ) : (
          <button onClick={handleNext} className="w-full bg-white text-black py-5 rounded-3xl font-black flex justify-center">
            {t('workout.next')} <ChevronRight className="ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutOnboardingPage;