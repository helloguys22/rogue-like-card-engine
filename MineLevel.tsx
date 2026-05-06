import React, { useState, useCallback } from 'react';
import {
  generateMineGrid, BLOCK_COLORS, BLOCK_NAMES,
  ALL_BLOCKS, emptyBlocks,
  type MineCell, type BlockType,
} from '../gameData';

interface Props {
  floor: number;
  onDone: (collectedBlocks: Record<BlockType, number>) => void;
}

const MINE_WIDTH = 22;
const MINE_HEIGHT = 12;
const MAX_SWINGS = 20;

const blockToBlockType = (bt: string): BlockType | null => {
  if (['dirt', 'stone', 'coal', 'iron', 'gold', 'diamond', 'emerald'].includes(bt)) {
    return bt as BlockType;
  }
  return null;
};

const MineLevel: React.FC<Props> = ({ floor, onDone }) => {
  const [grid, setGrid] = useState<MineCell[][]>(() => generateMineGrid(MINE_WIDTH, MINE_HEIGHT));
  const [swings, setSwings] = useState(MAX_SWINGS);
  const [collected, setCollected] = useState<Record<BlockType, number>>(emptyBlocks());
  const [floatingTexts, setFloatingTexts] = useState<{ x: number; y: number; text: string; color: string; id: number }[]>([]);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());

  const isAdjacentToAir = useCallback((g: MineCell[][], x: number, y: number): boolean => {
    if (y === 0) return true;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MINE_WIDTH && ny >= 0 && ny < MINE_HEIGHT) {
        if (g[ny][nx].mined || g[ny][nx].blockType === 'air') return true;
      }
    }
    return false;
  }, []);

  const canMine = useCallback((x: number, y: number): boolean => {
    if (swings <= 0) return false;
    const cell = grid[y][x];
    if (cell.mined || cell.blockType === 'air' || cell.blockType === 'bedrock') return false;
    return isAdjacentToAir(grid, x, y);
  }, [grid, swings, isAdjacentToAir]);

  const mineBlock = useCallback((x: number, y: number) => {
    if (!canMine(x, y)) return;

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const cell = newGrid[y][x];
    const bt = cell.blockType;
    cell.mined = true;
    cell.blockType = 'air';

    const newSwings = swings - 1;
    const newCollected = { ...collected };
    const blockType = blockToBlockType(bt);
    if (blockType) {
      newCollected[blockType] = (newCollected[blockType] || 0) + 1;
    }

    const key = `${x}-${y}`;
    setFlashCells(prev => new Set(prev).add(key));
    setTimeout(() => {
      setFlashCells(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 200);

    const color = BLOCK_COLORS[bt] || '#fff';
    const name = blockType ? (BLOCK_NAMES[bt] || bt) : '';
    if (name) {
      const id = Date.now() + Math.random();
      setFloatingTexts(prev => [...prev, { x, y, text: `+1 ${name}`, color, id }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(f => f.id !== id));
      }, 800);
    }

    setGrid(newGrid);
    setSwings(newSwings);
    setCollected(newCollected);
  }, [grid, swings, collected, canMine]);

  const handleDone = useCallback(() => {
    onDone(collected);
  }, [collected, onDone]);

  const totalCollected = ALL_BLOCKS.reduce((sum, bt) => sum + (collected[bt] || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-gray-900 to-stone-950 flex flex-col items-center p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-400 mb-1">⛏️ Mining Level — Floor {floor}</h2>
        <p className="text-gray-400 text-sm">Click blocks adjacent to open areas to mine them!</p>
      </div>

      <div className="flex items-center gap-3 mb-4 bg-stone-800/80 rounded-lg px-4 py-2">
        <span className="text-yellow-400 font-bold">⛏️ Pickaxe:</span>
        <div className="w-48 h-4 bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 rounded-full"
            style={{ width: `${(swings / MAX_SWINGS) * 100}%` }}
          />
        </div>
        <span className="text-white font-mono text-sm">{swings}/{MAX_SWINGS}</span>
        <button
          onClick={handleDone}
          className="ml-4 px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-sm transition-colors"
        >
          Done Mining →
        </button>
      </div>

      <div className="relative bg-stone-800 rounded-lg p-2 shadow-2xl border border-stone-600">
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${MINE_WIDTH}, 28px)`,
            gridTemplateRows: `repeat(${MINE_HEIGHT}, 28px)`,
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => {
              const mineable = canMine(x, y);
              const isFlash = flashCells.has(`${x}-${y}`);
              const color = cell.mined ? BLOCK_COLORS.air : BLOCK_COLORS[cell.blockType] || '#666';
              const isBedrock = cell.blockType === 'bedrock';
              const isGrass = cell.blockType === 'grass' && !cell.mined;

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => mineBlock(x, y)}
                  className={`${mineable ? 'cursor-pointer hover:brightness-150 hover:scale-110 z-10' : ''}
                    ${isFlash ? 'animate-pulse brightness-200' : ''}
                    border border-stone-700/30 transition-all duration-100 relative`}
                  style={{
                    backgroundColor: color,
                    borderRadius: '2px',
                    boxShadow: mineable ? `0 0 8px ${color}80` : 'none',
                    borderTop: isGrass ? '3px solid #66BB6A' : undefined,
                    opacity: cell.mined ? 0.08 : (isBedrock ? 0.5 : 1),
                  }}
                  title={cell.mined ? '' : `${BLOCK_NAMES[cell.blockType] || cell.blockType}${mineable ? ' (click to mine)' : ''}`}
                />
              );
            })
          )}
        </div>

        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className="absolute pointer-events-none font-bold text-sm"
            style={{
              left: ft.x * 28 + 14,
              top: ft.y * 28,
              color: ft.color,
              textShadow: '0 0 4px black, 0 0 4px black',
              transform: 'translateX(-50%)',
              animation: 'floatUp 0.8s ease-out forwards',
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      <div className="mt-4 bg-stone-800/80 rounded-lg px-4 py-3">
        <h3 className="text-sm font-bold text-yellow-400 mb-2">Collected Blocks ({totalCollected}):</h3>
        <div className="flex flex-wrap gap-3">
          {ALL_BLOCKS.map(bt => (
            <div key={bt} className="flex items-center gap-1 text-sm">
              <span
                className="w-4 h-4 rounded-sm inline-block border border-white/20"
                style={{ backgroundColor: BLOCK_COLORS[bt] }}
              />
              <span className="text-gray-300">{BLOCK_NAMES[bt]}:</span>
              <span className="text-white font-bold">{collected[bt] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOCK_COLORS.grass }} /> Surface
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOCK_COLORS.iron }} /> Iron
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOCK_COLORS.gold }} /> Gold
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOCK_COLORS.diamond }} /> Diamond
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOCK_COLORS.emerald }} /> Emerald
        </span>
      </div>
    </div>
  );
};

export default MineLevel;
