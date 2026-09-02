import { chooseAiTarget } from './ai'
import { allSunk, placeFleetRandomly, receiveAttack, type Rng } from './board'
import { quipFor } from './quips'
import type { AttackResult, Coord, GameState } from './types'

export function newGame(rng: Rng = Math.random): GameState {
  return {
    humanBoard: placeFleetRandomly(rng),
    aiBoard: placeFleetRandomly(rng),
    turn: 'human',
    winner: null,
    log: ['New game. Click the enemy waters to fire.'],
    quip: '',
  }
}

function describe(who: string, c: Coord, result: AttackResult): string {
  const cell = `${String.fromCharCode(65 + c.row)}${c.col + 1}`
  switch (result.kind) {
    case 'miss':
      return `${who} fired at ${cell}: miss.`
    case 'hit':
      return `${who} fired at ${cell}: hit!`
    case 'sunk':
      return `${who} fired at ${cell}: sunk the ${result.ship.name}!`
    case 'already-attacked':
      return `${who} fired at ${cell}: already attacked.`
  }
}

/** Human fires at the AI board. Returns the same state if the move is illegal. */
export function humanAttack(state: GameState, c: Coord, rng: Rng = Math.random): GameState {
  if (state.winner || state.turn !== 'human') return state

  const { board, result } = receiveAttack(state.aiBoard, c)
  if (result.kind === 'already-attacked') return state

  const winner = allSunk(board) ? 'human' : null
  return {
    ...state,
    aiBoard: board,
    turn: winner ? 'human' : 'ai',
    winner,
    log: [describe('You', c, result), ...state.log],
    quip: quipFor(result, rng),
  }
}

/** AI fires at the human board. */
export function aiAttack(state: GameState, rng: Rng = Math.random): GameState {
  if (state.winner || state.turn !== 'ai') return state

  const target = chooseAiTarget(state.humanBoard, rng)
  if (!target) return { ...state, turn: 'human' }

  const { board, result } = receiveAttack(state.humanBoard, target)
  const winner = allSunk(board) ? 'ai' : null
  return {
    ...state,
    humanBoard: board,
    turn: 'human',
    winner,
    log: [describe('Enemy', target, result), ...state.log],
  }
}
