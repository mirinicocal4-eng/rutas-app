// Sudoku Logic Utilities

export const BLANK_BOARD = Array(9).fill(null).map(() => Array(9).fill(0));

export function isValid(board, row, col, num) {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  let startRow = row - (row % 3);
  let startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

export function solve(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateBoard(difficulty = 'easy') {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));
  
  // Fill the board with a valid solution
  fillRandomly(board);
  
  const solution = board.map(row => [...row]);
  
  // Remove numbers based on difficulty
  let attempts;
  switch (difficulty) {
    case 'easy': attempts = 30; break;
    case 'medium': attempts = 45; break;
    case 'hard': attempts = 55; break;
    default: attempts = 30;
  }
  
  while (attempts > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    while (board[row][col] === 0) {
      row = Math.floor(Math.random() * 9);
      col = Math.floor(Math.random() * 9);
    }
    board[row][col] = 0;
    attempts--;
  }
  
  return { initial: board, solution };
}

function fillRandomly(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (let num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillRandomly(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function isWin(board, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}
