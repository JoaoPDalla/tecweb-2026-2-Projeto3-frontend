import { createContext, useContext, useReducer } from 'react'
import { Outlet } from 'react-router-dom'
import { createQuizState, quizReducer } from './quiz'
import { exampleQuestions } from './exampleQuestions'

const QuizContext = createContext(null)

export function QuizSession() {
  const [state, dispatch] = useReducer(quizReducer, exampleQuestions, createQuizState)
  return <QuizContext.Provider value={{ state, dispatch }}><Outlet /></QuizContext.Provider>
}

export function useQuizSession() {
  const session = useContext(QuizContext)
  if (!session) throw new Error('Esta tela precisa estar dentro de QuizSession.')
  return session
}
