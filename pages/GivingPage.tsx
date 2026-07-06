
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, Lock, QrCode, X, CheckCircle, ExternalLink, Trophy, Gift, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { getGlobalContent, updateUserData } from '../services/firebaseService';
import { GlobalContent } from '../types';
import { useAuth } from '../App';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const GivingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [amount, setAmount] = useState<number | string>(50);
    const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
    const [config, setConfig] = useState<GlobalContent['donation'] | null>(null);
    const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Modal States
    const [showGivingModal, setShowGivingModal] = useState(false);
    const [step, setStep] = useState<'confirm' | 'embedded_payment' | 'processing_external' | 'success'>('confirm');
    const [showQr, setShowQr] = useState(false);
    
    const suggestedAmounts = [25, 50, 100, 150, 250];

    useEffect(() => {
        setLoading(true);
        // Priority 1: Check Global Config (index.html)
        const htmlConfigId = window.HEYCHURCH_APP_CONFIG?.PAYPAL_CLIENT_ID;
        if (htmlConfigId) {
            setPaypalClientId(htmlConfigId);
        }

        // Priority 2: Check Firestore (Admin Config)
        getGlobalContent().then(content => {
            if (content) {
                if (content.donation) setConfig(content.donation);
                // Only override if not already set by HTML config
                if (content.paypalClientId && !htmlConfigId) {
                    setPaypalClientId(content.paypalClientId);
                }
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleAmountClick = (value: number) => {
        setAmount(value);
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    const handleStartGiving = () => {
        setStep('confirm');
        setShowGivingModal(true);
    };

    const handleProceed = () => {
        if (paypalClientId) {
            setStep('embedded_payment');
        } else {
            handleExternalLinkPayment();
        }
    };

    const handleExternalLinkPayment = () => {
        const link = config?.paypalLink;
        if (!link) {
            alert('Donation link not configured. Please contact church admin.');
            return;
        }

        const finalAmount = typeof amount === 'number' ? amount : parseFloat(amount as string);
        let finalLink = link;

        if (link.includes('paypal.me') && finalAmount > 0) {
            const cleanLink = link.endsWith('/') ? link.slice(0, -1) : link;
            finalLink = `${cleanLink}/${finalAmount}`;
        }

        window.open(finalLink, '_blank');
        setStep('processing_external');
    };

    const handleSuccess = async (details?: any) => {
        if (!user) return;
        
        try {
            await updateUserData(user.id, {
                points: (user.points || 0) + 500
            });
            setStep('success');
        } catch (e) {
            console.error("Failed to award points", e);
            setStep('success');
        }
    };

    if (loading) return <div className="min-h-screen bg-[rgb(19,54,102)] flex items-center justify-center"><Loader2 className="animate-spin text-white h-10 w-10"/></div>;

    return (
        <div className="pt-[calc(env(safe-area-inset-top)+16px)] space-y-6 bg-[rgb(19,54,102)] min-h-screen text-white relative">
            <button onClick={() => navigate('/home')} className="flex items-center text-[rgb(255_152_43)] font-bold hover:text-white transition-colors">
                <ArrowLeft size={20} className="mr-2"/> Dashboard
            </button>
            
            <div className="text-center pt-2">
                <div className="inline-block p-5 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-[0_0_40px_rgba(251,191,36,0.3)] mb-6 animate-in zoom-in duration-700">
                    <Gift size={40} className="text-white"/>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tight italic">Generosity</h1>
                <p className="text-gray-300 mt-4 max-w-xs mx-auto text-lg leading-relaxed font-medium">
                    "God loves a <span className="text-[rgb(251_191_36)] italic">cheerful giver</span>."
                </p>
                <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-[rgb(251_191_36/0.1)] border border-[rgb(251_191_36/0.2)] rounded-full">
                    <Trophy size={14} className="text-[rgb(251_191_36)] mr-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[rgb(251_191_36)]">Earn +500 Points</span>
                </div>
            </div>

            {/* Main Giving Card */}
            <div className="bg-gray-800 p-1 rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="bg-gray-900 rounded-[2.3rem] p-8 space-y-10">
                    
                    {/* Amount Selector */}
                    <div>
                        <h2 className="font-black text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-6 text-center">Amount (EUR)</h2>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {suggestedAmounts.map(val => (
                                <button 
                                    key={val}
                                    onClick={() => handleAmountClick(val)}
                                    className={`py-5 rounded-2xl font-black text-xl transition-all duration-300 border-2 ${amount === val ? 'bg-white text-[rgb(19_54_102)] border-white shadow-2xl scale-105' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'}`}
                                >
                                    {val}
                                </button>
                            ))}
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                                <input
                                    type="number"
                                    placeholder="Other"
                                    value={suggestedAmounts.includes(Number(amount)) ? '' : amount}
                                    onChange={handleCustomAmountChange}
                                    className="w-full h-full p-4 pl-8 bg-gray-800 border-2 border-gray-700 rounded-2xl text-center font-black text-lg text-white focus:outline-none focus:border-[rgb(251_191_36)] transition-all placeholder-gray-600"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Frequency Toggle */}
                    <div className="bg-gray-800 p-1.5 rounded-2xl flex border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setFrequency('one-time')} 
                            className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${frequency === 'one-time' ? 'bg-[#133666] text-white shadow-xl' : 'text-gray-500 hover:text-gray-400'}`}
                        >
                            One-Time Gift
                        </button>
                        <button 
                            onClick={() => setFrequency('monthly')} 
                            className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${frequency === 'monthly' ? 'bg-[rgb(255_117_93)] text-white shadow-xl' : 'text-gray-500 hover:text-gray-400'}`}
                        >
                            Monthly Partner
                        </button>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleStartGiving} 
                        className="w-full bg-gradient-to-r from-[#EF6D4D] to-[rgb(255_117_93)] text-white font-black py-6 rounded-2xl flex items-center justify-center text-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_20px_40px_rgba(239,109,77,0.3)]"
                    >
                        <HeartHandshake className="mr-3" size={24}/>
                        Give {amount ? `€${amount}` : ''}
                    </button>
                    
                    <div className="flex justify-center pt-2">
                         <button onClick={() => setShowQr(true)} className="flex items-center text-gray-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                            <QrCode size={14} className="mr-2"/> Scan QR Code
                        </button>
                    </div>

                     <p className="text-[9px] text-gray-700 text-center font-bold flex items-center justify-center uppercase tracking-widest">
                        <Lock size={10} className="mr-1.5"/> End-to-End Secure Processing
                    </p>
                </div>
            </div>

            {/* In-App Check-Out Gateway Modal */}
            {showGivingModal && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-gray-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 relative flex flex-col max-h-[90vh]">
                        <button onClick={() => setShowGivingModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white z-10 bg-white/5 p-2 rounded-full"><X size={20}/></button>
                        
                        {/* Step 1: Confirmation */}
                        {step === 'confirm' && (
                            <div className="p-10 text-center space-y-8">
                                <div className="mx-auto w-24 h-24 bg-[rgb(59_130_246/0.1)] rounded-full flex items-center justify-center mb-4">
                                    <Sparkles size={48} className="text-[rgb(59_130_246)] animate-pulse"/>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Confirm Gift</h3>
                                    <p className="text-gray-400 font-medium">
                                        Amount: <span className="text-white font-black text-2xl">€{amount}</span>
                                    </p>
                                </div>
                                
                                <div className="bg-black/30 p-6 rounded-3xl text-left border border-white/5">
                                    <p className="text-[9px] text-[rgb(59_130_246)] font-black uppercase tracking-[0.2em] mb-2">Your Impact</p>
                                    <p className="text-sm text-gray-300 leading-relaxed italic">"Your generosity fuels the mission to reach our city with hope and change lives through the Word."</p>
                                </div>
                                
                                <button 
                                    onClick={handleProceed}
                                    className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all text-lg shadow-xl"
                                >
                                    Proceed to Checkout <ArrowLeft className="ml-2 rotate-180" size={20}/>
                                </button>
                            </div>
                        )}

                        {/* Step 2A: Embedded PayPal SDK Integration (IN-APP) */}
                        {step === 'embedded_payment' && paypalClientId && (
                            <div className="p-8 overflow-y-auto">
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-black uppercase italic tracking-tight">Checkout</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-widest">Powered by PayPal Gateway</p>
                                </div>
                                
                                <PayPalScriptProvider options={{ 
                                    "clientId": paypalClientId, 
                                    currency: "EUR",
                                    components: "buttons",
                                    intent: "capture"
                                }}>
                                    <div className="min-h-[300px]">
                                        <PayPalButtons 
                                            style={{ layout: "vertical", shape: "pill", color: "white", label: "pay" }}
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    purchase_units: [{
                                                        amount: {
                                                            value: amount.toString(),
                                                            currency_code: "EUR"
                                                        },
                                                        description: `Hey Life Church Donation - ${frequency}`
                                                    }],
                                                    intent: "CAPTURE"
                                                });
                                            }}
                                            onApprove={async (data, actions) => {
                                                if (actions.order) {
                                                    const details = await actions.order.capture();
                                                    handleSuccess(details);
                                                }
                                            }}
                                            onError={(err) => {
                                                console.error("Payment Gateway Error:", err);
                                                alert("Transaction could not be completed at this time.");
                                            }}
                                        />
                                    </div>
                                </PayPalScriptProvider>
                                
                                <div className="mt-6 flex flex-col items-center opacity-40">
                                    <Lock size={12} className="mb-1" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Encrypted Connection</span>
                                </div>
                            </div>
                        )}

                        {/* Step 2B: External Link Processing */}
                        {step === 'processing_external' && (
                            <div className="p-10 text-center space-y-8">
                                <div className="animate-pulse space-y-3">
                                    <div className="w-16 h-16 bg-[rgb(251_191_36/0.2)] rounded-full mx-auto flex items-center justify-center">
                                        <ExternalLink className="text-[rgb(251_191_36)]" size={24} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Finishing up...</h3>
                                    <p className="text-sm text-gray-400 font-medium">We opened your secure payment window in a new tab.</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center p-5 bg-black/20 rounded-[1.5rem] border border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-4 text-xs font-black text-gray-500">1</div>
                                        <p className="text-left text-xs text-gray-500 font-bold uppercase tracking-wider">Complete the transaction in Safari/Chrome</p>
                                    </div>
                                    <div className="flex items-center p-5 bg-[rgb(59_130_246/0.1)] rounded-[1.5rem] border border-[rgb(59_130_246/0.3)]">
                                        <div className="w-8 h-8 rounded-full bg-[rgb(59_130_246)] flex items-center justify-center mr-4 text-xs font-black text-white animate-bounce">2</div>
                                        <p className="text-left text-xs text-white font-black uppercase tracking-wider">Come back here to claim your reward</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleSuccess()}
                                    className="w-full bg-[rgb(16_185_129)] text-white font-black py-5 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-[1.02] transition-all"
                                >
                                    <CheckCircle size={24} className="mr-2"/> I HAVE COMPLETED MY GIFT
                                </button>
                            </div>
                        )}

                        {/* Step 3: Success Celebration */}
                        {step === 'success' && (
                            <div className="p-10 text-center relative overflow-hidden">
                                <div className="mx-auto w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce">
                                    <Trophy size={48} className="text-white"/>
                                </div>
                                <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">THANK YOU!</h3>
                                <p className="text-gray-400 font-medium mb-8">Your contribution has been received. Your kindness builds the future.</p>
                                
                                <div className="bg-[rgb(251_191_36)] text-black p-6 rounded-[2rem] mb-10 shadow-[0_15px_30px_rgba(251,191,36,0.4)]">
                                    <p className="font-black text-3xl italic tracking-tighter">+500 POINTS</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest mt-1">Generosity Bonus Awarded</p>
                                </div>

                                <button 
                                    onClick={() => { setShowGivingModal(false); navigate('/home'); }}
                                    className="w-full bg-gray-700 text-white font-black py-5 rounded-2xl hover:bg-gray-600 transition-colors uppercase text-sm tracking-widest"
                                >
                                    Return to Home
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQr && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-50 animate-in fade-in duration-500" onClick={() => setShowQr(false)}>
                    <div className="bg-white p-8 rounded-[3rem] max-w-sm w-full relative text-center shadow-[0_0_100px_rgba(255,255,255,0.1)]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowQr(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black bg-gray-100 p-2 rounded-full transition-colors">
                            <X size={24}/>
                        </button>
                        <h3 className="text-black font-black uppercase tracking-tight text-2xl italic mb-6">Scan to Give</h3>
                        <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border-2 border-gray-100 mb-8 p-4 flex items-center justify-center">
                            {config?.qrCodeUrl ? (
                                <img src={config.qrCodeUrl} alt="Donation QR Code" className="w-full h-full object-contain"/>
                            ) : (
                                <div className="text-gray-400 text-sm text-center p-4">
                                    <QrCode size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>QR Code not yet configured in Admin Panel.</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowQr(false)} className="bg-black text-white font-black py-5 px-8 rounded-2xl w-full tracking-widest uppercase text-sm shadow-xl">Close Preview</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GivingPage;
