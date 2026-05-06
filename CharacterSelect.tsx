import React from 'react';
import { CHARACTERS, CARDS } from '../gameData';
import type { CharacterDef } from '../gameData';

interface Props {
  onSelect: (charId: 'steve' | 'alex') => void;
}

const CharCard: React.FC<{ char: CharacterDef; onSelect: () => void }> = ({ char, onSelect }) => {
  const deckCards = char.startingDeckIds.map(id => CARDS[id]);
  const uniqueCards = [...new Map(deckCards.map(c => [c.id, c])).values()];
  const counts: Record<string, number> = {};
  deckCards.forEach(c => { counts[c.id] = (counts[c.id] || 0) + 1; });

  return (
    <button
      onClick={onSelect}
      className={`bg-gradient-to-b ${char.color} rounded-xl p-6 text-left text-white
        border-2 border-white/20 hover:border-yellow-400 hover:scale-105 
        transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer w-full max-w-md`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-5xl">{char.emoji}</span>
        <div>
          <h2 className="text-2xl font-bold">{char.name}</h2>
          <p className="text-red-300 text-sm font-semibold">❤️ {char.maxHP} HP</p>
        </div>
      </div>
      <p className="text-sm text-white/80 mb-4 leading-relaxed">{char.description}</p>
      <div className="border-t border-white/20 pt-3">
        <h3 className="text-xs font-bold text-yellow-300 mb-2 uppercase tracking-wider">Starting Cards:</h3>
        <div className="flex flex-wrap gap-1">
          {uniqueCards.map(card => (
            <span key={card.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              card.type === 'attack' ? 'bg-red-500/40' : 
              card.type === 'skill' ? 'bg-blue-500/40' : 'bg-purple-500/40'
            }`}>
              {card.name} ×{counts[card.id]}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

const CharacterSelect: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-stone-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-yellow-400 mb-2 tracking-tight" style={{ fontFamily: 'monospace' }}>
          ⛏️ BLOCK CRAWLER ⛏️
        </h1>
        <p className="text-lg text-gray-400 italic">A Deck-Building Dungeon Crawler</p>
        <p className="text-sm text-gray-500 mt-2">Choose your hero to begin the journey through the blocky depths!</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl justify-center">
        {Object.values(CHARACTERS).map(char => (
          <CharCard key={char.id} char={char} onSelect={() => onSelect(char.id)} />
        ))}
      </div>
      
      <div className="mt-8 text-center max-w-lg">
        <h3 className="text-yellow-400 font-bold mb-2">How to Play:</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>🗺️ Mine blocks in generated levels to collect resources</p>
          <p>🃏 Battle enemies using cards — play cards with energy, then end your turn</p>
          <p>🏪 Visit merchants to buy cards and potions with mined blocks</p>
          <p>🏕️ Rest at campfires to heal</p>
          <p>🐉 Defeat the Ender Dragon on Floor 3 to win!</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
