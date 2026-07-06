
import { Timestamp } from 'firebase/firestore';

export interface QuizQuestion {
    id: string;
    question: string;
    type?: 'multiple-choice' | 'text';
    options: string[];
    correctAnswerIndices: number[];
    explanation?: string;
    order: number;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  userEmail: string;
  dateIssued: string;
  pathId: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  dateEarned: string;
}

export interface LeaderboardUser extends User {
  rank: number;
}

export interface ResourceLink {
    id: string;
    title: string;
    url: string;
    type: 'link' | 'pdf' | 'music' | 'video';
}

export interface GroupMessage {
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: string | Timestamp;
    content: string;
    type?: 'message' | 'announcement'; 
}

export interface HeyFam {
    id: string;
    name: string;
    description: string;
    avatar: string;
    leaderId: string;
    memberIds: string[];
    meetingTime?: string;
    meetingLocation?: string;
    messages: GroupMessage[];
    resources: ResourceLink[];
    memberCount?: number; 
}

export interface Exercise {
    name: string;
    sets: number;
    reps: string;
    weight: string;
    rest: string;
}

export interface WorkoutDay {
    day: number;
    title: string;
    exercises: Exercise[];
}

export interface WorkoutWeek {
    week: number;
    days: WorkoutDay[];
}

export interface WorkoutPlan {
    title: string;
    duration: number; 
    weeks: WorkoutWeek[];
}

export interface WorkoutLog {
    id: string;
    userId: string;
    date: string;
    dayNumber: number;
    weekNumber: number;
    difficulty: 'Too Easy' | 'Just Right' | 'Too Hard';
    comments?: string;
}

export interface CoachInsight {
    message: string; 
    generatedAt: string;
    insightType: 'celebration' | 'correction' | 'motivation';
    analysis?: {          // make it optional if sometimes missing
        whatWentWell: string;
        whatToObserve: string;
        whatToChange: string;
    };
}

export interface ActiveChallenge {
    id: string;
    title: string;
    duration: number;
    startDate: string;
    completedDays: number;
}

export interface AppNotification {
    id: string;
    userId: string;
    type: 'challenge_invitation' | 'group_challenge_suggestion' | 'generic' | 'lesson_invitation' | 'course_invitation' | 'group_invitation';
    text: string;
    relatedId: string; 
    isRead: boolean;
    createdAt: string | Timestamp;
}

export type AcademyPathId = 'church_home' | 'foundation' | 'next_steps' | 'habits' | 'self_leadership' | 'theology' | 'worldview' | 'deep_dive' | 'hey_shots';

export interface LatestMessage {
    title: string;
    videoId: string;
    thumbnail?: string; 
}

export interface SpiritSnack {
    id: string;
    season: 'General' | 'Easter' | 'Christmas' | 'Pentecost';
    titleKey: string;
    reference: string;
    verseKey: string; 
    prayerKey: string;
}

export interface AssessmentResult {
    date: string;
    scores: { [category: string]: number }; 
    feedback: string;
    lowestCategory: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  points: number;
  certificates: Certificate[];
  role: 'user' | 'leader' | 'admin';
  onboarded: boolean;
  joinDate: string;
  lastActiveAt?: string;
  language?: 'English' | 'German';
  isHomeChurch?: string;
  contactSource?: string;
  nextSteps?: string[];
  serviceNeeds?: string[];
  favoriteVerse?: string;
  lookingFor?: string[];
  badges?: Badge[];
  prayerCount?: number;
  challengesCompleted?: number;
  activeChallenges?: ActiveChallenge[];
  heyFamIds?: string[];
  firebaseUid?: string;
  deleted?: boolean;
  deletedAt?: string | Timestamp | null;
  onboardingAnswers?: {
    goal: string;
    experience: string;
    frequency: number;
    duration: number;
    equipment: string[];
    oneRepMax: { squat: number, deadlift: number, bench: number };
    injuries: string;
  };
  age?: number;
  height?: number; 
  weight?: number; 
  workoutPlan?: WorkoutPlan;
  workoutPlanStartDate?: string;
  completedWorkouts?: number;
  coachInsight?: CoachInsight;
  sessionProgress?: { [sessionId: string]: 'completed' | 'in-progress' };
  monthlyReflection?: MonthlyReflection;
  journalStreak?: number;
  lastJournalDate?: string;
  assessmentResults?: AssessmentResult[];
  acceptedTerms?: boolean;
  acceptedJournalTerms?: boolean;
  allowTracking?: boolean;
  pushNotificationsEnabled?: boolean;
  fcmTokens?: string[];
}

export interface JournalEntry {
    id: string;
    userId: string;
    date: string; 
    mood: number; 
    promptId: string;
    promptText: string;
    content: string;
    tags?: string[];
}

export interface MonthlyReflection {
    month: string;
    content: string;
    generatedAt: string;
}

export interface PostUser {
    id: string;
    name: string;
    avatar: string;
}

export interface Comment {
    user: PostUser;
    text: string;
}

export interface Post {
  id: string;
  user: PostUser;
  timestamp: string | Timestamp;
  content: string;
  imageUrl?: string;
  amens: number;
  comments: Comment[];
  reactions?: { [emoji: string]: number };
  userReactions?: { [userId: string]: { [emoji: string]: boolean } };
}

export interface Course {
  id: string;
  pathId: string;
  title: string;
  description: string;
  thumbnail: string;
  youtubePlaylistId?: string;
  order: number;
  isPublished: boolean;
  sessions: Session[];
}

export interface Session {
  id: string;
  title: string;
  videoId: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  bibleVerses?: { reference: string, text: string }[];
  reflectionQuestions: string[];
  quizQuestions?: QuizQuestion[];
  keyTakeaways?: string[];
  caseStudy?: { scenario: string; question: string; };
  practiceChallenge?: { title: string; description: string; duration: number; points: number; };
  downloadUrl?: string;
  visualNoteUrl?: string;
  isHeyShot?: boolean;
  tags?: string[];
  order: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  why: string; 
  category: string;
  duration: number;
  points: number;
  participantIds?: string[];
  messages?: ChallengeMessage[];
}

export interface LearningGroup {
    id: string;
    name: string;
    leaderId: string;
    memberIds: string[];
    content: any[];
    messages: GroupMessage[];
}

export interface Submission {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    lessonTitle: string;
    courseId: string;
    sessionId: string;
    content: { [key: string]: string };
    submittedAt: string;
    status: 'pending' | 'reviewed';
    feedback?: string;
    bonusPoints?: number;
}

export interface PrayerRequest {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    requestText: string;
    isAnonymous: boolean;
    timestamp: string | Timestamp;
    prayerCount: number;
    prayedBy: string[];
}

export interface Recommendation {
    id: string;
    type: 'course' | 'challenge';
    titleKey: string;
    reasonKey: string;
    link: string;
}

export interface GlobalContent {
    latestMessage?: { title: string; videoId: string; thumbnail?: string; };
    donation?: { paypalLink?: string; qrCodeUrl?: string; };
    paypalClientId?: string;
}

export interface ChallengeMessage {
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: string | Timestamp;
    content: string;
}
