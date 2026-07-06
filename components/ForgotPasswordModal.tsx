
import React, { useState } from 'react';
import { X, AlertCircle, Loader2, CheckCircle2, Mail, KeyRound } from 'lucide-react';
import { requestPasswordResetOtp, confirmPasswordResetOtp } from '../services/firebaseService';

interface ForgotPasswordModalProps {
    initialEmail?: string;
    onClose: () => void;
}

type Step = 'email' | 'otp' | 'done';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ initialEmail = '', onClose }) => {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError('');
        try {
            await requestPasswordResetOtp(email.trim());
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send the code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        try {
            await requestPasswordResetOtp(email.trim());
        } catch (err: any) {
            setError(err.message || 'Failed to resend the code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await confirmPasswordResetOtp(email.trim(), otp.trim(), newPassword);
            setStep('done');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[rgb(19,54,102)]/95 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <div className="bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full relative border border-white/5 overflow-hidden my-8">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors z-20"><X size={20} /></button>
                <div className="p-10 space-y-6">
                    <div className="text-center">
                        <div className="inline-block bg-[rgb(59_130_246)] p-4 rounded-3xl mb-4 shadow-xl">
                            {step === 'done' ? <CheckCircle2 className="text-white" size={28} /> : step === 'otp' ? <KeyRound className="text-white" size={28} /> : <Mail className="text-white" size={28} />}
                        </div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">
                            {step === 'email' && 'Forgot Password'}
                            {step === 'otp' && 'Enter Your Code'}
                            {step === 'done' && 'Password Reset'}
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                            {step === 'email' && "We'll email you a 6-digit code"}
                            {step === 'otp' && `Code sent to ${email}`}
                            {step === 'done' && 'You can now sign in with your new password'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-900/30 border border-red-800/50 text-red-200 text-xs p-4 rounded-2xl flex items-start shadow-inner">
                            <AlertCircle size={16} className="mr-3 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 'email' && (
                        <form className="space-y-4" onSubmit={handleSendOtp}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(59_130_246)] transition-colors"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[rgb(59_130_246)] py-5 rounded-2xl font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Send Code'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form className="space-y-4" onSubmit={handleResetPassword}>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="6-digit code"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white text-center text-2xl tracking-[0.5em] outline-none focus:border-[rgb(59_130_246)] transition-colors"
                                required
                            />
                            <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(59_130_246)] transition-colors"
                                required
                                minLength={6}
                            />
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white outline-none focus:border-[rgb(59_130_246)] transition-colors"
                                required
                                minLength={6}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[rgb(59_130_246)] py-5 rounded-2xl font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={loading}
                                className="w-full text-center text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-colors"
                            >
                                Resend Code
                            </button>
                        </form>
                    )}

                    {step === 'done' && (
                        <button
                            onClick={onClose}
                            className="w-full bg-[rgb(59_130_246)] py-5 rounded-2xl font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
                        >
                            Back to Sign In
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
