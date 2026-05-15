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
      
      <div className="panel-bloodyroyal flex flex-col items-center space-y-4 p-6 w-full max-w-md">
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
            className="btn-bloodyroyal btn-bloodyroyal-call flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '기록 저장'}
          </button>
          <button
            onClick={onSkipScore}
            disabled={isSubmitting}
            className="btn-bloodyroyal btn-bloodyroyal-fold flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
};
