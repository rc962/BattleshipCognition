import { describe, expect, it } from 'vitest'
import { chooseAiTarget } from './ai'
import { placeFleetRandomly, receiveAttack } from './board'
import { BOARD_SIZE, coordKey } from './types'
import { seededRng } from './testUtils'

describe('chooseAiTarget', () => {
  it('never attacks the same cell twice and exhausts the board in exactly 100 shots', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = seededRng(seed)
      let board = placeFleetRandomly(rng)
      const fired = new Set<string>()
      for (let shot = 0; shot < BOARD_SIZE * BOARD_SIZE; shot++) {
        const target = chooseAiTarget(board, rng)
        expect(target).not.toBeNull()
        const key = coordKey(target!)
        expect(fired.has(key)).toBe(false)
        fired.add(key)
        const { board: next, result } = receiveAttack(board, target!)
        expect(result.kind).not.toBe('already-attacked')
        board = next
      }
      expect(fired.size).toBe(100)
      expect(chooseAiTarget(board, rng)).toBeNull()
    }
  })

  it('targets a neighbour of an unsunk hit', () => {
    const rng = seededRng(3)
    let board = placeFleetRandomly(rng)
    const carrier = board.ships[0]
    const middle = carrier.cells[2]
    board = receiveAttack(board, middle).board

    const target = chooseAiTarget(board, rng)!
    const distance = Math.abs(target.row - middle.row) + Math.abs(target.col - middle.col)
    expect(distance).toBe(1)
  })

  it('goes back to hunting once the damaged ship is sunk', () => {
    const rng = seededRng(9)
    let board = placeFleetRandomly(rng)
    const destroyer = board.ships[4]
    for (const c of destroyer.cells) board = receiveAttack(board, c).board

    // With the destroyer sunk there is no "target" mode; any untried cell is valid.
    const target = chooseAiTarget(board, rng)!
    expect(board.shots[target.row][target.col]).toBe('unknown')
  })
})
