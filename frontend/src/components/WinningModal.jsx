import React, { useState } from 'react';

const WinningModal = ({ result, currentUsername, onHomeClick, onClose }) => {
    const [isLeaving, setIsLeaving] = useState(false);
    
    const handleHomeClick = async () => {
        if (isLeaving) {
            return;
        }

        const action = onHomeClick || onClose || (() => {});
        setIsLeaving(true);

        try {
            await Promise.resolve(action());
        } finally {
            setIsLeaving(false);
        }
    };

    const winnerName = result?.winnerName || result?.winner || '';
    const isDisqualified = Boolean(result?.isDisqualified);
    const disqualifiedPlayer = result?.disqualifiedPlayer || null;
    const scores = result?.scores && typeof result.scores === 'object' ? result.scores : {};
    const playerEntries = Object.entries(scores);
    
    const currentPlayerResult =
        result?.playerResults?.[currentUsername] ||
        Object.entries(result?.playerResults || {}).find(([k]) => k.toLowerCase() === String(currentUsername).toLowerCase())?.[1] ||
        (playerEntries.length === 1 ? result?.playerResults?.[playerEntries[0][0]] : null);

    const pointsEarned = Number(
        currentPlayerResult?.seasonPoints ??
        currentPlayerResult?.score ??
        0
    ) || 0;

    const elo = currentPlayerResult?.newRating ?? currentPlayerResult?.newElo ?? 0;
    const eloChange = currentPlayerResult?.eloChange ?? 0;
    const message = result?.message || '';

    // Determine Victory / Defeat / Draw Outcome
    const isDraw = winnerName === 'Draw' || !winnerName;
    const isMeWinner = !isDraw && String(winnerName).toLowerCase() === String(currentUsername).toLowerCase();

    let modalTitle = 'Victory!';
    let modalSubtitle = message || 'You crushed the challenge.';
    let themeColorClass = 'text-emerald-400';
    let themeBgClass = 'bg-emerald-500/10 border-emerald-500/20';
    let themeBorderColor = 'border-emerald-500/30';
    let themeShadow = 'shadow-[0_0_50px_rgba(16,185,129,0.18)]';
    let gradientFromTo = 'from-emerald-400 to-cyan-400';
    let glowBg = 'bg-emerald-500/20';

    if (isDraw) {
        modalTitle = 'Draw';
        modalSubtitle = message || 'The match ended in a draw.';
        themeColorClass = 'text-slate-400';
        themeBgClass = 'bg-slate-500/10 border-slate-500/20';
        themeBorderColor = 'border-slate-500/30';
        themeShadow = 'shadow-[0_0_50px_rgba(100,116,139,0.18)]';
        gradientFromTo = 'from-slate-400 to-gray-400';
        glowBg = 'bg-slate-500/20';
    } else if (!isMeWinner) {
        modalTitle = 'Defeat!';
        modalSubtitle = message || `${winnerName} won the match.`;
        themeColorClass = 'text-rose-400';
        themeBgClass = 'bg-rose-500/10 border-rose-500/20';
        themeBorderColor = 'border-rose-500/30';
        themeShadow = 'shadow-[0_0_50px_rgba(244,63,94,0.18)]';
        gradientFromTo = 'from-rose-500 to-red-500';
        glowBg = 'bg-rose-500/20';
    }

    if (isDisqualified) {
        modalTitle = 'Match Complete';
        modalSubtitle = message || (disqualifiedPlayer === currentUsername
            ? 'You were disqualified from the match.'
            : `${winnerName} wins by disqualification.`);
    }

    // Dynamic formatting for Points and ELO values
    const pointsText = pointsEarned > 0 ? `+${pointsEarned}` : pointsEarned;
    const pointsColor = pointsEarned > 0 ? 'text-emerald-400' : pointsEarned < 0 ? 'text-rose-400' : 'text-slate-400';

    const eloChangeText = eloChange > 0 ? `+${eloChange}` : eloChange < 0 ? `${eloChange}` : '0';
    const eloChangeColor = eloChange > 0 ? 'text-emerald-400' : eloChange < 0 ? 'text-rose-400' : 'text-slate-400';

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className={`relative w-full max-w-md overflow-hidden rounded-[28px] border ${themeBorderColor} bg-[#111] p-8 text-center ${themeShadow} md:p-10`}>
                <div className={`pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full ${glowBg} blur-3xl`} />
                <div className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

                <h2 className={`relative mb-2 bg-gradient-to-r ${gradientFromTo} bg-clip-text text-4xl font-extrabold text-transparent`}>
                    {modalTitle}
                </h2>
                <p className="relative mb-8 text-lg font-medium text-gray-300">{modalSubtitle}</p>

                {/* Score & ELO Updates */}
                <div className="relative mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={`flex-1 rounded-2xl border ${themeBgClass} py-3`}>
                        <span className="mb-1 block text-xs uppercase tracking-[0.24em] text-gray-400/80">Points</span>
                        <span className={`block text-2xl font-black ${pointsColor}`}>{pointsText}</span>
                    </div>
                    <div className="flex-1 rounded-2xl border border-blue-500/20 bg-blue-500/10 py-3">
                        <span className="mb-1 block text-xs uppercase tracking-[0.24em] text-blue-400/80">New ELO</span>
                        <span className="block text-2xl font-black text-blue-400">{elo}</span>
                        {eloChange !== 0 && (
                            <span className={`block text-xs font-bold mt-0.5 ${eloChangeColor}`}>{eloChangeText} ELO</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleHomeClick}
                    disabled={isLeaving}
                    className="relative w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 font-bold text-white shadow-lg transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/25 active:scale-95"
                >
                    {isLeaving ? 'Syncing Results...' : 'Return to Dashboard'}
                </button>
            </div>
        </div>
    );
};

export default WinningModal;
