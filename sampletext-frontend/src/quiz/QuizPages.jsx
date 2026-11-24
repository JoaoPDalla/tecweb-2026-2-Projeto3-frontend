import { useEffect, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Question from '../components/study/Question'
import QuizResult from '../components/study/QuizResult'
import Resolucao from '../pages/Resolucao'
import { useQuizSession } from './QuizSession'
import { getCurrentQuestion, getQuizResult, getResolution } from './quiz'
import '../components/study/StudyScreens.css'
import './QuizPages.css'

export function QuizQuestionPage() {
  const { state, dispatch } = useQuizSession()
  const location = useLocation()
  const navigate = useNavigate()
  const mainRef = useRef(null)
  // A página existente de resolução devolve { proxima: numero + 1 }.
  // Consumimos esse sinal uma vez; a regra de avanço permanece no reducer.
  const continueFromResolution = state.phase === 'resolution' && location.state?.proxima === state.position + 2

  useEffect(() => {
    if (continueFromResolution) {
      dispatch({ type: 'continue' })
      navigate('/pergunta', { replace: true, state: null })
    }
  }, [continueFromResolution, dispatch, navigate])

  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [state.position, state.attempt])

  if (state.phase === 'finished') return <Navigate to="/resultado" replace />
  if (state.phase === 'resolution') {
    if (continueFromResolution) return <p role="status">Abrindo a próxima etapa…</p>
    return <Navigate to="/resolucao" replace state={{ resultado: getResolution(state), quizQuestionId: state.questions[state.position].id, quizAttempt: state.attempt, quizAnswerId: state.answers[state.answers.length - 1].answerId }} />
  }

  return (
    <Layout>
      <main className="quiz-session-page" tabIndex={-1} ref={mainRef}>
        <p className="quiz-session-note">Quiz de exemplo · Regra da cadeia</p>
        <Question
          key={`${state.attempt}-${state.position}`}
          question={getCurrentQuestion(state)}
          number={state.position + 1}
          total={state.questions.length}
          onSubmitAnswer={({ questionId, answerId }) => dispatch({ type: 'answer', questionId, answerId })}
        />
      </main>
    </Layout>
  )
}

export function QuizResolutionPage() {
  const { state } = useQuizSession()
  const location = useLocation()
  if (state.phase !== 'resolution') return <Navigate to={state.phase === 'finished' ? '/resultado' : '/pergunta'} replace />
  const questionId = state.questions[state.position].id
  const answerId = state.answers[state.answers.length - 1].answerId
  if (location.state?.quizQuestionId !== questionId || location.state?.quizAttempt !== state.attempt || location.state?.quizAnswerId !== answerId) {
    return <Navigate to="/resolucao" replace state={{ resultado: getResolution(state), quizQuestionId: questionId, quizAttempt: state.attempt, quizAnswerId: answerId }} />
  }
  // Reutiliza a página e o botão de próxima pergunta do Luan, sem modificá-los.
  return <Resolucao />
}

export function QuizResultPage() {
  const { state, dispatch } = useQuizSession()
  const navigate = useNavigate()
  const mainRef = useRef(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [])
  if (state.phase !== 'finished') return <Navigate to="/pergunta" replace />
  return (
    <Layout>
      <main className="quiz-session-page" tabIndex={-1} ref={mainRef}>
        <p className="quiz-session-note">Quiz de exemplo · tentativa concluída</p>
        <QuizResult
          result={getQuizResult(state)}
          onRetry={() => {
            dispatch({ type: 'restart' })
            navigate('/pergunta', { replace: true, state: null })
          }}
          onBackToSummary={() => navigate(`/resumo?${new URLSearchParams({ tema: state.questions[0]?.topic ?? 'Regra da cadeia' })}`)}
        />
      </main>
    </Layout>
  )
}
