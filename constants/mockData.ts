
import { User, Course, Challenge, Post, HeyFam, LearningGroup, Submission, Session } from '../types';

export const MOCK_ADMIN_USER: User = {
  id: 'mock_admin_user_01',
  name: 'Demo Admin',
  email: 'admin@heychurch.de',
  avatar: 'https://i.pravatar.cc/150?u=admin@heychurch.de',
  points: 2550,
  certificates: [
    {
      id: 'mock_cert_01',
      courseId: 'course_rooted',
      courseTitle: 'Foundations of Faith',
      userName: 'Demo Admin',
      dateIssued: 'Jun 15, 2024',
      pathId: 'foundation'
    },
  ],
  role: 'admin',
  onboarded: true,
  joinDate: new Date('2024-01-01').toISOString(),
  favoriteVerse: 'Philippians 4:13',
  heyFamIds: ['hey_fam_01'],
  sessionProgress: {
      's1_rooted_identity': 'completed'
  },
  activeChallenges: [{
    id: 'so_02',
    title: 'challenge.so_02.title',
    duration: 7,
    startDate: new Date().toISOString(),
    completedDays: 3,
  }]
};

export const MOCK_USERS: User[] = [
    MOCK_ADMIN_USER,
    {
        id: 'mock_user_02',
        name: 'Jane Doe',
        email: 'jane@example.com',
        avatar: 'https://i.pravatar.cc/150?u=jane@example.com',
        points: 1200,
        certificates: [],
        role: 'user',
        onboarded: true,
        joinDate: new Date('2024-03-10').toISOString(),
    }
];

export const MOCK_HEYFAMS: HeyFam[] = [
    {
        id: 'hey_fam_01',
        name: 'Downtown Morning Crew',
        description: 'We meet for coffee, prayer, and a quick study before work. A great way to start your day centered on God.',
        memberCount: 8,
        memberIds: ['mock_admin_user_01', 'mock_user_02'],
        leaderId: 'mock_admin_user_01',
        avatar: 'https://picsum.photos/seed/fam1/200',
        meetingTime: 'Tuesdays @ 7:00 AM',
        meetingLocation: 'Starbucks, Main St.',
        messages: [
             { userId: 'mock_admin_user_01', userName: 'Demo Admin', userAvatar: MOCK_ADMIN_USER.avatar, timestamp: new Date().toISOString(), content: "Can't wait for tomorrow! Reading chapter 3.", type: 'message' },
             { userId: 'mock_admin_user_01', userName: 'Demo Admin', userAvatar: MOCK_ADMIN_USER.avatar, timestamp: new Date().toISOString(), content: "REMINDER: We are meeting at the uptown Starbucks this week!", type: 'announcement' }
        ],
        resources: [
            { id: 'res_01', title: 'Discussion Guide PDF', url: 'https://example.com/guide.pdf', type: 'pdf' },
            { id: 'res_02', title: 'Worship Playlist', url: 'https://spotify.com', type: 'music' }
        ]
    },
    {
        id: 'hey_fam_02',
        name: 'Campus Students',
        description: 'For all university students. Pizza, hanging out, and real talk about faith.',
        memberCount: 12,
        memberIds: [],
        leaderId: 'mock_user_02',
        avatar: 'https://picsum.photos/seed/fam2/200',
        meetingTime: 'Wednesdays @ 7:00 PM',
        meetingLocation: 'Student Center',
        messages: [],
        resources: []
    }
];

