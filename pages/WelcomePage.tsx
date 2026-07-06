
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SignUpModal, SignInModal } from '../components/AuthModals';

type ModalType = 'signup' | 'signin' | null;
type Language = 'English' | 'German';

const WelcomePage: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const languages: { code: Language; label: string }[] = [
        { code: 'German', label: 'Deutsch' },
        { code: 'English', label: 'English' },
    ];

    return (
        <>
            <div className="min-h-screen bg-[#133666] flex flex-col items-center justify-center p-8 text-white text-center">

                {/* Branded Title Section */}
                <div className="mb-2">
                    <h1 className="text-6xl font-black text-[#FF755D] uppercase tracking-tighter drop-shadow-xl animate-in fade-in slide-in-from-top-4 duration-700">
                        HEY LIFE
                    </h1>
                </div>

                {/* Tagline Section */}
                <div className="mb-10 animate-in fade-in duration-1000 delay-200">
                    <p className="text-sm font-bold text-white/80 uppercase tracking-[0.3em] leading-none">
                        {t('welcome.tagline')}
                    </p>
                </div>

                {/* VISION STATEMENT - ORANGE COLOR & NORMAL WEIGHT (NOT ITALIC) */}
                <div className="max-w-xs mb-16 animate-in fade-in zoom-in duration-1000 delay-300">
                    <h2 className="text-2xl font-black text-[#FF755D] leading-tight tracking-tight">
                        {t('welcome.vision')}
                    </h2>
                </div>

                {/* Language Selector Section */}
                <div className="mb-14 w-full max-w-xs animate-in fade-in duration-1000 delay-500">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">
                        {t('welcome.select_language')}
                    </p>
                    <div className="flex justify-center space-x-3 bg-black/20 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        {languages.map(({ code, label }) => (
                            <button
                                key={code}
                                onClick={() => setLanguage(code)}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 ${
                                    language === code
                                        ? 'bg-[#3B82F6] text-white shadow-lg scale-105'
                                        : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Action Buttons Section */}
                <div className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-700">
                    <button
                        onClick={() => setActiveModal('signup')}
                        className="w-full bg-[#FF755D] text-white font-black py-6 rounded-[2rem] text-xl uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all hover:brightness-110 border-b-4 border-[#EF6D4D]"
                    >
                        {t('welcome.join')}
                    </button>
                    <button
                        onClick={() => setActiveModal('signin')}
                        className="w-full bg-black text-white font-black py-6 rounded-[2rem] text-xl uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all hover:bg-gray-900 border-b-4 border-gray-800"
                    >
                        {t('welcome.signin')}
                    </button>
                </div>

                {/* Footer Branding */}
                <div className="mt-16 opacity-10 font-black text-[10px] uppercase tracking-[0.8em]">
                    Hey Church Global
                </div>
            </div>

            {activeModal === 'signup' && <SignUpModal onClose={() => setActiveModal(null)} onSwitchToSignIn={() => setActiveModal('signin')} />}
            {activeModal === 'signin' && <SignInModal onClose={() => setActiveModal(null)} onSwitchToSignUp={() => setActiveModal('signup')} />}
        </>
    );
};

export default WelcomePage;
