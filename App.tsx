import React, { useState, useCallback } from 'react';
import CharacterSelect from './components/CharacterSelect';
import MineLevel from './components/MineLevel';
import Battle from './components/Battle';
import {
  type GamePhase, type BlockType, type MapNodeDef, type CardDef, type CardInstance, type MerchantItem, type EnemyDef,
  CHARACTERS, CARDS, createStartingDeck, generateMap, getEnemyForFloor,
  getCardRewards, getBlockRewards, getMerchantItems,
  emptyBlocks, addBlockRewards, canAfford, payCosts, makeCardInstance,
  ALL_BLOCKS, BLOCK_NAMES, BLOCK_COLORS,
} from './gameData';

interface AppState {
  phase: GamePhase;
  character: 'steve' | 'alex' | null;
  playerHP: number;
  maxHP: number;
  blocks: Record<BlockType, number>;
  deck: CardInstance[];
  floor: number;
  strengthBonus: number;
  mapNodes: MapNodeDef[];
  currentMapNode: number;
  currentEnemy: EnemyDef | null;
  rewardCards: CardDef[];
  rewardBlocks: Partial<Record<BlockType, number>>;
  merchantItems: MerchantItem[];
  removingCard: boolean;
}

const initialState: AppState = {
  phase: 'CHARACTER_SELECT', character: null,
  playerHP: 75, maxHP: 75,
  blocks: emptyBlocks(), deck: [], floor: 1, strengthBonus: 0,
  mapNodes: [], currentMapNode: 0, currentEnemy: null,
  rewardCards: [], rewardBlocks: {}, merchantItems: [], removingCard: false,
};

// ===== HELPER: Card display for reward/merchant =====
const typeColorMap: Record<string, string> = {
  attack: 'border-red-500 bg-red-950/70', skill: 'border-blue-500 bg-blue-950/70', power: 'border-purple-500 bg-purple-950/70',
};
const typeBadge: Record<string, string> = {
  attack: 'bg-red-600', skill: 'bg-blue-600', power: 'bg-purple-600',
};

