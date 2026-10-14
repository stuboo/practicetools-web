import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Quid6 from './index'

const OPTION_TEXT = ['None of the time', 'Rarely', 'Sometimes', 'Most of the time', 'All of the time']

// Locks the observable behavior of the /quid6 page (scores, diagnosis, score string).
async function answerAll(answers: number[]) {
  const user = userEvent.setup()
  render(<Quid6 />)
  await user.click(screen.getByRole('button', { name: 'Yes, proceed with questions' }))
  for (const value of answers) {
    await user.click(screen.getByRole('button', { name: OPTION_TEXT[value] }))
  }
}

describe('Quid6 page', () => {
  it('scores a stress-predominant answer set', async () => {
    await answerAll([3, 2, 1, 0, 1, 0])
    expect(screen.getByText('Stress Urinary Incontinence')).toBeInTheDocument()
    expect(screen.getByText('Recommendation: Schedule with surgeon')).toBeInTheDocument()
    expect(screen.getByText('SUI Score: 6')).toBeInTheDocument()
    expect(screen.getByText('UUI Score: 1')).toBeInTheDocument()
    expect(screen.getByText('QUID-6: 321010')).toBeInTheDocument()
  })

  it('scores an urge-predominant answer set', async () => {
    await answerAll([0, 1, 0, 4, 3, 2])
    expect(screen.getByText('Urge Urinary Incontinence')).toBeInTheDocument()
    expect(screen.getByText('Recommendation: Schedule with APP')).toBeInTheDocument()
    expect(screen.getByText('SUI Score: 1')).toBeInTheDocument()
    expect(screen.getByText('UUI Score: 9')).toBeInTheDocument()
    expect(screen.getByText('QUID-6: 010432')).toBeInTheDocument()
  })

  it('scores a mixed answer set', async () => {
    await answerAll([2, 2, 2, 3, 3, 3])
    expect(screen.getByText('Urge-Predominant Mixed Urinary Incontinence')).toBeInTheDocument()
    expect(screen.getByText('SUI Score: 6')).toBeInTheDocument()
    expect(screen.getByText('UUI Score: 9')).toBeInTheDocument()
  })
})
