import { useEffect, useState, useSyncExternalStore } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { createPersistentQuiz } from './persistentQuiz.js'
import { QuizContext } from './QuizContext'
import { useStudy } from '../study/useStudy'
import StudyStatus from '../study/StudyStatus'
import { ApiError } from '../services/api.js'

export function QuizSession() {
  const { conteudo, materialId, novoMaterialHref } = useStudy()
  const navigate = useNavigate()
  if (!conteudo.perguntas.length) return <StudyStatus
    erro={new ApiError('Este resumo ainda não tem perguntas vinculadas. Você pode gerar um novo material para praticar.', 422, 'perguntas_indisponiveis')}
    onChangeTheme={() => navigate('/inicio')} onGenerate={() => navigate(novoMaterialHref)} />
  return <QuizAttempt key={materialId} perguntas={conteudo.perguntas} />
}

function QuizAttempt({ perguntas }) {
  const [store] = useState(() => createPersistentQuiz(perguntas))
  const { state, pending, error } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => store.connect(), [store])
  return <QuizContext.Provider value={{ state, dispatch: store.dispatch, submitAnswer: store.submitAnswer,
    pending, error }}><Outlet /></QuizContext.Provider>
}
