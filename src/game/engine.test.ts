import { describe, expect, it } from 'vitest'
import { isSunk } from './board'
import { aiAttack, humanAttack, newGame } from './engine'
import { seededRng } from './testUtils'
import type { Coord, GameState } from './types'

function unattackedCell(state: GameState, board: 'aiBoard' | 'humanBoard', ship = false): Coord {
  const b = state[board]
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (b.shots[row][col] !== 'unknown') continue
      const onShip = b.ships.some((s) => s.cells.some((c) => c.row === row && c.col === col))
      if (onShip === ship) return { row, col }
    }
  }
  throw new Error('no cell')
}

describe('engine', () => {
  it('starts with the human to move and no winner', () => {
    const state = newGame(seededRng(1))
    expect(state.turn).toBe('human')
    expect(state.winner).toBeNull()
    expect(state.humanBoard.ships).toHaveLength(5)
    expect(state.aiBoard.ships).toHaveLength(5)
  })

  it('human attack passes the turn to the AI and logs the shot', () => {
    const state = newGame(seededRng(1))
    const next = humanAttack(state, unattackedCell(state, 'aiBoard'))
    expect(next.turn).toBe('ai')
    expect(next.log[0]).toMatch(/^You fired at [A-J](10|[1-9]): miss\.$/)
  })

  it('ignores a repeated attack on the same cell', () => {
    const state = newGame(seededRng(1))
    const c = unattackedCell(state, 'aiBoard')
    const once = humanAttack(state, c)
    const twiceAi = aiAttack(once, seededRng(2))
    const twice = humanAttack(twiceAi, c)
    expect(twice).toBe(twiceAi)
  })

  it('ignores human attacks when it is not their turn', () => {
    const state = newGame(seededRng(1))
    const afterHuman = humanAttack(state, unattackedCell(state, 'aiBoard'))
    const illegal = humanAttack(afterHuman, unattackedCell(afterHuman, 'aiBoard'))
    expect(illegal).toBe(afterHuman)
  })

  it('AI attack returns the turn to the human and never repeats a cell', () => {
    let state = newGame(seededRng(5))
    const rng = seededRng(6)
    for (let i = 0; i < 40 && !state.winner; i++) {
      state = humanAttack(state, unattackedCell(state, 'aiBoard'))
      state = aiAttack(state, rng)
      expect(state.turn).toBe('human')
    }
    const shots = state.humanBoard.shots.flat().filter((s) => s !== 'unknown').length
    expect(shots).toBe(40)
  })

  it('sinking one known enemy ship: hits, then sunk, remaining 5 -> 4, others untouched', () => {
    let state = newGame(seededRng(31))
    const rng = seededRng(32)
    const target = state.aiBoard.ships.find((s) => s.name === 'Cruiser')!
    const remaining = (s: GameState) => s.aiBoard.ships.filter((x) => !isSunk(x)).length
    expect(remaining(state)).toBe(5)

    target.cells.forEach((c, i) => {
      state = humanAttack(state, c, () => 0)
      const last = i === target.cells.length - 1
      expect(state.log[0]).toMatch(last ? /sunk the Cruiser/ : /: hit!$/)
      expect(state.quip).toBe(last ? 'Problem solved.' : 'Confirmed.')
      expect(remaining(state)).toBe(last ? 4 : 5)
      state = aiAttack(state, rng)
    })

    const cruiser = state.aiBoard.ships.find((s) => s.name === 'Cruiser')!
    expect(isSunk(cruiser)).toBe(true)
    expect(cruiser.hits).toBe(3)
    expect(state.aiBoard.ships.filter((s) => s.name !== 'Cruiser').every((s) => s.hits === 0)).toBe(true)
    expect(state.winner).toBeNull()
    expect(state.turn).toBe('human')
  })

  it('declares human victory when all AI ships are sunk and locks the game', () => {
    let state = newGame(seededRng(11))
    const rng = seededRng(12)
    while (!state.winner) {
      state = humanAttack(state, unattackedCell(state, 'aiBoard', true))
      if (!state.winner) state = aiAttack(state, rng)
    }
    expect(state.winner).toBe('human')
    expect(state.log[0]).toMatch(/sunk the/)
    // 17 ship cells, no misses needed
    expect(state.aiBoard.shots.flat().filter((s) => s === 'hit')).toHaveLength(17)

    const locked = humanAttack(state, unattackedCell(state, 'aiBoard'))
    expect(locked).toBe(state)
    expect(aiAttack(state, rng)).toBe(state)
  })

  it('declares AI victory when all human ships are sunk', () => {
    let state = newGame(seededRng(21))
    const rng = seededRng(22)
    let rounds = 0
    while (!state.winner && rounds < 100) {
      // human always misses so the AI must win eventually
      state = humanAttack(state, unattackedCell(state, 'aiBoard', false))
      state = aiAttack(state, rng)
      rounds++
    }
    expect(state.winner).toBe('ai')
    expect(state.turn).toBe('human')
    expect(humanAttack(state, unattackedCell(state, 'aiBoard'))).toBe(state)
  })
})
