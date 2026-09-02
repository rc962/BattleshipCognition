import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

function enemyCells() {
  const section = screen.getByRole('heading', { name: /Enemy waters/ }).closest('section')!
  return within(section).getAllByRole('button')
}

function ownCells() {
  const section = screen.getByRole('heading', { name: /Your fleet/ }).closest('section')!
  return within(section).getAllByRole('button')
}

const marked = (cells: HTMLElement[]) =>
  cells.filter((c) => /\b(miss|hit|sunk)\b/.test(c.className))

describe('App', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows own ships and hides enemy ships', () => {
    render(<App />)
    expect(ownCells().filter((c) => c.classList.contains('ship'))).toHaveLength(17)
    expect(enemyCells().filter((c) => c.classList.contains('ship'))).toHaveLength(0)
  })

  it('shows a 5 / 5 badge per board, plain fleet rows and one shared legend', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Battleship by Raja')
    expect(screen.getByRole('heading', { name: /Your fleet/ })).toHaveTextContent('5 / 5')
    expect(screen.getByRole('heading', { name: /Enemy waters/ })).toHaveTextContent('5 / 5')
    expect(screen.getAllByText('Afloat')).toHaveLength(10)
    expect(document.querySelectorAll('.legend')).toHaveLength(1)
  })

  it('shows a deadpan quip after each shot', () => {
    render(<App />)
    expect(document.querySelector('.quip')).toBeNull()
    fireEvent.click(enemyCells()[0])
    expect(document.querySelector('.quip')?.textContent?.trim()).toMatch(/\.$/)
    expect(document.querySelector('.result')?.textContent).toMatch(/^You fired at A1/)
  })

  it('locks the enemy board during the AI turn, then the AI fires back', () => {
    render(<App />)
    const cells = enemyCells()
    fireEvent.click(cells[0])

    expect(marked(cells)).toHaveLength(1)
    expect(cells[0]).toBeDisabled()
    expect(screen.getByText(/Enemy is firing/)).toBeInTheDocument()
    expect(cells.every((c) => c.hasAttribute('disabled'))).toBe(true)

    fireEvent.click(cells[1]) // ignored: not our turn
    expect(marked(cells)).toHaveLength(1)

    act(() => vi.advanceTimersByTime(600))
    expect(marked(ownCells())).toHaveLength(1)
    expect(screen.getByText(/Your turn/)).toBeInTheDocument()
    expect(cells[1]).toBeEnabled()
    expect(cells[0]).toBeDisabled()
  })

  it('New Game resets both boards and cancels a pending AI shot', () => {
    render(<App />)
    fireEvent.click(enemyCells()[5])
    fireEvent.click(screen.getByRole('button', { name: 'New Game' }))
    act(() => vi.advanceTimersByTime(1000))

    expect(marked(enemyCells())).toHaveLength(0)
    expect(marked(ownCells())).toHaveLength(0)
    expect(screen.getByText(/Your turn/)).toBeInTheDocument()
  })
})
