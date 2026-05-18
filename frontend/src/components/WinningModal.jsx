import React from 'react';

const WinningModal = ({ result, currentUsername, onClose }) => {
    const winnerName = result?.winnerName || result?.winner || 'A Player';
    const isDisqualified = Boolean(result?.isDisqualified);
    const disqualifiedPlayer = result?.disqualifiedPlayer || null;
    const scores = result?.scores && typeof result.scores === 'object' ? result.scores : {};
    const playerEntries = Object.entries(scores);
    const currentPlayerResult = result?.playerResults?.[currentUsername] || null;
    const pointsEarned = Number(
        currentPlayerResult?.seasonPoints ??
        currentPlayerResult?.score ??
        result?.pointsEarned ??
        0
    ) || 0;
    const elo = currentPlayerResult?.newElo ?? result?.newElo ?? 'Unranked';
    const title = isDisqualified ? 'Match Complete' : 'Victory!';
    const subtitle = isDisqualified
        ? disqualifiedPlayer === currentUsername
            ? 'You were disqualified from the match.'
            : `${winnerName} wins by disqualification.`
        : `${winnerName} solved the challenge.`;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#1e1e1e] p-6 text-center shadow-2xl md:p-8">
                <h2 className="mb-2 text-3xl font-bold text-emerald-400">{title}</h2>
                <p className="mb-6 text-lg text-white">{subtitle}</p>

                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                        <span className="block text-xs text-gray-400">Points Earned</span>
                        <span className="block text-xl font-bold text-emerald-400">+{pointsEarned}</span>
                    </div>
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                        <span className="block text-xs text-gray-400">New ELO</span>
                        <span className="block text-xl font-bold text-blue-400">{elo}</span>
                    </div>
                </div>

                <div className="mb-8 space-y-2">
                    {playerEntries.length > 0 ? (
                        playerEntries.map(([playerName, playerScore]) => (
                            <div key={playerName} className="flex justify-between rounded-lg bg-[#2d2d2d] p-3">
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
                    onClick={onClose}
                    className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-white transition-colors hover:bg-emerald-600"
                >
                    Go Back to Home
                </button>
            </div>
        </div>
    );
};

export default WinningModal;
