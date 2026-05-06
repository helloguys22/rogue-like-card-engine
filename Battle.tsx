import React, { useState, useCallback } from 'react';
import { shuffle, type CardInstance, type EnemyDef } from '../gameData';

interface BattleProps {
  enemy: EnemyDef;
  deck: CardInstance[];
  initialHP: number;
  maxHP: number;
  permanentStrength: number;
  onBattleEnd: (won: boolean, remainingHP: number) => void;
}

interface BattleState {
  enemyHP: number;
  enemyBlock: number;
  enemyMoveIndex: number;
  enemyStrength: number;
  enemyVulnerable: number;
  enemyWeak: number;
  enemyPoison: number;
  playerHP: number;
  playerBlock: number;
  playerStrength: number;
  playerVulnerable: number;
  playerWeak: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  energy: number;
  maxEnergy: number;
  isPlayerTurn: boolean;
  turnCount: number;
  message: string;
  battleOver: boolean;
}

function drawCardsTo(s: BattleState, count: number): BattleState {
  const ns = { ...s, drawPile: [...s.drawPile], hand: [...s.hand], discardPile: [...s.discardPile] };
  for (let i = 0; i < count; i++) {
    if (ns.drawPile.length === 0) {
      if (ns.discardPile.length === 0) break;
      ns.drawPile = shuffle([...ns.discardPile]);
      ns.discardPile = [];
    }
    if (ns.drawPile.length > 0) {
      ns.hand.push(ns.drawPile.pop()!);
    }
  }
  return ns;
}

function initState(enemy: EnemyDef, deck: CardInstance[], hp: number, _maxHP: number, pStr: number): BattleState {
  const s: BattleState = {
    enemyHP: enemy.maxHP, enemyBlock: 0,
    enemyMoveIndex: Math.floor(Math.random() * enemy.moves.length),
    enemyStrength: 0, enemyVulnerable: 0, enemyWeak: 0, enemyPoison: 0,
    playerHP: hp, playerBlock: 0, playerStrength: pStr,
    playerVulnerable: 0, playerWeak: 0,
    drawPile: shuffle([...deck]), hand: [], discardPile: [],
    energy: 3, maxEnergy: 3, isPlayerTurn: true, turnCount: 1,
    message: '⚔️ Battle begins!', battleOver: false,
  };
  return drawCardsTo(s, 5);
}

const typeColors: Record<string, string> = {
  attack: 'border-red-500 bg-red-950/60',
  skill: 'border-blue-500 bg-blue-950/60',
  power: 'border-purple-500 bg-purple-950/60',
};

const typeBadgeColors: Record<string, string> = {
  attack: 'bg-red-600',
  skill: 'bg-blue-600',
  power: 'bg-purple-600',
};

