
import React, { useRef, useState } from 'react';
import { Certificate } from '../types';
import { X, Download, Share2, Award, CheckCircle, Loader2 } from 'lucide-react';

interface CertificateModalProps {
    certificate: Certificate;
    onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
    const certRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleDownload = async () => {
        if (!certRef.current || !window.html2canvas) return;
        setIsExporting(true);
        try {
            const canvas = await window.html2canvas(certRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#133666',
            });
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `HeyLife_Certificate_${certificate.courseTitle.replace(/\s+/g, '_')}.png`;
            link.href = url;
            link.click();
        } catch (e) {
            console.error(e);
        } finally {
            setIsExporting(false);
        }
    };

    const handleShare = async () => {
        if (!certRef.current || !window.html2canvas) return;
        setIsExporting(true);
        try {
            const canvas = await window.html2canvas(certRef.current, { scale: 2, useCORS: true });
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (blob && navigator.share) {
                const file = new File([blob], 'Certificate.png', { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'My Growth Achievement',
                    text: `I just completed the ${certificate.courseTitle} course on Hey Life!`
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
            <div className="max-w-2xl w-full">
                <div className="flex justify-end mb-4">
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                        <X size={24} />
                    </button>
                </div>

                {/* --- THE CERTIFICATE DESIGN --- */}
                <div 
                    ref={certRef}
                    className="relative bg-[#133666] aspect-[4/3] w-full rounded-xl overflow-hidden border-[12px] border-[#EF6D4D] shadow-2xl p-12 text-center flex flex-col items-center justify-between"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    
                    {/* Corner Ornaments */}
                    <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[rgb(251_191_36/0.4)]"></div>
                    <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[rgb(251_191_36/0.4)]"></div>
                    <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-[rgb(251_191_36/0.4)]"></div>
                    <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[rgb(251_191_36/0.4)]"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-center mb-2">
                             <div className="bg-[rgb(251_191_36)] p-4 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                                <Award size={48} className="text-[rgb(19_54_102)]" />
                             </div>
                        </div>
                        
                        <h1 className="text-[rgb(251_191_36)] font-black uppercase tracking-[0.3em] text-sm">Certificate of Completion</h1>
                        
                        <div className="space-y-2">
                            <p className="text-white/60 text-xs italic uppercase">This is to certify that</p>
                            <h2 className="text-4xl font-black text-white italic tracking-tight">{certificate.userName}</h2>
                        </div>

                        <div className="w-48 h-[1px] bg-white/20 mx-auto"></div>

                        <div className="space-y-3">
                            <p className="text-white/60 text-xs italic uppercase">Has successfully completed the course</p>
                            <h3 className="text-2xl font-black uppercase text-[#EF6D4D] leading-none tracking-tighter">{certificate.courseTitle}</h3>
                            <p className="text-[10px] font-bold text-[rgb(59_130_246)] uppercase tracking-widest">{certificate.pathId.replace('_', ' ')} Path</p>
                        </div>
                    </div>

                    <div className="relative z-10 w-full flex justify-between items-end pt-8">
                        <div className="text-left">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Issued On</p>
                            <p className="text-xs font-bold text-white">{new Date(certificate.dateIssued).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full border-2 !border-[rgb(251_191_36/0.3)] flex items-center justify-center opacity-40">
                                <CheckCircle size={32} className="text-[rgb(251_191_36)]" />
                            </div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em] mt-2">HEY LIFE</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Validated By</p>
                            <p className="text-xs font-bold text-white italic">Victor's Assistant</p>
                        </div>
                    </div>
                </div>

                {/* --- ACTIONS --- */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleDownload}
                        disabled={isExporting}
                        className="bg-white text-[rgb(19_54_102)] font-black py-4 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
                    >
                        {isExporting ? <Loader2 className="animate-spin mr-2" /> : <Download size={20} className="mr-2" />}
                        SAVE TO GALLERY
                    </button>
                    <button 
                        onClick={handleShare}
                        disabled={isExporting}
                        className="bg-[#EF6D4D] text-white font-black py-4 rounded-2xl flex items-center justify-center hover:brightness-110 transition-all active:scale-95"
                    >
                        {isExporting ? <Loader2 className="animate-spin mr-2" /> : <Share2 size={20} className="mr-2" />}
                        SHARE STORY
                    </button>
                </div>
                <p className="text-center text-gray-500 text-xs mt-6 uppercase font-black tracking-widest">Well done! Your faith is showing fruit.</p>
            </div>
        </div>
    );
};
