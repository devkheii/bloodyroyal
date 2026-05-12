import React from 'react';
import mainLogo from '../../images/main_logo.png';

interface MenuProps {
  onStart: () => void;
  onViewLeaderboard: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart, onViewLeaderboard }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <figure>
        <img src={mainLogo} alt="치트 포커" className="mb-8 mx-auto" style={{ width: '500px' }} />
        <figception className="text-sm text-gray-400 max-w-md leading-relaxed">
          체력을 걸고 베팅하세요. 조커로 사기를 치세요. 50 스테이지에서 살아남으세요.
        </figception>
        </figure>
      </div>
      <div className="flex flex-col gap-4">
        <button onClick={onStart} className="btn-bloodyroyal btn-bloodyroyal-primary">
          게임 시작
        </button>
        <button onClick={onViewLeaderboard} className="btn-bloodyroyal">
          랭킹 보기
        </button>
      </div>
    </div>
  );
};
