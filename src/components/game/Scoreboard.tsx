import React from 'react';
import { ScoreEntry } from '../../lib/api';

interface ScoreboardProps {
  leaderboard: ScoreEntry[];
  onBack: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ leaderboard, onBack }) => {
  return (
    <div className="flex-grow flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto">
      <h2 className="text-3xl text-yellow-400 mb-4">명예의 전당</h2>
      
      <div className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
              <th className="px-4 py-3">순위</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">스테이지</th>
              <th className="px-4 py-3">최대 HP</th>
              <th className="px-4 py-3">장착 카드</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((score, index) => (
              <tr key={score.id} className="border-b border-gray-700 hover:bg-gray-800">
                <td className="px-4 py-3 font-bold text-yellow-500">{index + 1}</td>
                <td className="px-4 py-3">{score.playerName}</td>
                <td className="px-4 py-3 text-red-400">{score.stage}</td>
                <td className="px-4 py-3 text-green-400">{score.maxHp}</td>
                <td className="px-4 py-3 text-xs text-purple-300">{score.alphaCards.join(', ') || '없음'}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">기록이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button 
        onClick={onBack}
        className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white border-4 border-gray-800 rounded-sm mt-8"
      >
        메인으로 돌아가기
      </button>
    </div>
  );
};
