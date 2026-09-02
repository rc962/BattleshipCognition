import {
  BOARD_SIZE,
  FLEET,
  coordKey,
  inBounds,
  type AttackResult,
  type Board,
  type Coord,
  type Ship,
} from './types'

export type Rng = () => number

export function createEmptyBoard(): Board {
  return {
    ships: [],
    shots: Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => 'unknown' as const),
    ),
  }
}

/** Randomly place the standard fleet with no overlaps, fully inside the board. */
export function placeFleetRandomly(rng: Rng = Math.random): Board {
  const board = createEmptyBoard()
  const occupied = new Set<string>()

  for (const spec of FLEET) {
    let placed = false
    while (!placed) {
      const horizontal = rng() < 0.5
      const maxRow = horizontal ? BOARD_SIZE : BOARD_SIZE - spec.length + 1
      const maxCol = horizontal ? BOARD_SIZE - spec.length + 1 : BOARD_SIZE
      const start: Coord = {
        row: Math.floor(rng() * maxRow),
        col: Math.floor(rng() * maxCol),
      }
      const cells: Coord[] = []
      for (let i = 0; i < spec.length; i++) {
        cells.push(
          horizontal
            ? { row: start.row, col: start.col + i }
            : { row: start.row + i, col: start.col },
        )
      }
      if (cells.every((c) => inBounds(c) && !occupied.has(coordKey(c)))) {
        cells.forEach((c) => occupied.add(coordKey(c)))
        board.ships.push({ name: spec.name, length: spec.length, cells, hits: 0 })
        placed = true
      }
    }
  }
  return board
}

export function shipAt(board: Board, c: Coord): Ship | undefined {
  return board.ships.find((s) => s.cells.some((sc) => sc.row === c.row && sc.col === c.col))
}

export function isSunk(ship: Ship): boolean {
  return ship.hits >= ship.length
}

export function allSunk(board: Board): boolean {
  return board.ships.every(isSunk)
}

/**
 * Apply an attack to `board`. Returns the result and a new board; the input
 * is not mutated so React state updates stay predictable.
 */
export function receiveAttack(board: Board, c: Coord): { board: Board; result: AttackResult } {
  if (!inBounds(c) || board.shots[c.row][c.col] !== 'unknown') {
    return { board, result: { kind: 'already-attacked' } }
  }

  const shots = board.shots.map((row) => [...row])
  const target = shipAt(board, c)

  if (!target) {
    shots[c.row][c.col] = 'miss'
    return { board: { ...board, shots }, result: { kind: 'miss' } }
  }

  shots[c.row][c.col] = 'hit'
  const updatedShip: Ship = { ...target, hits: target.hits + 1 }
  const ships = board.ships.map((s) => (s === target ? updatedShip : s))
  const next = { ships, shots }
  return {
    board: next,
    result: isSunk(updatedShip) ? { kind: 'sunk', ship: updatedShip } : { kind: 'hit', ship: updatedShip },
  }
}
