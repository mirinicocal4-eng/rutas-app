import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { generateBoard, isWin, isValid } from './utils/sudokuLogic';

function App() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState(Array(9).fill(null).map(() => Array(9).fill(0)));
  const [initialBoard, setInitialBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null); // {r, c}
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won

  const startNewGame = useCallback((diff = difficulty) => {
    const { initial, solution: sol } = generateBoard(diff);
    setBoard(initial.map(row => [...row]));
    setInitialBoard(initial.map(row => [...row]));
    setSolution(sol);
    setDifficulty(diff);
    setSelectedCell(null);
    setGameStatus('playing');
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, []);

  const handleCellClick = (r, c) => {
    if (initialBoard[r][c] !== 0) return;
    setSelectedCell({ r, c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameStatus === 'won') return;
    const { r, c } = selectedCell;
    
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    if (isWin(newBoard, solution)) {
      setGameStatus('won');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#10b981']
      });
    }
  };

  const resetGame = () => {
    setBoard(initialBoard.map(row => [...row]));
    setSelectedCell(null);
    setGameStatus('playing');
  };

  return (
    <div className="app-container">
      <h1 className="title">SUDOKU PRO</h1>
      
      <div className="difficulty-selector">
        {['easy', 'medium', 'hard'].map(d => (
          <button 
            key={d} 
            className={`diff-btn ${difficulty === d ? 'active' : ''}`}
            onClick={() => startNewGame(d)}
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="game-card">
        <div className="sudoku-grid">
          {board.map((row, r) => (
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isInitial = initialBoard[r][c] !== 0;
              const isWrong = cell !== 0 && cell !== solution[r][c];
              
              return (
                <div 
                  key={`${r}-${c}`}
                  className={`cell ${isSelected ? 'selected' : ''} ${isInitial ? 'initial' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell !== 0 ? cell : ''}
                </div>
              );
            })
          ))}
        </div>

        <div className="controls">
          <div className="number-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                className="num-btn"
                onClick={() => handleNumberInput(num)}
              >
                {num}
              </button>
            ))}
            <button className="num-btn" onClick={() => handleNumberInput(0)}>⌫</button>
          </div>

          <div className="action-buttons">
            <button className="btn btn-primary" onClick={() => startNewGame()}>New Game</button>
            <button className="btn" style={{background: 'var(--glass)', color: 'white'}} onClick={resetGame}>Reset</button>
          </div>
        </div>
      </div>

      {gameStatus === 'won' && (
        <div style={{marginTop: '1.5rem', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem'}}>
          ¡Puzzle Completado! 🎉
        </div>
      )}
    </div>
  );
}

export default App;
