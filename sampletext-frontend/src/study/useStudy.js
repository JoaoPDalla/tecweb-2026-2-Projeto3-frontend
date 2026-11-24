import { useContext } from 'react'
import { StudyContext } from './StudyContext'

export function useStudy() {
  const estudo = useContext(StudyContext)
  if (!estudo) throw new Error('O material de estudo precisa ser carregado antes de abrir esta tela.')
  return estudo
}
