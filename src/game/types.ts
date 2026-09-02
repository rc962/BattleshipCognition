export const BOARD_SIZE = 10

export const FLEET = [
  { name: 'Carrier', length: 5 },
  { name: 'Battleship', length: 4 },
  { name: 'Cruiser', length: 3 },
  { name: 'Submarine', length: 3 },
  { name: 'Destroyer', length: 2 },
] as const

export type ShipName = (typeof FLEET)[number]['name']

export interface Coord {
  row: number
  col: number
}

export interface Ship {
  name: ShipName
  length: number
  cells: Coord[]
  hits: number
}

/** What has happened to a cell from the attacker's point of view. */
export type CellStatus = 'unknown' | 'miss' | 'hit'

export interface Board {
  ships: Ship[]
  /** shots[row][col] */
  shots: CellStatus[][]
}

export type AttackResult =
  | { kind: 'miss' }
  | { kind: 'hit'; ship: Ship }
  | { kind: 'sunk'; ship: Ship }
  | { kind: 'already-attacked' }

export type Player = 'human' | 'ai'

export interface GameState {
  humanBoard: Board
  aiBoard: Board
  turn: Player
  winner: Player | null
  /** Human-readable description of the last events, newest first. */
  log: string[]
  /** Deadpan one-liner about the human's last shot. */
  quip: string
}

export function coordKey(c: Coord): string {
  return `${c.row},${c.col}`
}

export function inBounds(c: Coord): boolean {
  return c.row >= 0 && c.row < BOARD_SIZE && c.col >= 0 && c.col < BOARD_SIZE
}
