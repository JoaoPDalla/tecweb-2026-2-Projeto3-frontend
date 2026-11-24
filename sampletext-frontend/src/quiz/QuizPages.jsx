import { useEffect, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import Question from '../components/study/Question'
import QuizResult from '../components/study/QuizResult'
import Resolucao from '../pages/Resolucao'
import { useQuizSession } from './useQuizSession'
import { useStudy } from '../study/useStudy'
import { getCurrentQuestion, getQuizResult, getResolution } from './quiz'
import '../components/study/StudyScreens.css'
import './QuizPages.css'

export function QuizQuestionPage() {
  const { href } = useStudy()
  const rotaPergunta = href('/pergunta')
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
      navigate(rotaPergunta, { replace: true, state: null })
    }
  }, [continueFromResolution, dispatch, navigate, rotaPergunta])

  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [state.position, state.attempt])

  if (state.phase === 'finished') return <Navigate to={href('/resultado')} replace />
  if (state.phase === 'resolution') {
    if (continueFromResolution) return <p role="status">Abrindo a próxima etapa…</p>
    return <Navigate to={href('/resolucao')} replace state={{ resultado: getResolution(state), quizQuestionId: state.questions[state.position].id, quizAttempt: state.attempt, quizAnswerId: state.answers[state.answers.length - 1].answerId }} />
  }

  return (
    <Layout>
      <main className="quiz-session-page" tabIndex={-1} ref={mainRef}>
        <p className="quiz-session-note">{state.questions[0].topic} · Perguntas</p>
        <Question
          key={`${state.attempt}-${state.position}`}
          question={getCurrentQuestion(state)}
          renderText={(texto) => <Markdown inline>{texto}</Markdown>}
          number={state.position + 1}
          total={state.questions.length}
          onSubmitAnswer={({ questionId, answerId }) => dispatch({ type: 'answer', questionId, answerId })}
        />
      </main>
    </Layout>
  )
}

export function QuizResolutionPage() {
  const { href } = useStudy()
  const { state } = useQuizSession()
  const location = useLocation()
  if (state.phase !== 'resolution') return <Navigate to={href(state.phase === 'finished' ? '/resultado' : '/pergunta')} replace />
  const questionId = state.questions[state.position].id
  const answerId = state.answers[state.answers.length - 1].answerId
  if (location.state?.quizQuestionId !== questionId || location.state?.quizAttempt !== state.attempt || location.state?.quizAnswerId !== answerId) {
    return <Navigate to={href('/resolucao')} replace state={{ resultado: getResolution(state), quizQuestionId: questionId, quizAttempt: state.attempt, quizAnswerId: answerId }} />
  }
  // Reutiliza a página e o botão de próxima pergunta do Luan, sem modificá-los.
  return <Resolucao />
}

export function QuizResultPage() {
  const { href } = useStudy()
  const { state, dispatch } = useQuizSession()
  const navigate = useNavigate()
  const mainRef = useRef(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [])
  if (state.phase !== 'finished') return <Navigate to={href('/pergunta')} replace />
  return (
    <Layout>
      <main className="quiz-session-page" tabIndex={-1} ref={mainRef}>
        <p className="quiz-session-note">{state.questions[0].topic} · Tentativa concluída</p>
        <QuizResult
          result={getQuizResult(state)}
          onRetry={() => {
            dispatch({ type: 'restart' })
            navigate(href('/pergunta'), { replace: true, state: null })
          }}
          onBackToSummary={() => navigate(href('/resumo'))}
        />
      </main>
    </Layout>
  )
}
