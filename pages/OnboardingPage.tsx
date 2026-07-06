import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ArrowLeft, ArrowRight, Bell, AlertTriangle } from 'lucide-react';
import { useAuth } from '../App';
import { updateUserData } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute w-2 h-4" style={style}></div>
);

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<User>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const questions = [
    {
      key: 'points',
      title: t('onboarding.q1.title'),
      subtitle: t('onboarding.q1.subtitle'),
      options: [
          { label: t('onboarding.q1.opt1'), value: 0 },
          { label: t('onboarding.q1.opt2'), value: 1000 },
          { label: t('onboarding.q1.opt3'), value: 3000 },
          { label: t('onboarding.q1.opt4'), value: 5000 }
      ],
      multiSelect: false,
    },
    {
      key: 'isHomeChurch',
      title: t('onboarding.q2.title'),
      subtitle: t('onboarding.q2.subtitle'),
      options: [t('onboarding.q2.opt1'), t('onboarding.q2.opt2'), t('onboarding.q2.opt3'), t('onboarding.q2.opt4')],
      multiSelect: false,
    },
    {
      key: 'contactSource',
      title: t('onboarding.q3.title'),
      subtitle: t('onboarding.q3.subtitle'),
      options: [t('onboarding.q3.opt1'), t('onboarding.q3.opt2'), t('onboarding.q3.opt3'), t('onboarding.q3.opt4'), t('onboarding.q3.opt5')],
      multiSelect: false,
    },
    {
      key: 'nextSteps',
      title: t('onboarding.q4.title'),
      subtitle: t('onboarding.q4.subtitle'),
      options: [t('onboarding.q4.opt1'), t('onboarding.q4.opt2'), t('onboarding.q4.opt3'), t('onboarding.q4.opt4'), t('onboarding.q4.opt5')],
      multiSelect: true,
    },
     {
      key: 'serviceNeeds',
      title: t('onboarding.q5.title'),
      subtitle: t('onboarding.q5.subtitle'),
      options: [t('onboarding.q5.opt1'), t('onboarding.q5.opt2'), t('onboarding.q5.opt3'), t('onboarding.q5.opt4')],
      multiSelect: true,
    },
    {
      key: 'lookingFor',
      title: t('onboarding.q6.title'),
      subtitle: t('onboarding.q6.subtitle'),
      options: [t('onboarding.q6.opt1'), t('onboarding.q6.opt2'), t('onboarding.q6.opt3'), t('onboarding.q6.opt4')],
      multiSelect: true,
    },
  ];

  const totalQuestionSteps = questions.length;
  const totalSteps = totalQuestionSteps + 2; 

  const finishOnboarding = async () => {
    if (!user) return;
    setIsFinishing(true);
    setFinishError(null);
    try {
        const finalAnswers = { ...answers, onboarded: true };
        await updateUserData(user.id, finalAnswers);
        // The update will trigger a re-render in App.tsx and navigate away.
    } catch (error) {
        console.error("Failed to save onboarding data:", error);
        setFinishError("Could not save your profile. Please check your connection and try again.");
        setIsFinishing(false);
    }
  };

  useEffect(() => {
    if (step === totalQuestionSteps + 1 && !isFinishing) { 
        const timer = setTimeout(finishOnboarding, 4000);
        return () => clearTimeout(timer);
    }
  }, [step, isFinishing]);


  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSelect = (key: keyof User, value: any) => {
    const currentQuestion = questions[step];
    if (currentQuestion.multiSelect) {
      const currentSelection = (answers[key as keyof User] as string[] | undefined) || [];
      const newSelection = currentSelection.includes(value)
        ? currentSelection.filter(item => item !== value)
        : [...currentSelection, value];
      setAnswers({ ...answers, [key]: newSelection });
    } else {
      setAnswers({ ...answers, [key]: value });
      setTimeout(handleNext, 300);
    }
  };
  
  const progress = ((step + 1) / totalSteps) * 100;
  const currentQuestion = questions[step];

  return (
    <div className="min-h-screen bg-[rgb(19,54,102)] text-white flex flex-col p-6 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-2 rounded-full mb-8 z-10">
            <div 
                className="bg-[rgb(255_117_93)] h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col justify-center z-10">
            {step < totalQuestionSteps ? (
                // Questions
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-3xl font-extrabold mb-2">{currentQuestion.title}</h1>
                    <p className="text-gray-400 mb-8">{currentQuestion.subtitle}</p>
                    
                    <div className="space-y-3">
                        {currentQuestion.options.map((option: any, idx: number) => {
                            const label = typeof option === 'object' ? option.label : option;
                            const value = typeof option === 'object' ? option.value : option;
                            
                            const isSelected = currentQuestion.multiSelect 
                                ? (answers[currentQuestion.key as keyof User] as any[])?.includes(value)
                                : (answers[currentQuestion.key as keyof User]) === value;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(currentQuestion.key as keyof User, value)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex justify-between items-center group ${
                                        isSelected 
                                        ? 'bg-[rgb(255_117_93/0.2)] border-[rgb(255_117_93)]' 
                                        : 'bg-gray-800 border-gray-700 hover:border-[#E85A37]'
                                    }`}
                                >
                                    <span className="font-bold text-lg">{label}</span>
                                    {isSelected && <div className="bg-[rgb(255_117_93)] rounded-full p-1"><ArrowRight size={14} /></div>}
                                </button>
                            );
                        })}
                    </div>
                    {currentQuestion.multiSelect && (
                        <button onClick={handleNext} className="mt-6 w-full bg-white text-[rgb(19_54_102)] font-bold py-3 rounded-lg">
                            Next
                        </button>
                    )}
                </div>
            ) : step === totalQuestionSteps ? (
                // Notifications Request Step
                <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="bg-gray-800 inline-block p-6 rounded-full mb-6 shadow-xl">
                        <Bell size={48} className="text-[rgb(251_191_36)] animate-bounce-slow" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{t('onboarding.notifications.title')}</h2>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">{t('onboarding.notifications.subtitle')}</p>
                    
                    <button onClick={handleNext} className="w-full bg-[rgb(59_130_246)] text-white font-bold py-4 rounded-xl shadow-lg mb-3 hover:scale-105 transition-transform">
                        {t('onboarding.notifications.allow')}
                    </button>
                    <button onClick={handleNext} className="text-gray-500 font-semibold hover:text-white transition-colors">
                        {t('onboarding.notifications.later')}
                    </button>
                </div>
            ) : (
                // Celebration Step
                <div className="text-center relative">
                    <h1 className="text-4xl font-extrabold mb-4 animate-bounce">
                        {t('onboarding.celebration.title', {name: user?.name || ''})}
                    </h1>
                    <p className="text-xl text-gray-300 mb-8">{t('onboarding.celebration.subtitle')}</p>
                    
                    {finishError && (
                        <div className="bg-red-900/50 p-4 rounded-lg text-red-200 mb-4 flex items-center justify-center">
                            <AlertTriangle className="mr-2"/> {finishError}
                        </div>
                    )}

                    {isFinishing && <p className="text-gray-400 animate-pulse">Setting up your profile...</p>}
                    
                    {/* Confetti */}
                    {Array.from({ length: 50 }).map((_, i) => (
                        <ConfettiPiece 
                            key={i} 
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                backgroundColor: ['#F55740', '#FF982B', '#FFFFFF'][i % 3],
                                transform: `rotate(${Math.random() * 360}deg)`,
                                animation: `fall ${2 + Math.random() * 3}s linear infinite`
                            }} 
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Navigation Footer (Back button) */}
        {step > 0 && step < totalSteps - 1 && (
            <div className="mt-8 flex justify-center z-10">
                <button onClick={handleBack} className="text-gray-500 hover:text-white flex items-center transition-colors">
                    <ArrowLeft size={18} className="mr-2"/> Back
                </button>
            </div>
        )}
    </div>
  );
};

export default OnboardingPage;