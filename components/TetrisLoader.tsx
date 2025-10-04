import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Cell = { filled: boolean };

type FallingPiece = {
  shape: number[][];
  x: number;
  y: number;
  id: string;
};

export interface TetrisLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  showLoadingText?: boolean;
  loadingText?: string;
}

const TETRIS_PIECES = [
  { shape: [[1, 1, 1, 1]] }, // I
  { shape: [[1, 1], [1, 1]] }, // O
  { shape: [[0, 1, 0], [1, 1, 1]] }, // T
  { shape: [[1, 0], [1, 0], [1, 1]] }, // L
  { shape: [[0, 1, 1], [1, 1, 0]] }, // S
  { shape: [[1, 1, 0], [0, 1, 1]] }, // Z
  { shape: [[0, 1], [0, 1], [1, 1]] }, // J
];

export default function TetrisLoader({
  size = 'md',
  speed = 'normal',
  showLoadingText = true,
  loadingText = 'Diagnosing your problem...'
}: TetrisLoaderProps) {
  const sizeConfig = useMemo(() => ({
    sm: { cell: 8, gridWidth: 8, gridHeight: 16, border: 0.5 },
    md: { cell: 12, gridWidth: 10, gridHeight: 20, border: 0.75 },
    lg: { cell: 16, gridWidth: 10, gridHeight: 20, border: 1 },
  } as const), []);
  const speedConfig = useMemo(() => ({ slow: 150, normal: 80, fast: 40 } as const), []);
  const cfg = sizeConfig[size];
  const fallSpeed = speedConfig[speed];

  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array.from({ length: cfg.gridHeight }, () => Array.from({ length: cfg.gridWidth }, () => ({ filled: false })))
  );
  const [falling, setFalling] = useState<FallingPiece | null>(null);
  const isClearingRef = useRef(false);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const rotate = useCallback((shape: number[][]): number[][] => {
    const rows = shape.length;
    const cols = shape[0].length;
    const out: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out[c][rows - 1 - r] = shape[r][c];
      }
    }
    return out;
  }, []);

  const newPiece = useCallback((): FallingPiece => {
    const base = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
    let shape = base.shape.map(row => row.slice());
    const rotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < rotations; i++) shape = rotate(shape);
    const maxX = cfg.gridWidth - shape[0].length;
    const x = Math.floor(Math.random() * (maxX + 1));
    return { shape, x, y: -shape.length, id: Math.random().toString(36).slice(2) };
  }, [cfg.gridWidth, rotate]);

  const canPlace = useCallback((piece: FallingPiece, nx: number, ny: number): boolean => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const gx = nx + c;
          const gy = ny + r;
          if (gx < 0 || gx >= cfg.gridWidth || gy >= cfg.gridHeight) return false;
          if (gy >= 0 && grid[gy][gx].filled) return false;
        }
      }
    }
    return true;
  }, [cfg.gridHeight, cfg.gridWidth, grid]);

  const place = useCallback((piece: FallingPiece) => {
    setGrid(prev => {
      const copy = prev.map(row => row.map(cell => ({ ...cell })));
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const gx = piece.x + c;
            const gy = piece.y + r;
            if (gy >= 0 && gy < cfg.gridHeight && gx >= 0 && gx < cfg.gridWidth) {
              copy[gy][gx] = { filled: true };
            }
          }
        }
      }
      return copy;
    });
  }, [cfg.gridHeight, cfg.gridWidth]);

  const clearLines = useCallback(() => {
    setGrid(prev => {
      const lines: number[] = [];
      prev.forEach((row, i) => { if (row.every(cell => cell.filled)) lines.push(i); });
      if (lines.length === 0) return prev;
      isClearingRef.current = true;
      const afterPulse = prev.map((row, i) => i === 0 && false ? row : row); // no-op pulse placeholder
      setTimeout(() => {
        setGrid(cur => {
          const kept = cur.filter((_, idx) => !lines.includes(idx));
          const empty = Array.from({ length: lines.length }, () => Array.from({ length: cfg.gridWidth }, () => ({ filled: false })));
          isClearingRef.current = false;
          return [...empty, ...kept];
        });
      }, 150);
      return afterPulse;
    });
  }, [cfg.gridWidth]);

  useEffect(() => {
    const loop = (ts: number) => {
      if (!lastTickRef.current) lastTickRef.current = ts;
      if (ts - lastTickRef.current >= fallSpeed) {
        lastTickRef.current = ts;
        if (!isClearingRef.current) {
          setFalling(prev => {
            if (!prev) return newPiece();
            const ny = prev.y + 1;
            if (canPlace(prev, prev.x, ny)) {
              return { ...prev, y: ny };
            }
            place(prev);
            setTimeout(clearLines, 30);
            return newPiece();
          });
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fallSpeed, canPlace, place, clearLines, newPiece]);

  const displayGrid = useMemo(() => {
    const copy = grid.map(row => row.map(cell => ({ ...cell })));
    if (falling && !isClearingRef.current) {
      for (let r = 0; r < falling.shape.length; r++) {
        for (let c = 0; c < falling.shape[r].length; c++) {
          if (falling.shape[r][c]) {
            const gx = falling.x + c;
            const gy = falling.y + r;
            if (gy >= 0 && gy < cfg.gridHeight && gx >= 0 && gx < cfg.gridWidth) {
              copy[gy][gx] = { filled: true };
            }
          }
        }
      }
    }
    return copy;
  }, [grid, falling, cfg.gridHeight, cfg.gridWidth]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, { borderWidth: cfg.border }]}>        
        {displayGrid.map((row, ri) => (
          <View key={`r-${ri}`} style={styles.row}>
            {row.map((cell, ci) => (
              <View
                key={`c-${ri}-${ci}`}
                style={{
                  width: cfg.cell,
                  height: cfg.cell,
                  backgroundColor: cell.filled ? '#FFFFFF' : 'transparent',
                  borderWidth: cfg.border,
                  borderColor: '#333333',
                }}
              />
            ))}
          </View>
        ))}
      </View>
      {showLoadingText && (
        <Text style={styles.loadingText}>{loadingText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  frame: { backgroundColor: '#000000', borderColor: '#FFFFFF' },
  row: { flexDirection: 'row' },
  loadingText: { marginTop: 12, color: '#B9B9B9', fontSize: 14, lineHeight: 20, textAlign: 'center' },
});


