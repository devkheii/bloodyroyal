import React from 'react';

interface MenuProps {
  onStart: () => void;
  onViewLeaderboard: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart, onViewLeaderboard }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl text-red-500 mb-8">치트 포커</h2>
        <p className="text-sm text-gray-400 max-w-md leading-relaxed">
          체력을 걸고 베팅하세요. 조커로 사기를 치세요. 50 스테이지에서 살아남으세요.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <button 
          onClick={onStart}
          className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white border-4 border-black text-xl transition-transform active:translate-y-1 active:translate-x-1 font-bold"
          style={{ boxShadow: '4px 4px 0px #000' }}
        >
          게임 시작
        </button>
        <button 
          onClick={onViewLeaderboard}
          className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white border-4 border-black text-xl transition-transform active:translate-y-1 active:translate-x-1 font-bold"
          style={{ boxShadow: '4px 4px 0px #000' }}
        >
          랭킹 보기
        </button>
      </div>
    </div>
  );
};
