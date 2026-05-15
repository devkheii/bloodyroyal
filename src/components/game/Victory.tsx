import React from 'react';
import { GameState } from '../../lib/game';

interface VictoryProps {
  gameState: GameState;
  playerName: string;
  setPlayerName: (name: string) => void;
  isSubmitting: boolean;
  onNextStage: () => void;
  onSaveScore: () => void;
  onSkipScore: () => void;
}

export const Victory: React.FC<VictoryProps> = ({
  gameState,
  playerName,
  setPlayerName,
  isSubmitting,
  onNextStage,
  onSaveScore,
  onSkipScore,
}) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center space-y-8">
      <h2 className="text-5xl text-green-400 font-bold" style={{ textShadow: '4px 4px 0px #000' }}>스테이지 클리어!</h2>
      <p className="font-bold">상대를 물리쳤습니다.</p>
      {gameState.stage < 50 ? (
        <button
          onClick={onNextStage}
          className="btn-bloodyroyal btn-bloodyroyal-green"
        >
          다음 스테이지
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-4 bg-blue-950 p-6 border-4 border-white" style={{ boxShadow: '8px 8px 0px #000' }}>
          <h3 className="text-3xl text-yellow-400 font-bold" style={{ textShadow: '4px 4px 0px #000' }}>최종 클리어 축하합니다!</h3>
          <p>명예의 전당에 이름을 남기세요.</p>
          <input 
            type="text" 
            placeholder="닉네임 입력" 
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            maxLength={10}
            className="px-4 py-2 bg-gray-900 border-4 border-black text-white text-center font-bold"
            style={{ boxShadow: 'inset 4px 4px 0px rgba(0,0,0,0.5)' }}
          />
          <div className="flex gap-4">
            <button
              onClick={onSaveScore}
              disabled={!playerName.trim() || isSubmitting}
              className="btn-bloodyroyal btn-bloodyroyal-allin disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '저장 중...' : '기록 저장'}
            </button>
            <button
              onClick={onSkipScore}
              disabled={isSubmitting}
              className="btn-bloodyroyal btn-bloodyroyal-fold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
