const Profile = (() => {
    const STORAGE_KEY = 'regicide_profile';
    const LEVEL_THRESHOLDS = [
        0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
        4000, 4900, 5900, 7000, 8200, 9500, 11000, 12700, 14600, 10000
    ];

    const ACHIEVEMENTS = [
        { id: 'first_blood', name: 'First Blood', icon: '🏁', desc: 'Win your first game' },
        { id: 'pawn_storm', name: 'Pawn Storm', icon: '♟️', desc: 'Promote a pawn to Queen' },
        { id: 'castles', name: 'Castles in the Sky', icon: '🏰', desc: 'Castle 10 times total' },
        { id: 'sharpshooter', name: 'Sharpshooter', icon: '🎯', desc: 'Solve 10 puzzles' },
        { id: 'grandmaster_pupil', name: "Grandmaster's Pupil", icon: '🧠', desc: 'Beat Level 8+ AI' },
        { id: 'regicide', name: 'Chess Master', icon: '👑', desc: 'Beat The King (Level 10)' },
        { id: 'streak', name: 'Streak', icon: '🔥', desc: 'Win 5 games in a row' },
        { id: 'silent_storm', name: 'Silent Storm', icon: '🤫', desc: 'Win without losing any pieces' }
    ];

    const defaultProfile = {
        username: 'Player',
        xp: 0,
        level: 1,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        achievements: [],
        castleCount: 0,
        puzzlesSolved: 0,
        winStreak: 0,
        maxWinStreak: 0
    };

    function load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) return { ...defaultProfile, ...JSON.parse(data) };
        } catch (e) {}
        return { ...defaultProfile };
    }

    function save(profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }

    function getLevel(xp) {
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
        }
        return 1;
    }

    function getXPForNextLevel(level) {
        if (level >= LEVEL_THRESHOLDS.length) return Infinity;
        return LEVEL_THRESHOLDS[level];
    }

    function getXPProgress(profile) {
        const currentThreshold = LEVEL_THRESHOLDS[profile.level - 1] || 0;
        const nextThreshold = LEVEL_THRESHOLDS[profile.level] || profile.xp;
        const progress = profile.xp - currentThreshold;
        const needed = nextThreshold - currentThreshold;
        return { progress, needed, percent: needed > 0 ? (progress / needed) * 100 : 100 };
    }

    function addXP(amount) {
        const profile = load();
        profile.xp += amount;
        profile.level = getLevel(profile.xp);
        save(profile);
        SoundEngine.xp();
        return profile;
    }

    function unlock(achievementId) {
        const profile = load();
        if (!profile.achievements.includes(achievementId)) {
            profile.achievements.push(achievementId);
            save(profile);
            return true;
        }
        return false;
    }

    function recordGame(result, mode, aiLevel) {
        const profile = load();
        profile.gamesPlayed++;

        let xpEarned = 0;
        if (result === 'win') {
            profile.wins++;
            profile.winStreak++;
            profile.maxWinStreak = Math.max(profile.maxWinStreak, profile.winStreak);
            if (profile.wins === 1) unlock('first_blood');
            if (profile.winStreak >= 5) unlock('streak');
            if (mode === 'ai') {
                if (aiLevel <= 3) xpEarned = 20;
                else if (aiLevel <= 6) xpEarned = 50;
                else xpEarned = 100;
                if (aiLevel >= 8) unlock('grandmaster_pupil');
                if (aiLevel === 10) unlock('regicide');
            } else {
                xpEarned = 30;
            }
        } else if (result === 'loss') {
            profile.losses++;
            profile.winStreak = 0;
        } else {
            profile.draws++;
            profile.winStreak = 0;
            xpEarned = 10;
        }

        profile.xp += xpEarned;
        profile.level = getLevel(profile.xp);
        save(profile);
        return { profile, xpEarned };
    }

    function recordCastle() {
        const profile = load();
        profile.castleCount++;
        if (profile.castleCount >= 10) unlock('castles');
        save(profile);
    }

    function recordPromotion() {
        unlock('pawn_storm');
    }

    function recordPuzzle(withoutHint) {
        const profile = load();
        profile.puzzlesSolved++;
        if (profile.puzzlesSolved >= 10) unlock('sharpshooter');
        const xp = withoutHint ? 25 : 15;
        profile.xp += xp;
        profile.level = getLevel(profile.xp);
        save(profile);
        return xp;
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEY);
    }

    return { load, save, addXP, unlock, recordGame, recordCastle, recordPromotion, recordPuzzle, reset, getXPProgress, ACHIEVEMENTS, getLevel, LEVEL_THRESHOLDS };
})();
