
import { Badge, SpiritSnack } from '../types';

export const QUOTES: { text: string; keywords: string[] }[] = [
    // --- HABITS & FAITH QUOTES ---
    { text: "Your body becomes what your habits believe.", keywords: ["habits", "believe"] },
    { text: "Consistency is the quietest but strongest muscle.", keywords: ["Consistency", "strongest"] },
    { text: "Fitness is a mindset before it's a movement.", keywords: ["mindset", "movement"] },
    { text: "Every workout is a prayer of gratitude.", keywords: ["gratitude"] },
    { text: "Health is built in silence, one choice at a time.", keywords: ["Health", "silence"] },
    { text: "The strongest habit is showing up.", keywords: ["habit", "showing up"] },
    { text: "Do the work — especially on the days you don’t feel like it.", keywords: ["Do the work"] },
    { text: "Faith fuels growth when your muscles are tired.", keywords: ["Faith", "growth"] },
    { text: "Strength is never just physical — it’s spirit, mind, and body aligned.", keywords: ["Strength", "aligned"] },
    { text: "Your growth may be invisible but it is undeniable to your spirit.", keywords: ["growth", "spirit"] },
];

export const LATEST_MESSAGE = {
    title: "Welcome to Hey Life",
    videoId: "M7lc1UVf-VE",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg"
};

export const ALL_BADGES: Omit<Badge, 'dateEarned'>[] = [
    { id: 'foundation_graduate', name: 'Foundation Graduate', icon: 'GraduationCap', description: 'Completed Foundations of Faith.' },
    { id: 'prayer_warrior', name: 'Prayer Warrior', icon: 'Shield', description: 'Prayed for 50 requests.' },
    { id: 'challenge_champion', name: 'Challenge Champion', icon: 'Trophy', description: 'Completed 10 challenges.' },
    { id: 'community_builder', name: 'Community Builder', icon: 'Users', description: 'Made 10 posts.' },
    { id: 'hey_gym_regular', name: 'Heygym Regular', icon: 'Dumbbell', description: '4 weeks of training.' },
];

export const JOURNAL_PROMPTS = [
    'journal.prompt.energy_drain', 'journal.prompt.positive_impact', 'journal.prompt.courage', 'journal.prompt.gratitude'
];

export const getPrayerLines = (fullText: string): string[] => {
    return fullText.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [fullText];
};

const getEasterDate = (year: number): Date => {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
};

// --- BIBLE REFERENCES (Day 1 - 31) ---
const BIBLE_REFS = [
    'Psalm 5:12', 'Philippians 4:19', 'Isaiah 26:3', 'Lamentations 3:22-23', 'Isaiah 40:31', 
    'Matthew 17:20', 'Psalm 23:1-2', 'Psalm 27:1', '1 Corinthians 15:57', 'Romans 8:28',
    'James 1:5', '2 Corinthians 12:9', 'Colossians 3:2', '1 Peter 1:3', 'John 3:16', 
    'Psalm 5:12', 'Jeremiah 29:11', 'Joshua 1:9', 'Proverbs 3:5-6', 'Romans 15:13', 
    'Psalm 46:1', 'Matthew 11:28', '2 Timothy 1:7', 'Psalm 34:8', 'Numbers 6:24-26', 
    'Hebrews 11:1', 'Psalm 119:105', 'Ephesians 3:20', 'Galatians 5:22-23', 'Philippians 4:13', 'Psalm 103:1'
];

export const SPIRIT_SNACKS: SpiritSnack[] = [
    { id: 'C', season: 'Christmas', titleKey: 'snack.C.title', reference: 'Luke 2:11', verseKey: 'snack.C.verse', prayerKey: 'snack.C.prayer' },
    { id: 'E', season: 'Easter', titleKey: 'snack.E.title', reference: 'Matthew 28:6', verseKey: 'snack.E.verse', prayerKey: 'snack.E.prayer' },
    { id: 'P', season: 'Pentecost', titleKey: 'snack.P.title', reference: 'Acts 2:4', verseKey: 'snack.P.verse', prayerKey: 'snack.P.prayer' },
    ...Array.from({ length: 31 }, (_, i) => ({
        id: (i + 1).toString(),
        season: 'General' as const,
        titleKey: `snack.${i + 1}.title`,
        reference: BIBLE_REFS[i],
        verseKey: `snack.${i + 1}.verse`,
        prayerKey: `snack.${i + 1}.prayer`
    }))
];

export const getDailySpiritSnack = (): SpiritSnack => {
    const now = new Date();
    const month = now.getMonth(); 
    const date = now.getDate();
    const year = now.getFullYear();

    // Check for Holiday Specials first
    if (month === 11 && (date === 24 || date === 25 || date === 26)) return SPIRIT_SNACKS.find(s => s.id === 'C')!;
    const easter = getEasterDate(year);
    if (now.toDateString() === easter.toDateString()) return SPIRIT_SNACKS.find(s => s.id === 'E')!;
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49); 
    if (now.toDateString() === pentecost.toDateString()) return SPIRIT_SNACKS.find(s => s.id === 'P')!;

    // Calculation for Day of Year
    const start = new Date(year, 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Logic Fix: Cycle through the 31 populated snacks using Modulo
    const cycledId = ((dayOfYear - 1) % 31) + 1;
    return SPIRIT_SNACKS.find(s => s.id === cycledId.toString()) || SPIRIT_SNACKS[3];
};
