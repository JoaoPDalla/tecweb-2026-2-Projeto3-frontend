import { useContext } from 'react'
import { QuizContext } from './QuizContext'

export function useQuizSession() {
  const session = useContext(QuizContext)
  if (!session) throw new Error('Esta tela precisa estar dentro de QuizSession.')
  return session
}
