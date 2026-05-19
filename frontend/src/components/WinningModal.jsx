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
    const winnerName = result?.winnerName || result?.winner || (currentUsername ? 'You' : 'A Player');
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
        result?.pointsEarned ??
        0
    ) || 0;
    const elo = currentPlayerResult?.newElo ?? result?.newElo ?? 0;
    const message = result?.message || '';
    const title = isDisqualified ? 'Match Complete' : 'Victory!';
    const subtitle = message || (isDisqualified
        ? disqualifiedPlayer === currentUsername
            ? 'You were disqualified from the match.'
            : `${winnerName} wins by disqualification.`
        : `${winnerName} crushed the challenge.`);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-emerald-500/30 bg-[#111] p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.18)] md:p-10">
                <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

                <h2 className="relative mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-4xl font-extrabold text-transparent">
                    {title}
                </h2>
                <p className="relative mb-8 text-lg font-medium text-gray-300">{subtitle}</p>

                <div className="relative mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 py-3">
                        <span className="mb-1 block text-xs uppercase tracking-[0.24em] text-emerald-400/80">Points</span>
                        <span className="block text-2xl font-black text-emerald-400">+{pointsEarned}</span>
                    </div>
                    <div className="flex-1 rounded-2xl border border-blue-500/20 bg-blue-500/10 py-3">
                        <span className="mb-1 block text-xs uppercase tracking-[0.24em] text-blue-400/80">New ELO</span>
                        <span className="block text-2xl font-black text-blue-400">{elo}</span>
                    </div>
                </div>

                <div className="relative mb-8 space-y-2">
                    {playerEntries.length > 0 ? (
                        playerEntries.map(([playerName, playerScore]) => (
                            <div key={playerName} className="flex justify-between rounded-xl bg-white/[0.06] p-3">
                                <span className="font-bold text-white">{playerName || 'Unknown'}</span>
                                <span className="font-mono text-emerald-400">{Number(playerScore) || 0} pts</span>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-lg bg-[#2d2d2d] p-3 text-sm text-gray-300">
                            Final score data is unavailable.
                        </div>
                    )}
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
