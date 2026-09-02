import { isSunk, shipAt } from './board'
import { BOARD_SIZE, inBounds, type Board, type Coord } from './types'
import type { Rng } from './board'

/**
 * Pick the AI's next target on the human's board.
 *
 * "Hunt and target": if any hit cell belongs to a ship that is not yet sunk,
 * try an untried neighbour of that cell. Otherwise pick a random untried cell.
 * Never returns a cell that has already been attacked.
 */
export function chooseAiTarget(humanBoard: Board, rng: Rng = Math.random): Coord | null {
  const untried = (c: Coord) => inBounds(c) && humanBoard.shots[c.row][c.col] === 'unknown'

  const candidates: Coord[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (humanBoard.shots[row][col] !== 'hit') continue
      const ship = shipAt(humanBoard, { row, col })
      if (!ship || isSunk(ship)) continue
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const n = { row: row + dr, col: col + dc }
        if (untried(n)) candidates.push(n)
      }
    }
  }

  if (candidates.length === 0) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (untried({ row, col })) candidates.push({ row, col })
      }
    }
  }

  if (candidates.length === 0) return null
  return candidates[Math.floor(rng() * candidates.length)]
}
