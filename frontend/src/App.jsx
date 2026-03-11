import { useState } from "react";

export function Square({ value, fun }) {
  return (
    <button onClick={fun} className="square">
      {value}
    </button>
  );
}

export default function Board() {
  const [square, setSquare] = useState(Array(9).fill(null));
  let [isNext, setIsNext] = useState(true);

  function handelClick(i) {
    let newSquare = square.slice();
    if (isNext) {
      newSquare[i] = "X";
    } else {
      newSquare[i] = "O";
    }

    setSquare(newSquare);
    setIsNext(!isNext);
  }

  return (
    <>
      <div className="board-row">
        <Square value={square[1]} fun={() => handelClick(1)} />
        <Square value={square[2]} fun={() => handelClick(2)} />
        <Square value={square[3]} fun={() => handelClick(3)} />
      </div>

      <div className="board-row">
        <Square value={square[4]} fun={() => handelClick(4)} />
        <Square value={square[5]} fun={() => handelClick(5)} />
        <Square value={square[6]} fun={() => handelClick(6)} />
      </div>

      <div className="board-row">
        <Square value={square[7]} fun={() => handelClick(7)} />
        <Square value={square[8]} fun={() => handelClick(8)} />
        <Square value={square[9]} fun={() => handelClick(9)} />
      </div>
    </>
  );
}

export function calculateWinner(square) {
  winingLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
}
