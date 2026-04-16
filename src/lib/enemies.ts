export interface Enemy {
  name: string;
  emoji: string;
  dialogues: {
    intro: string;
    bet: string;
    fold: string;
    win: string;
    lose: string;
  };
  bgUrl: string;
}

const ENEMIES: Record<string, Enemy> = {
  slime: {
    name: '슬라임',
    emoji: '💧',
    dialogues: {
      intro: '뇸뇸뇸.. 뇸뇸뇸뇸.',
      bet: '뇸뇸!! (철퍼덕)',
      fold: '뇸... (도망)',
      win: '뇸뇸^^ (출렁출렁)',
      lose: '눂... (터짐)'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-dungeon/1920/1080?blur=2'
  },
  goblin: {
    name: '고블린',
    emoji: '👺',
    dialogues: {
      intro: '히히! 네 돈은 다 내 거다!',
      bet: '받고 더! 멍청한 인간!',
      fold: '쳇, 이번엔 봐주지.',
      win: '깔깔깔! 털털 털렸네!',
      lose: '꾸엑! 내 돈!!'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-dungeon/1920/1080?blur=2'
  },
  wolf: {
    name: '늑대인간',
    emoji: '🐺',
    dialogues: {
      intro: '크르르르... 사냥감인가.',
      bet: '물어뜯어주마!',
      fold: '깨갱...',
      win: '아우우우우!!',
      lose: '크윽... 강하다...'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-dungeon/1920/1080?blur=2'
  },
  orc: {
    name: '오크 전사',
    emoji: '👹',
    dialogues: {
      intro: '취익! 인간, 부순다!',
      bet: '오크, 강하다! 레이즈!',
      fold: '오크, 작전상 후퇴!',
      win: '오크, 승리! 취익!',
      lose: '오크... 진다...?'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-dungeon/1920/1080?blur=2'
  },
  minotaur: {
    name: '미노타우로스 (보스)',
    emoji: '🐂',
    dialogues: {
      intro: '미궁의 끝에서 널 기다렸다.',
      bet: '내 도끼를 받아라!!',
      fold: '음... 뿔이 가렵군.',
      win: '음하하! 뼈도 못 추렸구나!',
      lose: '이럴 수가... 미궁이 무너진다...'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-dungeon/1920/1080?blur=2'
  },
  treant: {
    name: '트렌트',
    emoji: '🌳',
    dialogues: {
      intro: '숲을... 어지럽히는 자...',
      bet: '뿌리가... 널 옭아맨다...',
      fold: '바람이... 차갑군...',
      win: '숲의... 양분이 되어라...',
      lose: '장작이... 되어버렸네...'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-forest/1920/1080?blur=2'
  },
  fairy: {
    name: '타락한 요정',
    emoji: '🧚‍♀️',
    dialogues: {
      intro: '우후훗, 나랑 놀아줄래?',
      bet: '반짝반짝 가루 얍!',
      fold: '에잉, 재미없어.',
      win: '꺄하하! 바보 같아!',
      lose: '날개가... 아파...'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-forest/1920/1080?blur=2'
  },
  guardian: {
    name: '숲의 수호자 (보스)',
    emoji: '🦌',
    dialogues: {
      intro: '자연의 섭리를 거스르지 마라.',
      bet: '대자연의 분노를 느껴라!',
      fold: '잠시 물러나겠다.',
      win: '자연으로 돌아가라.',
      lose: '대자연이여... 날 용서하소서...'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-forest/1920/1080?blur=2'
  },
  knight: {
    name: '흑기사',
    emoji: '⚔️',
    dialogues: {
      intro: '이 문은 통과할 수 없다.',
      bet: '내 검에 자비는 없다!',
      fold: '방패를 올리겠다.',
      win: '약한 자는 살아남을 수 없다.',
      lose: '내 검이... 부러지다니...'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-castle-ext/1920/1080?blur=2'
  },
  demon: {
    name: '상급 악마',
    emoji: '👿',
    dialogues: {
      intro: '네 영혼, 꽤 맛있어 보이는데?',
      bet: '지옥불에 타버려라!',
      fold: '흥, 이번엔 살려주지.',
      win: '영혼은 잘 가져가마!',
      lose: '크아아악! 지옥으로...!'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-castle-int/1920/1080?blur=2'
  },
  demonKing: {
    name: '마왕 (보스)',
    emoji: '👑',
    dialogues: {
      intro: '네놈이 그 용사인가? 가소롭군.',
      bet: '절망을 선사해주마!',
      fold: '호오, 제법이군.',
      win: '결국 넌 벌레에 불과했다.',
      lose: '내가... 마왕인 내가...!!'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-castle-int/1920/1080?blur=2'
  },
  angel: {
    name: '타락 천사',
    emoji: '🕊️',
    dialogues: {
      intro: '빛의 이름으로 널 심판하겠다.',
      bet: '신성한 심판!',
      fold: '빛이 잠시 가려졌을 뿐.',
      win: '정화되었다.',
      lose: '날개가... 타들어간다...'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-heaven/1920/1080?blur=2'
  },
  reaper: {
    name: '사신 (보스)',
    emoji: '💀',
    dialogues: {
      intro: '네 운명의 시간이 왔다.',
      bet: '죽음은 피할 수 없다!',
      fold: '아직은 아닌가...',
      win: '시간이 다 됐구나...',
      lose: '죽음마저 죽는단 말인가...!'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-castle-int/1920/1080?blur=2'
  },
  fallenGod: {
    name: '타락한 신 (최종 보스)',
    emoji: '👁️',
    dialogues: {
      intro: '필멸자여, 감히 신의 영역에 발을 들이느냐.',
      bet: '우주의 섭리로 널 짓눌러주마.',
      fold: '흥미롭군. 지켜보겠다.',
      win: '먼지로 돌아가라, 필멸자여.',
      lose: '불가능하다... 필멸자가 어찌 신을...!!!'
    },
    bgUrl: 'https://picsum.photos/seed/pixel-heaven/1920/1080?blur=2'
  }
};

export function getEnemyForStage(stage: number): Enemy {
  if (stage === 10) return ENEMIES.minotaur;
  if (stage === 20) return ENEMIES.guardian;
  if (stage === 30) return ENEMIES.reaper;
  if (stage === 40) return ENEMIES.demonKing;
  if (stage === 50) return ENEMIES.fallenGod;

  if (stage < 10) {
    if (stage <= 3) return ENEMIES.slime;
    if (stage <= 6) return ENEMIES.goblin;
    if (stage <= 8) return ENEMIES.wolf;
    return ENEMIES.orc;
  }
  
  if (stage < 20) {
    if (stage <= 15) return ENEMIES.treant;
    return ENEMIES.fairy;
  }

  if (stage < 30) {
    return ENEMIES.knight;
  }

  if (stage < 40) {
    return ENEMIES.demon;
  }

  return ENEMIES.angel;
}
