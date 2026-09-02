import { describe, expect, it } from 'vitest'
import { allSunk, createEmptyBoard, placeFleetRandomly, receiveAttack, shipAt } from './board'
import { BOARD_SIZE, FLEET, coordKey, inBounds, type Board, type Ship } from './types'
import { seededRng } from './testUtils'

describe('placeFleetRandomly', () => {
  it('places the full standard fleet in bounds with no overlaps (many seeds)', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const board = placeFleetRandomly(seededRng(seed))
      expect(board.ships.map((s) => s.name)).toEqual(FLEET.map((f) => f.name))

      const seen = new Set<string>()
      for (const ship of board.ships) {
        expect(ship.cells).toHaveLength(ship.length)
        expect(ship.hits).toBe(0)
        for (const c of ship.cells) {
          expect(inBounds(c)).toBe(true)
          expect(seen.has(coordKey(c))).toBe(false)
          seen.add(coordKey(c))
        }
      }
      expect(seen.size).toBe(17)
    }
  })

  it('places each ship in a straight contiguous line', () => {
    const board = placeFleetRandomly(seededRng(42))
    for (const ship of board.ships) {
      const rows = new Set(ship.cells.map((c) => c.row))
      const cols = new Set(ship.cells.map((c) => c.col))
      const straight = rows.size === 1 || cols.size === 1
      expect(straight).toBe(true)
      const varying = rows.size === 1 ? [...cols] : [...rows]
      varying.sort((a, b) => a - b)
      expect(varying[varying.length - 1] - varying[0]).toBe(ship.length - 1)
    }
  })

  it('starts with every cell unattacked', () => {
    const board = placeFleetRandomly(seededRng(7))
    expect(board.shots.flat().every((s) => s === 'unknown')).toBe(true)
    expect(board.shots).toHaveLength(BOARD_SIZE)
  })
})

function boardWith(...ships: Ship[]): Board {
  return { ...createEmptyBoard(), ships }
}

const destroyer: Ship = {
  name: 'Destroyer',
  length: 2,
  cells: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ],
  hits: 0,
}

describe('receiveAttack', () => {
  it('reports a miss on empty water and marks the cell', () => {
    const { board, result } = receiveAttack(boardWith(destroyer), { row: 5, col: 5 })
    expect(result).toEqual({ kind: 'miss' })
    expect(board.shots[5][5]).toBe('miss')
  })

  it('reports a hit and increments the ship hit count without mutating the input', () => {
    const start = boardWith(destroyer)
    const { board, result } = receiveAttack(start, { row: 0, col: 0 })
    expect(result.kind).toBe('hit')
    expect(board.shots[0][0]).toBe('hit')
    expect(shipAt(board, { row: 0, col: 0 })?.hits).toBe(1)
    expect(start.ships[0].hits).toBe(0)
    expect(start.shots[0][0]).toBe('unknown')
  })

  it('reports sunk when the last cell of a ship is hit', () => {
    const first = receiveAttack(boardWith(destroyer), { row: 0, col: 0 })
    const second = receiveAttack(first.board, { row: 0, col: 1 })
    expect(second.result).toMatchObject({ kind: 'sunk', ship: { name: 'Destroyer', hits: 2 } })
    expect(allSunk(second.board)).toBe(true)
  })

  it('rejects attacking the same cell twice and leaves state unchanged', () => {
    const first = receiveAttack(boardWith(destroyer), { row: 0, col: 0 })
    const again = receiveAttack(first.board, { row: 0, col: 0 })
    expect(again.result).toEqual({ kind: 'already-attacked' })
    expect(again.board).toBe(first.board)
    expect(shipAt(again.board, { row: 0, col: 0 })?.hits).toBe(1)
  })

  it('rejects out-of-bounds coordinates', () => {
    const { result } = receiveAttack(boardWith(destroyer), { row: 10, col: 0 })
    expect(result).toEqual({ kind: 'already-attacked' })
  })

  it('allSunk is false while any ship survives', () => {
    const { board } = receiveAttack(boardWith(destroyer), { row: 0, col: 0 })
    expect(allSunk(board)).toBe(false)
  })
})
