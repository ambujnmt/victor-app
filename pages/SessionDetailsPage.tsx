
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Submission, Session, Course, QuizQuestion, Certificate } from '../types';
import { useAuth } from '../App';
import { getCourses, addSubmission, updateUserData } from '../services/firebaseService';
import { BrainCircuit, CheckCircle, Sparkles, Send, UserPlus, BookOpen, FileText, Download, Edit3, Image as ImageIcon, ExternalLink, Book, HelpCircle, ArrowRight, Check, X, Trophy, Lightbulb } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import InviteFriendModal from '../components/InviteFriendModal';
import { CertificateModal } from '../components/CertificateModal';

const TextQuestionCard: React.FC<{
    question: QuizQuestion;
    onAnswer: (content: string) => void;
}> = ({ question, onAnswer }) => {
    if (question.type !== 'text') return null;
    const [text, setText] = useState('');

    const handleChange = (val: string) => {
        setText(val);
        onAnswer(val);
    };

    return (
        <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-5 mb-6 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-white flex items-start">
                    <Edit3 size={18} className="mr-2 mt-1 text-hey-church-blue flex-shrink-0" />
                    {question.question}
                </h4>
            </div>
            <textarea 
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white h-32 focus:ring-2 focus:ring-hey-church-blue focus:outline-none placeholder-gray-600 text-sm"
                placeholder="Write your answer here..."
                value={text}
                onChange={(e) => handleChange(e.target.value)}
            />
            {question.explanation && (
                <div className="mt-5 bg-gradient-to-r from-hey-church-orange-900/30 to-hey-church-yellow/10 border border-hey-church-yellow/20 rounded-xl p-4 animate-in fade-in zoom-in duration-500">
                    <p className="text-[10px] font-black text-[rgb(251_191_36)] uppercase tracking-widest flex items-center mb-2">
                        <Lightbulb size={12} className="mr-1.5" /> RECAP & INSIGHT
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed italic font-serif">
                        "{question.explanation}"
                    </p>
                </div>
            )}
        </div>
    );
};
const QuizCard: React.FC<{ 
    question: QuizQuestion; 
    onAnswer: (correct: boolean, selected: number[]) => void;
}> = ({ question, onAnswer }) => {
    if (question.type !== 'multiple-choice') return null;
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isRight, setIsRight] = useState(false);

    // Multi-select comparison
    const checkIsCorrect = (currentSelection: number[]) => {
        const correctOnes = question.correctAnswerIndices || [];
        if (currentSelection.length !== correctOnes.length) return false;
        return correctOnes.every(idx => currentSelection.includes(idx));
    };
    

    const handleSelect = (idx: number) => {
    if (isRight) return;

    let updatedSelection = [...selectedIndices];

    if (question.correctAnswerIndices.length > 1) {
        if (updatedSelection.includes(idx)) {
            updatedSelection = updatedSelection.filter(i => i !== idx);
        } else {
            updatedSelection.push(idx);
        }
    } else {
        updatedSelection = [idx];
    }

    setSelectedIndices(updatedSelection);

    const isCorrect = checkIsCorrect(updatedSelection);

    if (isCorrect) {
        setIsRight(true);
        onAnswer(true, updatedSelection);
    } else {
        onAnswer(false, updatedSelection);
    }
    };
    

    return (
        <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-5 mb-6 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-white flex items-start">
                    <HelpCircle size={18} className="mr-2 mt-1 text-[rgb(59_130_246)] flex-shrink-0" />
                    {question.question}
                </h4>
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">
                {question.correctAnswerIndices?.length > 1 ? 'Select all that apply' : 'Select one answer'}
            </p>
            <div className="space-y-3">
                {question.options.map((opt, i) => {
                    const isSelected = selectedIndices.includes(i);
                    const isActuallyCorrect = question.correctAnswerIndices?.includes(i);
                    
                    let style = "bg-gray-700/50 border-gray-600 text-gray-300";
                    if (isSelected) {
                        if (isActuallyCorrect) {
                            style = "bg-green-500/20 border-green-500 text-white"; 
                        } else {
                            style = "bg-red-500/20 border-red-500 text-white";
                        }
                    }
                    return (
                        <button 
                            key={i}
                            onClick={() => handleSelect(i)}
                            disabled={isRight}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${style}`}
                        >
                            <span className="text-sm font-medium">{opt}</span>
                            {isRight && isActuallyCorrect && <Check size={18} className="text-green-500" />}
                        </button>
                    );
                })}
            </div>
            {isRight && question.explanation && (
                <div className="mt-5 bg-gradient-to-r from-[#2E1C17]/30  to-[rgb(251_191_36/0.1)] border border-[rgb(251_191_36/0.2)] rounded-xl p-4 animate-in fade-in zoom-in duration-500">
                    <p className="text-[10px] font-black text-[rgb(251_191_36)] uppercase tracking-widest flex items-center mb-2">
                        <Lightbulb size={12} className="mr-1.5" /> RECAP & INSIGHT
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed italic font-serif">
                        "{question.explanation}"
                    </p>
                </div>
            )}
        </div>
    );
};

const SessionDetailsPage: React.FC = () => {
  const { courseId, sessionId } = useParams<{ courseId: string, sessionId: string }>();
  const { user } = useAuth();

   const navigate = useNavigate(); 
    const location = useLocation();

    const handleBack = () => {
        const lastCourse = sessionStorage.getItem('lastCourse');
        const lastPath = sessionStorage.getItem('lastPath');

        if (lastCourse && lastPath) {
            // wapas Academy pe jao aur state restore karo
            navigate('/academy', {
                state: {
                    restorePath: lastPath,
                    restoreCourse: lastCourse
                }
            });
        } else {
            navigate('/academy');
        }
    };
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [quizStatus, setQuizStatus] = useState<{ [key: string]: boolean }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'study' | 'reflect' | 'resources'>('study');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [newCertificate, setNewCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!courseId || !sessionId) return;
      const allCourses = await getCourses();
      const currentCourse = allCourses.find(c => c.id === courseId);
      if (currentCourse) {
        setCourse(currentCourse);
        const currentSession = currentCourse.sessions.find(s => s.id === sessionId);
        setSession(currentSession || null);
        
        if (user?.sessionProgress?.[sessionId] === 'completed') {
            setIsCompleted(true);
        }

        if (currentSession && (!currentSession.keyTakeaways || currentSession.keyTakeaways.length === 0)) {
            setActiveTab('reflect');
        }
      }
    };
    fetchContent();
  }, [courseId, sessionId, user]);

  useEffect(() => {
    console.log("QUIZ STATUS:", quizStatus);
}, [quizStatus]);

 const allQuizCorrect = useMemo(() => {
    if (!session?.quizQuestions || session.quizQuestions.length === 0) return true;

    return session.quizQuestions.every(q => {
        if (q.type === 'text') {
            return quizStatus[q.id] === true;
        }

        if (q.type === 'multiple-choice') {
            return quizStatus[q.id] === true;
        }

        return true;
    });
}, [session, quizStatus]);

  const handleSubmit = async () => {
    console.log("ANSWERS:", answers);
    if (!user || !session || !courseId || !sessionId || !course) return;

    const submission: Omit<Submission, 'id'> = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      lessonTitle: session.title,
      courseId,
      sessionId,
      content: answers,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    if (session.quizQuestions.length > 0 || Object.keys(answers).length > 0) {
    try {
        await addSubmission(submission);
        console.log("Submission saved");
    } catch (err) {
        console.error("Submission error:", err);
    }
}

    // Update Progress
    const updatedProgress = { ...user.sessionProgress, [sessionId]: 'completed' as const };
    const pointsToAdd = 100;

    // Check for course completion
    const isLastSession = course.sessions.every(s => 
        s.id === sessionId || updatedProgress[s.id] === 'completed'
    );

    let certData: Certificate | null = null;
    if (isLastSession && !user.certificates.some(c => c.courseId === courseId)) {
        certData = {
            id: `cert_${Date.now()}`,
            courseId: course.id,
            courseTitle: course.title,
            userName: user.name,
            userEmail: user.email,
            dateIssued: new Date().toISOString(),
            pathId: course.pathId
        };
    }

    await updateUserData(user.id, {
        sessionProgress: updatedProgress,
        points: (user.points || 0) + pointsToAdd,
        ...(certData ? { certificates: [...(user.certificates || []), certData] } : {})
    });

    setIsCompleted(true);
    
    if (certData) {
        setNewCertificate(certData);
        setShowCertificate(true);
    }
  };

  if (!session || !course) return <div className="p-4 text-white">Loading...</div>;

  return (
    <>
    <div className="p-4 bg-[rgb(19,54,102)] min-h-screen text-white flex flex-col pb-20">
      <div className="flex justify-between items-start mb-4">
          <button 
                onClick={handleBack}
                className="text-[rgb(255_152_43)] font-bold flex items-center"
            >
                &larr; Back
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center bg-[rgb(59_130_246/0.2)] text-[rgb(59_130_246)] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[rgb(59_130_246/0.4)] transition-colors"
          >
              <UserPlus size={14} className="mr-1.5" /> Invite Friend
          </button>
      </div>
      
      <h1 className="text-2xl font-extrabold uppercase mb-1">{session.title}</h1>
      <p className="text-gray-400 text-sm mb-4">{course.title}</p>

      {/* Video */}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800 mb-2">
          <div className="aspect-video">
              <iframe 
                  src={`https://www.youtube.com/embed/${session.videoId}?rel=0&modestbranding=1&playsinline=1`}
                  className="w-full h-full"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
              ></iframe>
          </div>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-gray-800 p-1 rounded-lg mb-4">
          <button onClick={() => setActiveTab('study')} className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${activeTab === 'study' ? 'bg-[rgb(59_130_246)] text-white' : 'text-gray-400'}`}>Study</button>
          <button onClick={() => setActiveTab('reflect')} className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${activeTab === 'reflect' ? 'bg-[rgb(59_130_246)] text-white' : 'text-gray-400'}`}>Reflect</button>
          {session.downloadUrl && <button onClick={() => setActiveTab('resources')} className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${activeTab === 'resources' ? 'bg-[rgb(59_130_246)] text-white' : 'text-gray-400'}`}>Resources</button>}
      </div>

      {/* Content */}
      <div className="space-y-4">
          {activeTab === 'study' && (
              <div className="space-y-4 animate-in fade-in">
                  {session.keyTakeaways && session.keyTakeaways.length > 0 && (
                      <div className="bg-gray-800 p-5 rounded-2xl border-l-4 border-[rgb(251_191_36)] shadow-lg">
                          <h3 className="font-black text-xs uppercase tracking-widest mb-3 text-[rgb(251_191_36)]">Key Takeaways</h3>
                          <ul className="space-y-3">
                              {session.keyTakeaways.map((k, i) => (
                                  <li key={i} className="flex items-start text-gray-200 text-sm">
                                      <CheckCircle size={14} className="mr-2 mt-1 text-[rgb(16_185_129)] flex-shrink-0" />
                                      {k}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
                  {session.caseStudy && (
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-2xl border border-white/5 shadow-xl">
                          <h3 className="font-bold mb-3 flex items-center text-[rgb(59_130_246)] uppercase text-xs tracking-widest"><BrainCircuit size={16} className="mr-2"/> Case Study</h3>
                          <p className="text-sm text-gray-300 italic mb-4 p-4 bg-black/20 rounded-xl leading-relaxed border border-white/5">"{session.caseStudy.scenario}"</p>
                          <p className="text-sm font-black text-white leading-tight mb-4">{session.caseStudy.question}</p>
                          <textarea 
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white h-28 focus:ring-2 focus:ring-[rgb(59_130_246)] focus:outline-none placeholder-gray-600 text-sm"
                              placeholder="Write your response here..."
                              onChange={(e) => setAnswers(prev => ({
                                ...prev,
                                caseStudy: {
                                    type: "case-study",
                                    answer: e.target.value
                                    }
                                }))}
                          />
                      </div>
                  )}
                  <button onClick={() => setActiveTab('reflect')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      GO TO REFLECTION <ArrowRight size={18} className="ml-2" />
                  </button>
              </div>
          )}

          {activeTab === 'reflect' && (
              <div className="space-y-6 animate-in fade-in">
                  {/* Bible Verses */}
                  {session.bibleVerses && session.bibleVerses.length > 0 && (
                      <div className="bg-gray-800/40 rounded-2xl p-5 border border-white/5 shadow-md">
                          <h3 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center text-[rgb(251_191_36)]">
                              <Book className="mr-2" size={16}/> Scripture Reading
                          </h3>
                          <div className="space-y-4">
                              {session.bibleVerses.map((verse, idx) => (
                                  <div key={idx} className="bg-black/20 p-4 rounded-xl border border-white/5">
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="font-bold text-[#FFB86C] text-sm">{verse.reference}</span>
                                          <a 
                                            href={`https://www.bible.com/bible/111/${verse.reference.replace(/\s/g, '+')}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[10px] text-gray-500 hover:text-white flex items-center uppercase font-black tracking-tighter"
                                          >
                                              Open in Bible App <ExternalLink size={10} className="ml-1"/>
                                          </a>
                                      </div>
                                      {verse.text ? (
                                          <p className="text-gray-300 text-sm italic leading-relaxed">"{verse.text}"</p>
                                      ) : (
                                          <p className="text-xs text-gray-500 text-center py-2 border border-dashed border-gray-700 rounded-lg">Tap "Open" to read the full passage</p>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* Multiple Choice + Text Questions */}
                    {session.quizQuestions && session.quizQuestions.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-black text-xs uppercase tracking-widest mb-4 text-[rgb(59_130_246)] px-2">
                                Knowledge Check
                            </h3>

                            {session.quizQuestions.map((q) => {

                                if (q.type === 'text') {
                                    return (
                                        <TextQuestionCard
                                            key={q.id}
                                            question={q}
                                            onAnswer={(val) => {
                                                const isFilled = val.trim().length > 0;

                                                setQuizStatus(prev => ({
                                                    ...prev,
                                                    [q.id]: isFilled
                                                }));

                                                setAnswers(prev => ({
                                                ...prev,
                                                [q.id]: {
                                                    questionId: q.id,
                                                    type: 'text',
                                                    question: q.question,
                                                    answer: [val]
                                                }
                                                }));
                                            }}
                                        />
                                    );
                                }

                                if (q.type === 'multiple-choice') {
                                    return (
                                        <QuizCard
                                            key={q.id}
                                            question={q}
                                            onAnswer={(correct, selected) => {
                                                setQuizStatus(prev => ({
                                                    ...prev,
                                                    [q.id]: correct
                                                }));

                                               setAnswers(prev => ({
                                                ...prev,
                                                [q.id]: {
                                                    questionId: q.id,
                                                    type: 'multiple-choice',
                                                    question: q.question,
                                                    answer: selected.map(i => q.options[i])
                                                }
                                                }));
                                        }}
                                        />
                                    );
                                }

                                return null;
                            })}
                        </div>
                    )}

                  {/* Open Reflection Questions */}
                  {session.reflectionQuestions.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-black text-xs uppercase tracking-widest mb-4 text-[rgb(255_117_93)] px-2">Heart Reflection</h3>
                        {session.reflectionQuestions.map((q, i) => (
                            <div key={i} className="bg-gray-800/30 p-5 rounded-2xl border border-white/5">
                                <label className="block text-sm font-bold text-white mb-3">
                                    {q}
                                </label>
                                <textarea 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white h-24 focus:ring-2 focus:ring-[rgb(255_117_93)] focus:outline-none placeholder-gray-600 text-sm"
                                    placeholder="Your thoughts..."
                                    onChange={(e) => setAnswers(prev => ({
                                    ...prev,
                                    [`q${i}`]: e.target.value
                                    }))}
                                />
                            </div>
                        ))}
                    </div>
                  )}

                  <div className="pt-4">
                      {isCompleted ? (
                          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-6 text-center animate-in zoom-in">
                              <Trophy size={48} className="mx-auto text-[rgb(251_191_36)] mb-3" />
                              <h3 className="text-xl font-bold text-white mb-1">Session Complete!</h3>
                              <p className="text-sm text-green-300">You've earned 100 points. Keep going!</p>
                              <button onClick={() => navigate('/academy')} className="mt-6 w-full py-4 bg-white text-gray-900 font-bold rounded-xl active:scale-95 transition-transform">
                                NEXT LESSON
                              </button>
                          </div>
                      ) : (
                          <button 
                              onClick={handleSubmit} 
                              disabled={!allQuizCorrect}
                              className="w-full bg-[rgb(255_117_93)] py-5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(239,109,77,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                          >
                              {allQuizCorrect ? 'COMPLETE SESSION' : 'FINISH QUIZ TO COMPLETE'}
                          </button>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'resources' && session.downloadUrl && (
              <a href={session.downloadUrl} target="_blank" rel="noreferrer" className="flex items-center bg-gray-800 p-5 rounded-2xl border border-white/5 hover:bg-gray-700 transition shadow-xl group">
                  <div className="p-3 bg-red-500/20 rounded-xl mr-4 group-hover:bg-red-500/40 transition-colors">
                    <FileText className="text-red-400"/>
                  </div>
                  <div className="flex-grow">
                      <p className="font-bold text-white">Download Session PDF</p>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Handouts & Notes</p>
                  </div>
                  <Download size={20} className="text-gray-500" />
              </a>
          )}
      </div>
    </div>
    
    {showInviteModal && user && (
        <InviteFriendModal
            target={{
                id: session.id,
                title: session.title,
                type: 'lesson',
                data: session,
                courseId: course.id
            }}
            user={user}
            onClose={() => setShowInviteModal(false)}
        />
    )}

    {showCertificate && newCertificate && (
        <CertificateModal 
            certificate={newCertificate} 
            onClose={() => setShowCertificate(false)} 
        />
    )}
    </>
  );
};

export default SessionDetailsPage;