export const MOCK_POSTS: Post[] = [
    {
        id: 'post_01',
        user: { id: 'mock_user_02', name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?u=jane@example.com' },
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        content: "Feeling so blessed after the service today! Philippians 4:13 has been on my heart all week.",
        amens: 15,
        comments: [
            { user: { id: 'mock_admin_user_01', name: 'Demo Admin', avatar: MOCK_ADMIN_USER.avatar }, text: 'Amen! So good.' }
        ]
    }
];

export const MOCK_LEARNING_GROUPS: LearningGroup[] = [
    {
        id: 'group_01',
        name: 'Foundation Group Alpha',
        leaderId: 'mock_admin_user_01',
        memberIds: ['mock_admin_user_01', 'mock_user_02'],
        content: [
            { type: 'internal', title: 'Gott Kennen Lernen', courseId: 'course_rooted', sessionId: 'rooted_s1' }
        ],
        messages: [
            { userId: 'mock_admin_user_01', userName: 'Demo Admin', userAvatar: MOCK_ADMIN_USER.avatar, timestamp: new Date().toISOString(), content: "Welcome everyone! Let's start with the first lesson." }
        ]
    }
];

export const MOCK_SUBMISSIONS: Submission[] = [];

// --- COURSE GENERATION ---

// Helper to create sessions quickly
const createSession = (
    id: string, 
    title: string, 
    badge: string, 
    keyTakeaways: string[], 
    questions: string[], 
    caseStudyPrompt?: string, 
    caseStudyQuestion?: string,
    challengeTitle?: string,
    challengeDesc?: string
): Session => ({
  id,
  title,
  videoId: 'M7lc1UVf-VE', // Placeholder video
  keyTakeaways,
  reflectionQuestions: questions,
  caseStudy: caseStudyPrompt ? {
    scenario: caseStudyPrompt,
    question: caseStudyQuestion || "Wie würdest du reagieren?"
  } : undefined,
  practiceChallenge: challengeTitle ? {
    title: challengeTitle,
    description: challengeDesc || "Setze das Gelernte diese Woche um.",
    duration: 7,
    points: 100
  } : undefined
});

export const MOCK_COURSES: Course[] = [
    // --- HEY SHOTS (REEL EXAMPLES) ---
    {
        id: 'course_shots',
        title: 'Hey Shots Feed',
        description: 'Short answers to big questions.',
        pathId: 'hey_shots',
        thumbnail: '',
        order: 1,
        isPublished: true,
        sessions: [
            {
                id: 'shot_1',
                title: 'What about Christianity and Yoga?',
                videoId: 'dQw4w9WgXcQ', // Placeholder
                thumbnail: 'https://images.unsplash.com/photo-1599447332720-dcef1b295d4d?q=80&w=600&auto=format&fit=crop',
                reflectionQuestions: [],
                isHeyShot: true,
                tags: ['Yoga', 'Angst', 'Lifestyle']
            },
            {
                id: 'shot_2',
                title: 'Is there just one Partner for you?',
                videoId: 'dQw4w9WgXcQ',
                thumbnail: 'https://images.unsplash.com/photo-1621451917078-c0fa5c268d05?auto=format&fit=crop&q=80&w=720&h=1280',
                reflectionQuestions: [],
                isHeyShot: true,
                tags: ['Partner', 'Sex', 'Liebe']
            },
            {
                id: 'shot_3',
                title: 'How do I find Mr. or Mrs. Right?',
                videoId: 'dQw4w9WgXcQ',
                thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&q=80&w=720&h=1280',
                reflectionQuestions: [],
                isHeyShot: true,
                tags: ['Partner', 'Relationships']
            },
            {
                id: 'shot_4',
                title: 'Can I lose my salvation?',
                videoId: 'dQw4w9WgXcQ',
                thumbnail: 'https://images.unsplash.com/photo-1507692049790-de58293a4697?auto=format&fit=crop&q=80&w=720&h=1280',
                reflectionQuestions: [],
                isHeyShot: true,
                tags: ['Angst', 'Faith']
            },
            {
                id: 'shot_5',
                title: 'Why does God allow suffering?',
                videoId: 'dQw4w9WgXcQ',
                thumbnail: 'https://images.unsplash.com/photo-1454789476662-bdd7104d2d35?auto=format&fit=crop&q=80&w=720&h=1280',
                reflectionQuestions: [],
                isHeyShot: true,
                tags: ['Depression', 'Angst']
            }
        ]
    },

    // --- ROOTED ---
    {
        id: 'course_rooted',
        title: 'ROOTED',
        description: 'Verwurzelt in Gott: Lerne Gott, Jesus und deine Identität kennen.',
        pathId: 'foundation',
        thumbnail: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800',
        order: 1,
        isPublished: true,
        sessions: [
            createSession(
                'rooted_s1',
                'GOTT KENNEN LERNEN — Das Herz des Vaters',
                '🌱',
                [
                    'Gott ist nicht der Gott unserer Angst, sondern der Bibel.',
                    'Gott ist barmherzig, gnädig, geduldig und treu (2. Mose 34,6).',
                    'Gott ist Liebe (1. Johannes 4,16).'
                ],
                [
                    'Was sagt diese Bibelstelle (2. Mose 34,6) über Gottes Charakter?',
                    'Wie würdest du jemand anderem erklären, wie Gott ist?',
                    'Welches deiner falschen Gottesbilder wird heute korrigiert?',
                    'Wie kannst du diese Woche aus Gottes Liebe heraus leben?'
                ],
                'Anna ist Christin, aber jedes Mal, wenn sie betet, fühlt sie sich schuldig. Sie sagt: "Ich weiß, dass Gott ist Liebe ist, aber ich spüre eher, dass er enttäuscht von mir ist."',
                'Welche Bibelstelle aus dieser Session könnte Anna helfen – und warum?',
                'Wahrheit aussprechen',
                'Sprich jeden Morgen laut eine Wahrheit über Gott aus einer der Bibelstellen aus (z.B. "Gott ist geduldig").'
            ),
            createSession(
                'rooted_s2',
                'JESUS – DIE ERRETUNG GOTTES',
                '✝️',
                [
                    'Jesus ist Gott, der Mensch wurde, um uns zu retten.',
                    'Er kam nicht zu verurteilen, sondern zu retten (Johannes 3,17).',
                    'Er trug unsere Schuld, damit wir gerecht werden (2. Korinther 5,21).'
                ],
                [
                    'Was sagt jeder dieser Verse über Jesu Mission aus?',
                    'Warum starb Jesus laut der Bibel?',
                    'Welche Wahrheit über Jesu Liebe berührt dich am meisten?',
                    'Was bedeutet es heute konkret, Jesus als Retter anzunehmen?'
                ],
                'Samuel will ein guter Christ sein, aber er glaubt, Gott liebt ihn nur, wenn er perfekt lebt.',
                'Welche dieser Bibelstellen zeigt Samuel, dass Errettung Gnade ist – nicht Leistung?',
                'Danke Jesus',
                'Lies jeden Tag Johannes 3,16 und danke Jesus laut für seine Liebe.'
            ),
            createSession(
                'rooted_s3',
                'DEINE NEUE IDENTITÄT – Wer du in Christus bist',
                '🆔',
                [
                    'In Christus bist du eine neue Schöpfung (2. Korinther 5,17).',
                    'Identität ist das, what Gott über dich sagt, nicht deine Leistung.',
                    'Du bist Kind Gottes und alle Schuld ist vergeben.'
                ],
                [
                    'Was sagen diese vier Verse über deine Identität?',
                    'Wie würdest du einem Freund erklären, was „neue Schöpfung“ bedeutet?',
                    'Welche alte Lüge über dich muss heute sterben?',
                    'Welche Identitätswahrheit willst du diese Woche leben?'
                ],
                'Lea glaubt an Jesus, aber sie sagt ständig: "Ich bin nichts wert."',
                'Welche Bibelstelle aus dieser Session widerspricht dieser Lüge am stärksten?',
                'Identitäts-Proklamation',
                'Schreibe 7 Tage lang jeden Morgen 1 Identitäts-Wahrheit auf und bete sie laut.'
            ),
        ]
    },

    // --- GROWING ---
    {
        id: 'course_growing',
        title: 'GROWING',
        description: 'Wachse im Glauben: Gebet, Bibel und Gemeinschaft.',
        pathId: 'next_steps',
        thumbnail: 'https://images.unsplash.com/photo-1507901747484-a2026a455a721?auto=format&fit=crop&q=80&w=800',
        order: 2,
        isPublished: true,
        sessions: [
            createSession(
                'growing_s1',
                'GEBET & GOTTES STIMME HÖREN',
                '🙏',
                [
                    'Gebet ist Beziehung, nicht religiöse Pflicht.',
                    'Gott spricht heute noch durch Bibel, Heiligen Geist und Eindrücke.',
                    'Meine Schafe hören meine Stimme (Johannes 10,27).'
                ],
                [
                    'Was sagt jeder Vers darüber aus, wie Gott mit dir kommuniziert?',
                    'Wie würdest du jemandem erklären, wie man Gottes Stimme erkennen kann?',
                    'Was hindert dich am häufigsten daran, Gottes Stimme wahrzunehmen?',
                    'Welche konkrete Art des Gebets willst du diese Woche praktizieren?'
                ],
                'Markus betet seit drei Wochen, aber sagt: "Ich glaube, Gott sagt mir nichts. Vielleicht bin ich nicht geistlich genug."',
                'Welche Bibelstelle dieser Session könnte Markus helfen – und warum?',
                'Stille Zeit',
                'Verbringe jeden Tag 5 Minuten in kompletter Stille. Nutze den "Guided Prayer" Modus in der App.'
            ),
            createSession(
                'growing_s2',
                'BIBELSTUDIUM & MEDITATION',
                '📖',
                [
                    'Die Bibel ist Transformation, nicht nur Information.',
                    'ROSE Methode: Read, Observe, Sense, Engage.',
                    'Meditation bedeutet, Gottes Wort tief im Herzen zu verankern.'
                ],
                [
                    'Was sagen die vier Bibelstellen über den Zweck der Bibel?',
                    'Wie würdest du erklären, was „Bibelstudium“ wirklich bedeutet?',
                    'Was fällt dir leichter: Bibel LESEN oder Bibel STUDIEREN? Warum?',
                    'Welchen praktischen Schritt wirst du diese Woche in deinem Bibellesen verändern?'
                ],
                'David sagt: "Ich lese jeden Tag ein Kapitel, aber ich verstehe nichts. Und es verändert mein Leben nicht."',
                'Welche der Bibelstellen dieser Session zeigt ihm, wie man das Wort Gottes wirksam anwendet?',
                'Meditation Challenge',
                'Wähle eine Bibelstelle und meditiere 7 Tage lang darüber (z.B. Psalm 119,105).'
            ),
            createSession(
                'growing_s3',
                'GEMEINSCHAFT & KIRCHE',
                '🏘️',
                [
                    'Christsein ist persönlich, aber nicht privat. Wir brauchen einander.',
                    'Kirche ist Gottes Familie, nicht nur ein Event.',
                    'Starke Beziehungen brauchen Verletzlichkeit und Verbindlichkeit.'
                ],
                [
                    'Was sagen diese Stellen über Gottes Plan für Gemeinschaft?',
                    'Wie würdest du jemandem erklären, warum Kirche mehr ist als ein Event?',
                    'Welche Art von Beziehung fehlt dir momentan am meisten?',
                    'Welchen konkreten Schritt wirst du diese Woche tun, um jemanden aktiv zu stärken?'
                ],
                'Luisa besucht seit Monaten den Gottesdienst, aber sagt: "Ich bin da, aber ich fühle mich nicht verbunden. Niemand kennt mich wirklich."',
                'Welche Bibelstelle dieser Session könnte Luisa zeigen, warum es wichtig ist, aktiv Beziehungen zu suchen?',
                'Connect Challenge',
                'Treffe dich diese Woche bewusst mit einer Person aus der Kirche – zum Gebet, Austausch oder Ermutigen.'
            ),
        ]
    },

    // --- STRONG ---
    {
        id: 'course_strong',
        title: 'STRONG',
        description: 'Starke Theologie für stürmische Zeiten.',
        pathId: 'theology',
        thumbnail: 'https://images.unsplash.com/photo-1455383569762-b7b293c66f91?auto=format&fit=crop&q=80&w=800',
        order: 3,
        isPublished: true,
        sessions: [
            createSession(
                'strong_s1',
                'THEOLOGISCHE FUNDAMENTE',
                '🏛️',
                [
                    'Gott ist Schöpfer, Herrscher, Vater, Retter.',
                    'Der Mensch ist Ebenbild Gottes (Imago Dei).',
                    'Glaube ist logisch und vernünftig (Römer 1,20).'
                ],
                [
                    'Was sagen diese Bibelstellen darüber aus, wie Gott ist und wie Er handelt?',
                    'Wie würdest du jemandem erklären, what „Ebenbild Gottes“ bedeutet?',
                    'Welche Wahrheit aus diesen Bibelstellen gibt dir heute neue Stabilität?',
                    'Wie willst du diese Woche Gottes Charakter im Alltag widerspiegeln?'
                ],
                'Johannes sagt: "Ich hatte eine schwere Zeit. Ich weiß nicht, ob es Gott wirklich gibt oder ob ich mir alles einbilde."',
                'Welche der Bibelstellen dieser Session könnte Johannes helfen, dass Gottes Existenz nachvollziehbar ist?',
                'Gottes Eigenschaften',
                'Schreibe jeden Tag 5 Minuten über eine Eigenschaft Gottes, die du in der Bibel siehst, und danke Ihm dafür.'
            ),
            createSession(
                'strong_s2',
                'UMGANG MIT LEID & ZWEIFEL',
                '⛈️',
                [
                    'Gott ist mit dir im Feuer (Jesaja 43,2).',
                    'Zweifel können ein Weg zu tieferem Glauben sein.',
                    'Klage ehrlich vor Gott, aber halte an Seiner Treue fest.'
                ],
                [
                    'Was sagen diese Bibelstellen darüber, wie Gott mit uns in Krisen umgeht?',
                    'Wie würdest du jemandem erklären, warum Zweifel kein Zeichen von Schwäche sind?',
                    'Welche Form des Zweifels kennst du am meisten aus deinem Leben?',
                    'Was ist ein praktischer Schritt, um mit einer aktuellen Schwierigkeit geistlich umzugehen?'
                ],
                'Nina hat ihren Job verloren und sagt: "Gott muss mich verlassen haben. Wie kann sonst so viel schiefgehen?"',
                'Welche Bibelstelle dieser Session zeigt Nina, dass Gottes Nähe nicht von Umständen abhängt?',
                'Dankbarkeit im Sturm',
                'Schreibe jeden Tag 1 Sache auf, für die du Gott danken kannst – auch wenn du gerade eine schwere Zeit hast.'
            ),
            createSession(
                'strong_s3',
                'BERUFUNG & LEITERSCHAFT',
                '👑',
                [
                    'Jeder Christ hat eine Berufung (Epheser 2,10).',
                    'Deine Gaben zeigen den Weg deiner Berufung.',
                    'Leiterschaft beginnt beim Dienen und beim Charakter.'
                ],
                [
                    'Was sagen diese Stellen über den Zusammenhang zwischen Gaben, Berufung und Dienst?',
                    'Wie würdest du definieren, was „Berufung“ im christlichen Sinn bedeutet?',
                    'Welche deiner Gaben erkennst du am deutlichsten?',
                    'Welchen konkreten Schritt wirst du diese Woche tun, um deine Gabe einzusetzen?'
                ],
                'Tim dient gelegentlich in der Gemeinde, aber sagt: "Ich habe keine besonderen Gaben. Andere sind viel besser geeignet."',
                'Welche Bibelstelle dieser Session zeigt Tim, dass Gott jedem Christen Gaben gegeben hat und dass seine Gabe gebraucht wird?',
                'Feedback einholen',
                'Frage zwei Personen in deiner Kirche, welche Gabe sie in dir sehen. Schreibe die Antworten auf.'
            ),
        ]
    },

    // --- FRUITFUL ---
    {
        id: 'course_fruitful',
        title: 'FRUITFUL',
        description: 'Ein Leben, das Frucht bringt und andere segnet.',
        pathId: 'habits',
        thumbnail: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&q=80&w=800',
        order: 4,
        isPublished: true,
        sessions: [
            createSession(
                'fruitful_s1',
                'DIE FRUCHT DES GEISTES',
                '🍇',
                [
                    'Frucht entsteht durch Verbundenheit mit Jesus, nicht durch Leistung.',
                    'Frucht ist Charakter (Galater 5,22-23).',
                    'Frucht zeigt sich in Beziehungen und Krisen.'
                ],
                [
                    'Welche Bedingungen nennt die Bibel dafür, dass Frucht im Leben eines Christen entsteht?',
                    'Wie würdest du erklären, was der Unterschied zwischen „Werken“ und „Frucht“ ist?',
                    'Welche Frucht des Geistes ist bei dir momentan am stärksten sichtbar – und welche am schwächsten?',
                    'Was kannst du diese Woche konkret tun, um tiefer mit Jesus verbunden zu bleiben?'
                ],
                'Paul dient in fünf Teams, ist ständig beschäftigt, aber sagt: "Ich fühle mich leer und habe das Gefühl, ich wachse nicht."',
                'Welche Bibelstelle dieser Session zeigt Paul, dass Frucht nicht durch Leistung entsteht, sondern durch Verbundenheit?',
                'Frucht Fokus',
                'Wähle EINE Frucht des Geistes und bete 7 Tage lang: "Heiliger Geist, lass diese Frucht in mir wachsen."'
            ),
            createSession(
                'fruitful_s2',
                'MISSION & EVANGELISATION',
                '🌍',
                [
                    'Gottes Herz schlägt für verlorene Menschen.',
                    'Du bist Gottes Botschafter an deinem Platz (2. Kor 5,20).',
                    'Teile deine Geschichte und lade Menschen ein.'
                ],
                [
                    'Was zeigen diese Bibelstellen über Gottes Haltung zu verlorenen Menschen?',
                    'Wie würdest du jemandem erklären, what „Botschafter Christi“ bedeutet?',
                    'Welches Hindernis hält dich am meisten zurück, deinen Glauben zu teilen?',
                    'Wen möchtest du diese Woche bewusst lieben, einladen oder für wen möchtest du beten?'
                ],
                'Sarah liebt Jesus, aber sagt: "Ich habe Angst, offen über meinen Glauben zu reden. Was, wenn ich abgelehnt werde?"',
                'Welche Bibelstelle dieser Session könnte Sarah zeigen, dass sie nicht allein spricht – sondern Gott durch sie?',
                'Mutiger Schritt',
                'Bete jeden Morgen: "Gott, zeig mir heute eine Person, der ich dienen kann." Handle auf die erste Gelegenheit.'
            ),
            createSession(
                'fruitful_s3',
                'MENTORING & MULTIPLIKATION',
                '🔄',
                [
                    'Jeder Christ soll andere prägen (Jüngerschaft).',
                    'Gib weiter, was du empfangen hast (2. Timotheus 2,2).',
                    'Mentoring ist Beziehung, Vorbild und Begleitung.'
                ],
                [
                    'Was sagen diese Bibelstellen darüber, wie geistliche Multiplikation funktioniert?',
                    'Wie würdest du jemandem erklären, warum jeder Christ ein Mentor für jemanden sein kann?',
                    'Wer hat dich geistlich geprägt?',
                    'Wen könntest du in den nächsten Wochen aktiv stärken, begleiten oder ermutigen?'
                ],
                'Jonas sagt: "Ich bin selbst noch am Lernen. Wie soll ich jemanden führen? Ich bin nicht geistlich genug."',
                'Welche Bibelstelle dieser Session könnte Jonas zeigen, dass Jüngerschaft nicht Perfektion verlangt, sondern Weitergabe?',
                'Ermutiger sein',
                'Schreibe den Namen einer Person auf, die Gott dir aufs Herz legt, und nimm diese Woche Kontakt auf, um sie zu ermutigen.'
            ),
        ]
    },

    // --- THEMEN (DEEP DIVE) ---
    {
        id: 'course_themes',
        title: 'THEMEN',
        description: 'Tiefergehende Themen für dein geistliches Wachstum.',
        pathId: 'deep_dive',
        thumbnail: 'https://images.unsplash.com/photo-1506452294339-16a2d1bce452?auto=format&fit=crop&q=80&w=800',
        order: 5,
        isPublished: true,
        sessions: [
            createSession(
                'theme_s1',
                'DER HEILIGE GEIST',
                '🕊️',
                [
                    'Der Heilige Geist ist eine Person: Helfer, Tröster, Lehrer.',
                    'Er verändert unser Inneres (Herz) und Charakter.',
                    'Er befähigt uns für Gottes Auftrag (Apostelgeschichte 1,8).'
                ],
                [
                    'Was sagen diese Bibelstellen über die Persönlichkeit und Aufgabe des Heiligen Geistes?',
                    'Wie würdest du erklären, was der Heilige Geist im Leben eines Christen tut?',
                    'Wie hast du den Heiligen Geist in letzter Zeit erlebt?',
                    'Was kannst du diese Woche tun, um bewusster mit dem Heiligen Geist zu leben?'
                ],
                'Marie betet, liest die Bibel, aber sagt: "Ich habe das Gefühl, der Heilige Geist ist weit weg."',
                'Welche Bibelstelle dieser Session zeigt Marie, dass der Geist dauerhaft in ihr lebt – unabhängig von Gefühlen?',
                'Geistliche Führung',
                'Starte jeden Morgen mit dem Gebet: "Heiliger Geist, führe mich heute. Zeig mir Jesus."'
            ),
            createSession(
                'theme_s2',
                'GROSSZÜGIGKEIT',
                '🎁',
                [
                    'Großzügigkeit beginnt in Gottes Herz (Johannes 3,16).',
                    'Sie verändert unser Herz und bricht die Macht des Materialismus.',
                    'Großzügigkeit baut Gottes Reich und segnet Menschen.'
                ],
                [
                    'Was sagen die Bibelstellen darüber, warum Großzügigkeit ein Ausdruck von Gottes Herz ist?',
                    'Wie würdest du jemandem erklären, warum Großzügigkeit für Christen so wichtig ist?',
                    'Welche Art der Großzügigkeit fällt dir leicht? Welche schwer?',
                    'Was ist ein Schritt der Großzügigkeit, den du diese Woche konkret gehen kannst?'
                ],
                'Lukas sagt: "Ich will gerne geben, aber ich habe Angst, dass es nicht reicht."',
                'Welche Bibelstelle dieser Session zeigt Lukas, dass Gott Versorgung an Großzügigkeit knüpft – nicht an Angst?',
                'Gebe-Challenge',
                'Gib diese Woche bewusst etwas weg – Geld, Zeit, Ermutigung oder Hilfe.'
            ),
        ]
    }
];

export const MOCK_CHALLENGES: Challenge[] = [
    {
        id: 'so_01',
        title: 'challenge.so_01.title',
        description: 'challenge.so_01.desc',
        why: 'challenge.so_01.why',
        category: 'Spiritual Habits',
        duration: 3,
        points: 50,
        participantIds: ['mock_admin_user_01']
    },
    {
        id: 'so_02',
        title: 'challenge.so_02.title',
        description: 'challenge.so_02.desc',
        why: 'challenge.so_02.why',
        category: 'Community',
        duration: 7,
        points: 100,
        participantIds: ['mock_admin_user_01', 'mock_user_02']
    },
    {
        id: 'so_03',
        title: 'challenge.so_03.title',
        description: 'challenge.so_03.desc',
        why: 'challenge.so_03.why',
        category: 'Spiritual Disciplines',
        duration: 14,
        points: 300,
    },
    {
        id: 'so_04',
        title: 'challenge.so_04.title',
        description: 'challenge.so_04.desc',
        why: 'challenge.so_04.why',
        category: 'Spiritual Disciplines',
        duration: 21,
        points: 500,
    },
    {
        id: 'so_05',
        title: 'challenge.so_05.title',
        description: 'challenge.so_05.desc',
        why: 'challenge.so_05.why',
        category: 'Community',
        duration: 3,
        points: 50,
    }
];
