import { User, Course, Recommendation, Challenge } from '../types';

/**
 * The "Next Steps Engine" for providing personalized recommendations.
 * This service analyzes the user's profile and suggests the most relevant next step.
 */

// Helper to check if a user has completed a given course
const hasCompletedCourse = (user: User, course: Course): boolean => {
    if (!user.sessionProgress) {
        return false;
    }
    const courseSessions = course.sessions;
    
    if (courseSessions.length === 0) {
        return false; // Cannot complete a course with no sessions
    }

    return courseSessions.every(session => user.sessionProgress![session.id] === 'completed');
};

export const getPersonalizedRecommendations = (user: User, courses: Course[], challenges: Challenge[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Priority 1: Baptism
    const wantsBaptism = user.nextSteps?.includes('Getting Baptized');
    if (wantsBaptism) {
        const baptismCourse = courses.find(c => c.pathId === 'next_steps'); // Assuming the baptism course is in this category
        if (baptismCourse && !hasCompletedCourse(user, baptismCourse)) {
            const firstSessionId = baptismCourse.sessions[0]?.id;
            if(firstSessionId) {
                recommendations.push({
                    id: 'rec_baptism',
                    type: 'course',
                    titleKey: 'recommendation.baptism.title',
                    reasonKey: 'recommendation.baptism.reason',
                    link: `/academy/${baptismCourse.id}/session/${firstSessionId}`,
                });
                return recommendations; // Return immediately as this is high priority
            }
        }
    }

    // Priority 2: Spiritual Habits for new members
    const isHomeChurchMember = user.isHomeChurch === "Yes, it's my home church!";
    if (isHomeChurchMember) {
        const habitsCourse = courses.find(c => c.pathId === 'habits');
        if (habitsCourse && !hasCompletedCourse(user, habitsCourse)) {
             const firstSessionId = habitsCourse.sessions[0]?.id;
            if(firstSessionId) {
                recommendations.push({
                    id: 'rec_habits',
                    type: 'course',
                    titleKey: 'recommendation.habits.title',
                    reasonKey: 'recommendation.habits.reason',
                    link: `/academy/${habitsCourse.id}/session/${firstSessionId}`,
                });
                return recommendations;
            }
        }
    }
    
    // Priority 3: Challenge Suggestion for Serving
    const wantsToServe = user.nextSteps?.includes('Joining a Team (Serving)');
    if (wantsToServe) {
        const encouragementChallenge = challenges.find(c => c.id === 'so_02'); // 7 Days of Encouragement
        const isChallengeActive = user.activeChallenges?.some(ac => ac.id === encouragementChallenge?.id);
        if (encouragementChallenge && !isChallengeActive) {
            recommendations.push({
                id: 'rec_challenge_serve',
                type: 'challenge',
                titleKey: 'recommendation.challenge.serve.title',
                reasonKey: 'recommendation.challenge.serve.reason',
                link: `/challenges/${encouragementChallenge.id}`,
            });
            return recommendations;
        }
    }

    return recommendations;
};