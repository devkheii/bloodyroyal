import React from 'react';
import { GameState } from '../../lib/game';

interface ScorePromptProps {
  gameState: GameState;
  playerName: string;
  setPlayerName: (name: string) => void;
  isSubmitting: boolean;
  onSaveScore: () => void;
  onSkipScore: () => void;
}

export const ScorePrompt: React.FC<ScorePromptProps> = ({
  gameState,
  playerName,
  setPlayerName,
  isSubmitting,
  onSaveScore,
  onSkipScore,
}) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center space-y-8">
      <h2 className="text-4xl text-yellow-500">기록 남기기</h2>
      <p className="text-sm text-gray-400">스코어보드에 당신의 기록을 남기시겠습니까?</p>
      <p className="text-lg text-red-400">도달 스테이지: {gameState.stage}</p>
      
      <div className="flex flex-col items-center space-y-4 bg-gray-800 p-6 rounded-lg border border-gray-700 w-full max-w-md">
        <input 
          type="text" 
          placeholder="닉네임 입력" 
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          maxLength={10}
          className="px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white text-center w-full"
        />
        <div className="flex gap-4 w-full">
          <button 
            onClick={onSaveScore}
            disabled={!playerName.trim() || isSubmitting}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white border-4 border-blue-800 rounded-sm"
          >
            {isSubmitting ? '저장 중...' : '기록 저장'}
          </button>
          <button 
            onClick={onSkipScore}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white border-4 border-gray-800 rounded-sm"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
};
