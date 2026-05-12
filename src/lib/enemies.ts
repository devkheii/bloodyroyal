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
}

const ENEMIES: Record<string, Enemy> = {
  // ── 1~3: 혈귀 (Ghoul) ── 겁쟁이 구간, 이성 거의 없음
  ghoul: {
    name: '혈귀',
    emoji: '🧟',
    dialogues: {
      intro: '피... 피가 필요해...',
      bet: '으르르... 피를 내놔!',
      fold: '끄윽... 무서워...',
      win: '크헤헤... 피다! 피!',
      lose: '꺄아악...!'
    }
  },
  // ── 4~6: 종자 (Thrall) ── 주인에게 명령받은 하인
  thrall: {
    name: '종자',
    emoji: '🧛',
    dialogues: {
      intro: '주인님의 명이다. 네 피를 가져오라고.',
      bet: '어차피 내 피가 아냐. 올려!',
      fold: '주, 주인님... 무섭습니다...',
      win: '크크... 주인님께서 기뻐하시겠어.',
      lose: '주인님, 용서를...'
    }
  },
  // ── 7~8: 야수 (Beast) ── 이성을 잃은 야생 뱀파이어
  beast: {
    name: '야수',
    emoji: '🦇',
    dialogues: {
      intro: '크아아아! (이성을 잃은 뱀파이어)',
      bet: '으아아아! (돌진)',
      fold: '크르르... (경계)',
      win: '카하하하! (포효)',
      lose: '끄윽... (비틀거림)'
    }
  },
  // ── 9: 혈기사 (Blood Knight) ── 남작 직속 문지기
  bloodKnight: {
    name: '혈기사',
    emoji: '🗡️',
    dialogues: {
      intro: '남작님의 영지에 허가 없이 들어온 대가를 치러라.',
      bet: '기사의 긍지를 걸겠다!',
      fold: '전략적 후퇴다.',
      win: '남작님께 네 피를 바치겠다.',
      lose: '기사로서... 수치스럽군...'
    }
  },
  // ── 10 BOSS: 남작 (Baron) ── 첫 번째 귀족, 위압적
  baron: {
    name: '남작',
    emoji: '🏰',
    dialogues: {
      intro: '하급 혈족이 감히 내 식탁에 앉겠다고?',
      bet: '네 피 따위, 식전주도 안 되겠군!',
      fold: '흥, 이 정도면 됐다.',
      win: '분수를 알았으면 꺼져라.',
      lose: '감히... 남작인 내가...!'
    }
  },
  // ── 11~15: 사냥꾼 (Hunter) ── 피에 굶주린 공격형
  hunter: {
    name: '사냥꾼',
    emoji: '🩸',
    dialogues: {
      intro: '오늘 밤 사냥감은 네가 되겠군.',
      bet: '피 냄새가 진하군! 더 걸어!',
      fold: '체, 도망치는 건 아니야.',
      win: '하하! 사냥 끝! 네 피는 내 것이다!',
      lose: '크윽... 사냥꾼이 사냥당하다니...'
    }
  },
  // ── 16~19: 광신도 (Fanatic) ── 피의 광기에 빠진 자
  fanatic: {
    name: '광신도',
    emoji: '😈',
    dialogues: {
      intro: '피의 축제다!! 자, 시작하자!',
      bet: '아하하! 더! 더 많은 피를!',
      fold: '...재미없어.',
      win: '아름다워... 네 피가 흐르는 모습이...',
      lose: '이 피의 향연이 끝나다니...!'
    }
  },
  // ── 20 BOSS: 자작 (Viscount) ── 탐욕스러운 귀족
  viscount: {
    name: '자작',
    emoji: '💎',
    dialogues: {
      intro: '남작을 넘어섰다고? 재밌는 피가 올라오는군.',
      bet: '네 피, 탐이 나는걸. 더 올려라.',
      fold: '귀한 피를 아낄 줄도 알아야지.',
      win: '크크크... 네 피는 아주 달콤하겠어.',
      lose: '내 재산이... 내 피가...!'
    }
  },
  // ── 21~29: 원로 (Elder) ── 수백 년 뱀파이어, 신중함의 극치
  elder: {
    name: '원로',
    emoji: '🧛‍♂️',
    dialogues: {
      intro: '수백 년을 살았다. 네 수작 따위 다 보인다.',
      bet: '이 정도면 적당하겠군.',
      fold: '서두를 것 없다. 밤은 길지.',
      win: '어린것이 무모했구나.',
      lose: '허... 세월이 무색해지는군.'
    }
  },
  // ── 30 BOSS: 백작 (Count) ── 냉혹한 처형자
  count: {
    name: '백작',
    emoji: '⚰️',
    dialogues: {
      intro: '내 영지에 발을 들인 이상, 돌아갈 수 없다.',
      bet: '처형 시간이다.',
      fold: '아직은 아니군.',
      win: '네 피는 내 성벽 사이에 스며들 것이다.',
      lose: '백작가의... 치욕...'
    }
  },
  // ── 31~39: 근위대장 (Royal Guard) ── 공작 직속, 합리적 계산형
  royalGuard: {
    name: '근위대장',
    emoji: '🛡️',
    dialogues: {
      intro: '공작님의 문 앞을 지키는 것이 나의 존재 이유다.',
      bet: '계산은 끝났다. 네가 진다.',
      fold: '무의미한 소모는 하지 않는다.',
      win: '공작님의 안녕을 위해 사라져라.',
      lose: '공작님... 저의 실책입니다...'
    }
  },
  // ── 40 BOSS: 공작 (Duke) ── 혈왕 바로 아래 최상위 귀족
  duke: {
    name: '공작',
    emoji: '🌙',
    dialogues: {
      intro: '혈왕 바로 아래, 이 자리의 무게를 알겠느냐.',
      bet: '네 운명은 이미 내 손안에 있다.',
      fold: '한 수 양보해주마.',
      win: '왕좌에 도전할 자격도 없는 것이.',
      lose: '불가능하다... 공작인 내가...!'
    }
  },
  // ── 41~49: 혈위병 (Blood Sentinel) ── 혈왕 직속 호위
  sentinel: {
    name: '혈위병',
    emoji: '🦇',
    dialogues: {
      intro: '왕의 옥좌에 다가오는 자, 죽음뿐이다.',
      bet: '왕의 이름으로 네 피를 거둔다!',
      fold: '...다음에 반드시 거둔다.',
      win: '왕의 뜻이다. 사라져라.',
      lose: '왕이시여... 용서를...'
    }
  },
  // ── 50 FINAL BOSS: 혈왕 (Blood King) ── 왕좌의 현 주인
  bloodKing: {
    name: '혈왕',
    emoji: '👑',
    dialogues: {
      intro: '만 년의 왕좌에 도전하겠다? 재밌는 피가 왔군.',
      bet: '모든 피는 결국 왕에게 흐른다.',
      fold: '흥미롭군. 조금 더 보여 보거라.',
      win: '왕좌는 영원하다. 네 피는 그렇지 않지.',
      lose: '불가능하다... 만 년의 왕이... 이런 하급 혈족에게...!!!'
    }
  }
};

export function getEnemyForStage(stage: number): Enemy {
  if (stage === 10) return ENEMIES.baron;
  if (stage === 20) return ENEMIES.viscount;
  if (stage === 30) return ENEMIES.count;
  if (stage === 40) return ENEMIES.duke;
  if (stage === 50) return ENEMIES.bloodKing;

  if (stage < 10) {
    if (stage <= 3) return ENEMIES.ghoul;
    if (stage <= 6) return ENEMIES.thrall;
    if (stage <= 8) return ENEMIES.beast;
    return ENEMIES.bloodKnight;
  }

  if (stage < 20) {
    if (stage <= 15) return ENEMIES.hunter;
    return ENEMIES.fanatic;
  }

  if (stage < 30) {
    return ENEMIES.elder;
  }

  if (stage < 40) {
    return ENEMIES.royalGuard;
  }

  return ENEMIES.sentinel;
}
