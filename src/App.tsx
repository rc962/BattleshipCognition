import { useEffect, useState } from 'react'
import { BoardView, Legend } from './components/BoardView'
import { FleetStatus } from './components/FleetStatus'
import { aiAttack, humanAttack, newGame } from './game/engine'
import type { Coord } from './game/types'

const AI_DELAY_MS = 500

export default function App() {
  const [state, setState] = useState(newGame)

  useEffect(() => {
    if (state.turn !== 'ai' || state.winner) return
    const id = setTimeout(() => setState((s) => aiAttack(s)), AI_DELAY_MS)
    return () => clearTimeout(id)
  }, [state.turn, state.winner])

  const fire = (c: Coord) => setState((s) => humanAttack(s, c))

  const status = state.winner
    ? state.winner === 'human'
      ? 'Victory. The enemy fleet is gone.'
      : 'Defeat. Your fleet has been sunk.'
    : state.turn === 'human'
      ? 'Your turn. Pick a target in enemy waters.'
      : 'Enemy is firing…'

  return (
    <main>
      <header>
        <h1>Battleship by Raja</h1>
        <button type="button" className="new-game" onClick={() => setState(newGame())}>
          New Game
        </button>
      </header>

      <div className="status-row">
        <p className={`status${state.winner ? ` ${state.winner}` : ''}`}>{status}</p>
        <p className="result" aria-live="polite">
          {state.log.find((entry) => entry.startsWith('You')) ?? ''}
          {state.quip && <span className="quip"> {state.quip}</span>}
        </p>
      </div>

      <div className="boards">
        <div>
          <BoardView title="Your fleet" board={state.humanBoard} revealShips />
          <FleetStatus board={state.humanBoard} showDamage />
        </div>
        <div>
          <BoardView
            title="Enemy waters"
            board={state.aiBoard}
            revealShips={false}
            onCellClick={fire}
            disabled={state.turn !== 'human' || state.winner !== null}
          />
          <FleetStatus board={state.aiBoard} showDamage={false} />
        </div>
      </div>

      <Legend showShip />

      <ul className="log">
        {state.log.slice(0, 6).map((entry, i) => (
          <li key={`${state.log.length - i}`}>{entry}</li>
        ))}
      </ul>
    </main>
  )
}