const Battle: React.FC<BattleProps> = ({ enemy, deck, initialHP, maxHP, permanentStrength, onBattleEnd }) => {
  const [state, setState] = useState<BattleState>(() => initState(enemy, deck, initialHP, maxHP, permanentStrength));
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);

  const handlePlayCard = useCallback((index: number) => {
    setState(prev => {
      if (!prev.isPlayerTurn || prev.battleOver) return prev;
      const card = prev.hand[index];
      if (!card || prev.energy < card.cost) return prev;

      const ns: BattleState = {
        ...prev,
        hand: prev.hand.filter((_, i) => i !== index),
        discardPile: [...prev.discardPile, card],
        energy: prev.energy - card.cost,
      };

      // Damage
      if (card.damage !== undefined && card.damage !== 0) {
        const baseDmg = card.damage === -1 ? ns.playerBlock : card.damage;
        const hits = card.hits || 1;
        for (let h = 0; h < hits; h++) {
          let dmg = baseDmg + ns.playerStrength;
          if (ns.playerWeak > 0) dmg = Math.floor(dmg * 0.75);
          if (ns.enemyVulnerable > 0) dmg = Math.floor(dmg * 1.5);
          dmg = Math.max(0, dmg);
          const blocked = Math.min(ns.enemyBlock, dmg);
          ns.enemyBlock -= blocked;
          ns.enemyHP -= (dmg - blocked);
        }
        setShakeEnemy(true);
        setTimeout(() => setShakeEnemy(false), 300);
      }

      if (card.block) ns.playerBlock += card.block;
      if (card.vulnerable) ns.enemyVulnerable += card.vulnerable;
      if (card.weak) ns.enemyWeak += card.weak;
      if (card.poison) ns.enemyPoison += card.poison;
      if (card.strength) ns.playerStrength += card.strength;

      // Draw
      if (card.draw) {
        const drawn = drawCardsTo(ns, card.draw);
        ns.hand = drawn.hand;
        ns.drawPile = drawn.drawPile;
        ns.discardPile = drawn.discardPile;
      }

      if (ns.enemyHP <= 0) {
        ns.enemyHP = 0;
        ns.message = `🎉 ${enemy.name} defeated!`;
        ns.battleOver = true;
        setTimeout(() => onBattleEnd(true, ns.playerHP), 1200);
      }
      return ns;
    });
  }, [enemy.name, onBattleEnd]);

  const handleEndTurn = useCallback(() => {
    setState(prev => {
      if (!prev.isPlayerTurn || prev.battleOver) return prev;
      return {
        ...prev,
        hand: [],
        discardPile: [...prev.discardPile, ...prev.hand],
        isPlayerTurn: false,
        message: `⚠️ ${enemy.name}'s turn...`,
      };
    });

    setTimeout(() => {
      setState(prev => {
        if (prev.battleOver) return prev;
        const ns: BattleState = { ...prev, drawPile: [...prev.drawPile], discardPile: [...prev.discardPile] };
        ns.enemyBlock = 0;

        if (ns.enemyPoison > 0) {
          ns.enemyHP -= ns.enemyPoison;
          ns.enemyPoison--;
        }
        if (ns.enemyHP <= 0) {
          ns.enemyHP = 0;
          ns.message = `☠️ ${enemy.name} succumbed to poison!`;
          ns.battleOver = true;
          setTimeout(() => onBattleEnd(true, ns.playerHP), 1000);
          return ns;
        }

        const move = enemy.moves[ns.enemyMoveIndex];
        let dmgMsg = '';

        if (move.damage) {
          let dmg = move.damage + ns.enemyStrength;
          if (ns.enemyWeak > 0) dmg = Math.floor(dmg * 0.75);
          if (ns.playerVulnerable > 0) dmg = Math.floor(dmg * 1.5);
          dmg = Math.max(0, dmg);
          const blocked = Math.min(ns.playerBlock, dmg);
          ns.playerBlock -= blocked;
          ns.playerHP -= (dmg - blocked);
          dmgMsg = `💥 ${move.name}: ${dmg} dmg${blocked > 0 ? ` (${blocked} blocked)` : ''}`;
          setShakePlayer(true);
          setTimeout(() => setShakePlayer(false), 300);
        }
        if (move.block) {
          ns.enemyBlock += move.block;
          if (!move.damage) dmgMsg = `🛡️ ${move.name}: +${move.block} block`;
        }
        if (move.strength) ns.enemyStrength += move.strength;
        if (move.vulnerable) ns.playerVulnerable += move.vulnerable;
        if (move.weak) ns.playerWeak += move.weak;

        ns.enemyMoveIndex = (ns.enemyMoveIndex + 1) % enemy.moves.length;
        if (ns.enemyVulnerable > 0) ns.enemyVulnerable--;
        if (ns.enemyWeak > 0) ns.enemyWeak--;

        if (ns.playerHP <= 0) {
          ns.playerHP = 0;
          ns.message = `💀 Defeated by ${enemy.name}...`;
          ns.battleOver = true;
          setTimeout(() => onBattleEnd(false, 0), 1200);
          return ns;
        }

        ns.message = dmgMsg || `${enemy.name} uses ${move.name}.`;

        setTimeout(() => {
          setState(prev2 => {
            if (prev2.battleOver) return prev2;
            let ns2: BattleState = {
              ...prev2,
              drawPile: [...prev2.drawPile],
              hand: [...prev2.hand],
              discardPile: [...prev2.discardPile],
            };
            ns2.playerBlock = 0;
            ns2.energy = ns2.maxEnergy;
            ns2.turnCount++;
            ns2.isPlayerTurn = true;
            if (ns2.playerVulnerable > 0) ns2.playerVulnerable--;
            if (ns2.playerWeak > 0) ns2.playerWeak--;
            ns2.message = '⚔️ Your turn!';
            ns2 = drawCardsTo(ns2, 5);
            return ns2;
          });
        }, 700);

        return ns;
      });
    }, 800);
  }, [enemy, onBattleEnd]);

  const nextMove = enemy.moves[state.enemyMoveIndex];
  const enemyHpPct = Math.max(0, (state.enemyHP / enemy.maxHP) * 100);
  const playerHpPct = Math.max(0, (state.playerHP / maxHP) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-gray-900 to-stone-950 flex flex-col">
      {/* Enemy Area */}
      <div className="flex-shrink-0 p-4 pt-6">
        <div className={`max-w-2xl mx-auto bg-stone-800/80 rounded-xl p-4 border border-stone-600 ${shakeEnemy ? 'animate-shake' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="text-6xl">{enemy.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold text-lg">{enemy.name}</h3>
                <span className="text-red-400 font-mono text-sm">
                  {state.enemyHP}/{enemy.maxHP} HP
                </span>
              </div>
              <div className="w-full h-3 bg-stone-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 rounded-full"
                  style={{ width: `${enemyHpPct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-sm">
                {state.enemyBlock > 0 && (
                  <span className="text-blue-400 font-bold">🛡️ {state.enemyBlock}</span>
                )}
                {state.enemyStrength > 0 && (
                  <span className="text-orange-400">💪 +{state.enemyStrength}</span>
                )}
                {state.enemyVulnerable > 0 && (
                  <span className="text-yellow-400">⬇️ Vulnerable {state.enemyVulnerable}</span>
                )}
                {state.enemyWeak > 0 && (
                  <span className="text-green-400">😐 Weak {state.enemyWeak}</span>
                )}
                {state.enemyPoison > 0 && (
                  <span className="text-purple-400">☠️ Poison {state.enemyPoison}</span>
                )}
              </div>
              {/* Intent */}
              <div className="mt-2 text-sm bg-stone-700/50 rounded-lg px-3 py-1.5 inline-block">
                <span className="text-gray-400">Intent: </span>
                <span className="text-white font-semibold">
                  {nextMove.damage ? `⚔️ Attack ${nextMove.damage + state.enemyStrength}` : ''}
                  {nextMove.block ? ` 🛡️ Block ${nextMove.block}` : ''}
                  {nextMove.strength ? ` 💪 +${nextMove.strength} Str` : ''}
                  {nextMove.vulnerable ? ` ⬇️ Vuln ${nextMove.vulnerable}` : ''}
                  {nextMove.weak ? ` 😐 Weak ${nextMove.weak}` : ''}
                  {' '}({nextMove.name})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="flex-shrink-0 text-center py-2">
        <p className="text-yellow-300 font-semibold text-lg animate-pulse">{state.message}</p>
        <p className="text-gray-500 text-xs mt-1">Turn {state.turnCount} | Draw: {state.drawPile.length} | Discard: {state.discardPile.length}</p>
      </div>

      {/* Player Status */}
      <div className={`flex-shrink-0 px-4 pb-2 ${shakePlayer ? 'animate-shake' : ''}`}>
        <div className="max-w-2xl mx-auto bg-stone-800/80 rounded-xl p-3 border border-stone-600">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-sm mb-1">
                <span className="text-red-400 font-bold">❤️ {state.playerHP}/{maxHP}</span>
                {state.playerBlock > 0 && (
                  <span className="text-blue-400 font-bold">🛡️ {state.playerBlock} Block</span>
                )}
                <span className="text-yellow-400 font-bold">⭐ {state.energy}/{state.maxEnergy} Energy</span>
                {state.playerStrength > 0 && (
                  <span className="text-orange-400">💪 +{state.playerStrength} Str</span>
                )}
                {state.playerVulnerable > 0 && (
                  <span className="text-yellow-400">⬇️ Vulnerable {state.playerVulnerable}</span>
                )}
                {state.playerWeak > 0 && (
                  <span className="text-green-400">😐 Weak {state.playerWeak}</span>
                )}
              </div>
              <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 rounded-full"
                  style={{ width: `${playerHpPct}%` }}
                />
              </div>
            </div>
            {state.isPlayerTurn && !state.battleOver && (
              <button
                onClick={handleEndTurn}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors text-sm"
              >
                End Turn
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hand */}
      <div className="flex-1 flex items-end justify-center pb-4 px-4">
        <div className="flex gap-2 justify-center flex-wrap max-w-4xl">
          {state.hand.map((card, i) => (
            <button
              key={card.uid}
              onClick={() => handlePlayCard(i)}
              disabled={!state.isPlayerTurn || state.energy < card.cost || state.battleOver}
              className={`relative w-32 flex-shrink-0 rounded-lg border-2 p-2 text-left transition-all duration-150
                ${typeColors[card.type]}
                ${state.isPlayerTurn && state.energy >= card.cost && !state.battleOver
                  ? 'hover:-translate-y-3 hover:shadow-xl hover:shadow-yellow-500/20 cursor-pointer hover:border-yellow-400'
                  : 'opacity-50 cursor-not-allowed'}
              `}
            >
              {/* Cost */}
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm shadow-lg border border-yellow-300">
                {card.cost}
              </div>
              {/* Type badge */}
              <div className={`text-[10px] px-1.5 py-0.5 rounded ${typeBadgeColors[card.type]} text-white font-bold inline-block mb-1 mt-1`}>
                {card.type.toUpperCase()}
              </div>
              {/* Name */}
              <h4 className="text-white font-bold text-xs leading-tight mb-1">{card.name}</h4>
              {/* Description */}
              <p className="text-gray-300 text-[10px] leading-tight whitespace-pre-line">{card.description}</p>
              {/* Rarity */}
              <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                card.rarity === 'rare' ? 'bg-yellow-400' :
                card.rarity === 'uncommon' ? 'bg-blue-400' : 'bg-gray-400'
              }`} title={card.rarity} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Battle;