function CardDisplay({ card, onClick, disabled, label }: {
  card: CardDef; onClick?: () => void; disabled?: boolean; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-36 rounded-lg border-2 p-3 text-left transition-all duration-150 ${typeColorMap[card.type]}
        ${!disabled && onClick ? 'hover:-translate-y-2 hover:shadow-xl hover:border-yellow-400 cursor-pointer' : 'opacity-60 cursor-default'}`}
    >
      <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm shadow border border-yellow-300">
        {card.cost}
      </div>
      <div className={`text-[10px] px-1.5 py-0.5 rounded ${typeBadge[card.type]} text-white font-bold inline-block mb-1 mt-1`}>
        {card.type.toUpperCase()}
      </div>
      <h4 className="text-white font-bold text-xs leading-tight mb-1">{card.name}</h4>
      <p className="text-gray-300 text-[10px] leading-tight whitespace-pre-line">{card.description}</p>
      {label && <div className="text-yellow-400 text-xs font-bold mt-1">{label}</div>}
    </button>
  );
}

// ===== MAP SCREEN =====
function MapView({ nodes, current, onNodeClick, floor }: {
  nodes: MapNodeDef[]; current: number; onNodeClick: (id: number) => void; floor: number;
}) {
  const nodeIcons: Record<string, string> = { battle: '⚔️', elite: '⚡', merchant: '🏪', rest: '🔥', boss: '👑' };
  const nodeLabels: Record<string, string> = { battle: 'Battle', elite: 'Elite', merchant: 'Merchant', rest: 'Rest Site', boss: 'Boss' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-gray-900 to-stone-950 flex flex-col items-center pt-10 px-4">
      <h2 className="text-2xl font-bold text-yellow-400 mb-2">🗺️ Floor {floor} — Map</h2>
      <p className="text-gray-400 text-sm mb-6">Choose your next encounter</p>
      <div className="flex flex-col items-center gap-2 w-full max-w-md">
        {nodes.map((node, i) => {
          const isCompleted = node.completed;
          const isCurrent = i === current && !node.completed;
          const isLocked = i > current && !node.completed;
          return (
            <React.Fragment key={node.id}>
              {i > 0 && <div className="w-0.5 h-6 bg-stone-600" />}
              <button
                onClick={() => isCurrent ? onNodeClick(node.id) : undefined}
                disabled={!isCurrent}
                className={`w-full max-w-sm rounded-xl p-4 border-2 flex items-center gap-4 transition-all duration-200
                  ${isCompleted ? 'bg-green-900/30 border-green-700/50 opacity-60' :
                    isCurrent ? 'bg-stone-800 border-yellow-500 shadow-lg shadow-yellow-500/20 hover:scale-105 cursor-pointer' :
                    'bg-stone-800/50 border-stone-700 opacity-40'}`}
              >
                <span className="text-3xl">{nodeIcons[node.type]}</span>
                <div className="flex-1 text-left">
                  <h3 className={`font-bold ${isCurrent ? 'text-yellow-300' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                    {nodeLabels[node.type]}
                  </h3>
                  {isCompleted && <span className="text-green-500 text-xs">✓ Completed</span>}
                  {isCurrent && <span className="text-yellow-400 text-xs animate-pulse">→ Click to enter</span>}
                  {isLocked && <span className="text-gray-600 text-xs">🔒 Locked</span>}
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ===== REWARD SCREEN =====
function RewardScreen({ cards, blocks, onPick, onSkip }: {
  cards: CardDef[]; blocks: Partial<Record<BlockType, number>>; onPick: (c: CardDef) => void; onSkip: () => void;
}) {
  const blockEntries = ALL_BLOCKS.filter(bt => (blocks[bt] || 0) > 0);
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-gray-900 to-stone-950 flex flex-col items-center pt-10 px-4">
      <h2 className="text-3xl font-bold text-yellow-400 mb-2">🎉 Victory!</h2>
      <p className="text-gray-400 mb-4">Choose a card to add to your deck, or skip.</p>
      {blockEntries.length > 0 && (
        <div className="bg-stone-800 rounded-lg px-4 py-2 mb-6 flex items-center gap-3">
          <span className="text-sm text-gray-300">Blocks earned:</span>
          {blockEntries.map(bt => (
            <span key={bt} className="flex items-center gap-1 text-sm">
              <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: BLOCK_COLORS[bt] }} />
              <span className="text-white font-bold">+{blocks[bt]}</span>
              <span className="text-gray-400">{BLOCK_NAMES[bt]}</span>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {cards.map(card => (
          <CardDisplay key={card.id} card={card} onClick={() => onPick(card)} label="Add to Deck" />
        ))}
      </div>
      <button onClick={onSkip} className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-gray-300 rounded-lg transition-colors">
        Skip Card Reward
      </button>
    </div>
  );
}

// ===== MERCHANT SCREEN =====
function MerchantScreen({ items, blocks, deck, removingCard, onBuy, onRemoveCard, onLeave }: {
  items: MerchantItem[]; blocks: Record<BlockType, number>; deck: CardInstance[];
  removingCard: boolean; onBuy: (item: MerchantItem) => void;
  onRemoveCard: (uid: number) => void; onLeave: () => void;
}) {
  if (removingCard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-900 via-gray-900 to-stone-950 flex flex-col items-center pt-10 px-4">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">🃏 Remove a Card</h2>
        <p className="text-gray-400 text-sm mb-6">Click a card to remove it from your deck.</p>
        <div className="flex flex-wrap gap-3 justify-center max-w-3xl mb-6">
          {deck.map(card => (
            <CardDisplay key={card.uid} card={card} onClick={() => onRemoveCard(card.uid)} label="Remove" />
          ))}
        </div>
        <button onClick={onLeave} className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-gray-300 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-gray-900 to-stone-950 flex flex-col items-center pt-10 px-4">
      <h2 className="text-3xl font-bold text-yellow-400 mb-2">🏪 Merchant</h2>
      <p className="text-gray-400 text-sm mb-4">Spend your mined blocks!</p>
      <div className="bg-stone-800 rounded-lg px-4 py-2 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-300">Your blocks:</span>
        {ALL_BLOCKS.filter(bt => (blocks[bt] || 0) > 0).map(bt => (
          <span key={bt} className="flex items-center gap-1 text-sm">
            <span className="w-4 h-4 rounded-sm border border-white/20" style={{ backgroundColor: BLOCK_COLORS[bt] }} />
            <span className="text-white font-bold">{blocks[bt]}</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-6">
        {items.map(item => {
          const afford = canAfford(item.costs, blocks);
          return (
            <div key={item.id} className={`bg-stone-800 rounded-xl p-4 border ${afford ? 'border-stone-600' : 'border-stone-700 opacity-50'}`}>
              <h3 className="text-white font-bold mb-1">{item.name}</h3>
              <p className="text-gray-400 text-xs mb-3">{item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Cost:</span>
                  {ALL_BLOCKS.filter(bt => (item.costs[bt] || 0) > 0).map(bt => (
                    <span key={bt} className="flex items-center gap-1 text-xs">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOCK_COLORS[bt] }} />
                      <span className="text-white">{item.costs[bt]}</span>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onBuy(item)}
                  disabled={!afford}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                    afford ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-stone-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onLeave} className="px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors">
        Leave Merchant →
      </button>
    </div>
  );
}

// ===== REST SCREEN =====
function RestScreen({ hp, maxHP, onRest }: { hp: number; maxHP: number; onRest: () => void }) {
  const healAmt = Math.floor(maxHP * 0.3);
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-orange-950/30 to-stone-950 flex flex-col items-center justify-center px-4">
      <div className="text-8xl mb-6">🔥</div>
      <h2 className="text-3xl font-bold text-orange-400 mb-2">Rest Site</h2>
      <p className="text-gray-400 mb-2">Take a moment to recover.</p>
      <p className="text-white mb-6">❤️ {hp}/{maxHP} HP → Heal <span className="text-green-400 font-bold">{healAmt} HP</span></p>
      <button onClick={onRest} className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-lg transition-colors shadow-lg shadow-green-600/30">
        🔥 Rest (Heal {healAmt} HP)
      </button>
    </div>
  );
}

// ===== GAME OVER SCREEN =====
function GameOverScreen({ floor, onRestart }: { floor: number; onRestart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950/50 via-stone-900 to-stone-950 flex flex-col items-center justify-center px-4">
      <div className="text-8xl mb-6">💀</div>
      <h2 className="text-4xl font-bold text-red-500 mb-2">GAME OVER</h2>
      <p className="text-gray-400 mb-6">You were defeated on Floor {floor}.</p>
      <button onClick={onRestart} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-lg transition-colors">
        Try Again
      </button>
    </div>
  );
}

// ===== VICTORY SCREEN =====
function VictoryScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-950/50 via-stone-900 to-stone-950 flex flex-col items-center justify-center px-4">
      <div className="text-8xl mb-6">🏆</div>
      <h2 className="text-4xl font-bold text-yellow-400 mb-2">VICTORY!</h2>
      <p className="text-lg text-gray-300 mb-2">You defeated the Ender Dragon!</p>
      <p className="text-gray-500 mb-6">The blocky depths are safe once more.</p>
      <button onClick={onRestart} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-lg transition-colors">
        Play Again
      </button>
    </div>
  );
}

// ===== MAIN APP =====
function App() {
  const [state, setState] = useState<AppState>(initialState);

  const advance = useCallback((prev: AppState): AppState => {
    const nodes = prev.mapNodes.map((n, i) => i === prev.currentMapNode ? { ...n, completed: true } : n);
    const nextNode = prev.currentMapNode + 1;
    if (nextNode >= nodes.length) {
      if (nodes.some(n => n.type === 'boss' && n.completed)) {
        return { ...prev, mapNodes: nodes, phase: 'VICTORY' };
      }
      const nf = prev.floor + 1;
      return { ...prev, mapNodes: generateMap(nf), floor: nf, currentMapNode: 0, phase: 'MINE' };
    }
    return { ...prev, mapNodes: nodes, currentMapNode: nextNode, phase: 'MAP' };
  }, []);

  const handleCharSelect = useCallback((charId: 'steve' | 'alex') => {
    const ch = CHARACTERS[charId];
    setState({ ...initialState, phase: 'MINE', character: charId,
      playerHP: ch.maxHP, maxHP: ch.maxHP, deck: createStartingDeck(charId),
      floor: 1, mapNodes: generateMap(1), currentMapNode: 0 });
  }, []);

  const handleMineDone = useCallback((collected: Record<BlockType, number>) => {
    setState(p => ({ ...p, blocks: addBlockRewards(p.blocks, collected), phase: 'MAP' }));
  }, []);

  const handleNodeClick = useCallback((nodeId: number) => {
    setState(p => {
      const node = p.mapNodes[nodeId];
      if (!node || node.completed || nodeId !== p.currentMapNode) return p;
      if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
        const etype = node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'battle';
        const enemy = getEnemyForFloor(p.floor, etype);
        const phase: GamePhase = node.type === 'boss' ? 'BOSS' : node.type === 'elite' ? 'ELITE' : 'BATTLE';
        return { ...p, phase, currentEnemy: enemy };
      }
      if (node.type === 'merchant') return { ...p, phase: 'MERCHANT', merchantItems: getMerchantItems(4), removingCard: false };
      if (node.type === 'rest') return { ...p, phase: 'REST' };
      return p;
    });
  }, []);

  const handleBattleEnd = useCallback((won: boolean, hp: number) => {
    setState(p => {
      if (!won) return { ...p, playerHP: 0, phase: 'GAME_OVER' };
      const rw = getBlockRewards(p.floor);
      const nd = p.mapNodes[p.currentMapNode];
      if (nd?.type === 'elite') { rw.gold = (rw.gold || 0) + 2; if (Math.random() < 0.4) rw.diamond = (rw.diamond || 0) + 1; }
      if (nd?.type === 'boss') { rw.diamond = (rw.diamond || 0) + 3; rw.emerald = (rw.emerald || 0) + 2; }
      return { ...p, playerHP: hp, phase: 'REWARD', rewardCards: getCardRewards(p.character!, 3), rewardBlocks: rw };
    });
  }, []);

  const handleRewardPick = useCallback((card: CardDef) => {
    setState(p => advance({ ...p, deck: [...p.deck, makeCardInstance(card)], blocks: addBlockRewards(p.blocks, p.rewardBlocks) }));
  }, [advance]);

  const handleRewardSkip = useCallback(() => {
    setState(p => advance({ ...p, blocks: addBlockRewards(p.blocks, p.rewardBlocks) }));
  }, [advance]);

  const handleBuy = useCallback((item: MerchantItem) => {
    setState(p => {
      if (!canAfford(item.costs, p.blocks)) return p;
      const nb = payCosts(item.costs, p.blocks);
      if (item.type === 'remove') return { ...p, blocks: nb, removingCard: true };
      let nd = p.deck, nh = p.playerHP, ns = p.strengthBonus;
      if (item.type === 'card' && item.cardId) { const cd = CARDS[item.cardId]; if (cd) nd = [...nd, makeCardInstance(cd)]; }
      if (item.type === 'potion') { if (item.healAmount) nh = Math.min(p.maxHP, nh + item.healAmount); if (item.strengthAmount) ns += item.strengthAmount; }
      return { ...p, blocks: nb, deck: nd, playerHP: nh, strengthBonus: ns, merchantItems: p.merchantItems.filter(i => i.id !== item.id) };
    });
  }, []);

  const handleRemoveCard = useCallback((uid: number) => {
    setState(p => ({ ...p, deck: p.deck.filter(c => c.uid !== uid), removingCard: false }));
  }, []);

  const handleMerchantLeave = useCallback(() => {
    setState(p => advance({ ...p, removingCard: false }));
  }, [advance]);

  const handleRest = useCallback(() => {
    setState(p => {
      const heal = Math.floor(p.maxHP * 0.3);
      return advance({ ...p, playerHP: Math.min(p.maxHP, p.playerHP + heal) });
    });
  }, [advance]);

  const handleRestart = useCallback(() => { setState(initialState); }, []);

  const { phase } = state;

  const hud = phase !== 'CHARACTER_SELECT' && (
    <div className="bg-stone-800/95 border-b border-stone-600 px-4 py-2 flex flex-wrap items-center gap-3 text-sm sticky top-0 z-50">
      <span className="text-yellow-400 font-bold">🗺️ Floor {state.floor}</span>
      <span className="text-red-400 font-bold">❤️ {state.playerHP}/{state.maxHP}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Blocks:</span>
        {ALL_BLOCKS.filter(bt => (state.blocks[bt] || 0) > 0).map(bt => (
          <span key={bt} className="flex items-center gap-0.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOCK_COLORS[bt] }} />
            <span className="text-white text-xs font-bold">{state.blocks[bt]}</span>
          </span>
        ))}
        {ALL_BLOCKS.every(bt => (state.blocks[bt] || 0) === 0) && <span className="text-gray-600 text-xs">None</span>}
      </div>
      <span className="text-gray-500">🃏 {state.deck.length}</span>
      {state.strengthBonus > 0 && <span className="text-orange-400 font-bold">💪 +{state.strengthBonus}</span>}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      {hud}
      {phase === 'CHARACTER_SELECT' && <CharacterSelect onSelect={handleCharSelect} />}
      {phase === 'MINE' && <MineLevel floor={state.floor} onDone={handleMineDone} />}
      {phase === 'MAP' && <MapView nodes={state.mapNodes} current={state.currentMapNode} onNodeClick={handleNodeClick} floor={state.floor} />}
      {(phase === 'BATTLE' || phase === 'ELITE' || phase === 'BOSS') && state.currentEnemy && (
        <Battle enemy={state.currentEnemy} deck={state.deck} initialHP={state.playerHP}
          maxHP={state.maxHP} permanentStrength={state.strengthBonus} onBattleEnd={handleBattleEnd} />
      )}
      {phase === 'REWARD' && <RewardScreen cards={state.rewardCards} blocks={state.rewardBlocks} onPick={handleRewardPick} onSkip={handleRewardSkip} />}
      {phase === 'MERCHANT' && <MerchantScreen items={state.merchantItems} blocks={state.blocks} deck={state.deck}
        removingCard={state.removingCard} onBuy={handleBuy} onRemoveCard={handleRemoveCard} onLeave={handleMerchantLeave} />}
      {phase === 'REST' && <RestScreen hp={state.playerHP} maxHP={state.maxHP} onRest={handleRest} />}
      {phase === 'GAME_OVER' && <GameOverScreen floor={state.floor} onRestart={handleRestart} />}
      {phase === 'VICTORY' && <VictoryScreen onRestart={handleRestart} />}
    </div>
  );
}

export default App;
