import { useState } from "react";

function Square({ value, fun }) {
  return (
    <button className="square" onClick={fun}>
      {value}
    </button>
  );
}

function Board({ squares, player, onPlay }) {
  const winner = calculatWinner(squares);

  function handelClick(i) {
    if (squares[i] || winner) {
      return;
    }

    const cloneSquares = squares.slice();

    player ? (cloneSquares[i] = "X") : (cloneSquares[i] = "O");

    onPlay(cloneSquares);
  }

  return (
    <>
      <div className="status">
        {winner
          ? "the winner is" + winner
          : "next player" + (player ? "X" : "O")}
      </div>

      <div className="board-row">
        <Square value={squares[0]} fun={() => handelClick(0)} />
        <Square value={squares[1]} fun={() => handelClick(1)} />
        <Square value={squares[2]} fun={() => handelClick(2)} />
      </div>

      <div className="board-row">
        <Square value={squares[3]} fun={() => handelClick(3)} />
        <Square value={squares[4]} fun={() => handelClick(4)} />
        <Square value={squares[5]} fun={() => handelClick(5)} />
      </div>

      <div className="board-row">
        <Square value={squares[6]} fun={() => handelClick(6)} />
        <Square value={squares[7]} fun={() => handelClick(7)} />
        <Square value={squares[8]} fun={() => handelClick(8)} />
      </div>
    </>
  );
}

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [isNext, setIsNext] = useState(true);
  const currentBoard = history[history.length - 1];

  function handelPlay(cloneSquares) {
    setHistory([...history, cloneSquares]);
    setIsNext(!isNext);
  }

  function jumpTo(nextSquare) {}

  moves = history.map(() => {});

  return (
    <div className="game">
      <div className="game-board">
        <Board squares={currentBoard} player={isNext} onPlay={handelPlay} />
      </div>
      <div className="game-info">
        <ol>{/*TODO*/}</ol>
      </div>
    </div>
  );
}

function calculatWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
