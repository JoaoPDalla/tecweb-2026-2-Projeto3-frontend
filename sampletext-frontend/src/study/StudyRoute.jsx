import { useEffect, useState, useSyncExternalStore } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../services/api.js'
import { StudyContext } from './StudyContext'
import StudyStatus from './StudyStatus'
import { chaveMaterial } from './material.js'
import { createStudyStore } from './studyStore.js'
import '../pages/Resumo.css'

export default function StudyRoute() {
  const { usuario } = useAuth()
  return <StudySession key={usuario.id ?? usuario.nome} />
}

function StudySession() {
  const [store] = useState(createStudyStore)
  const estado = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const [parametros] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  // A resolução existente navega sem query; enquanto o fluxo está aberto,
  // o contexto conserva o tema e o livro de origem.
  const explicito = parametros.has('tema') || parametros.has('conteudo')
  const podeReusar = !explicito && location.pathname !== '/resumo'
  const conteudoId = parametros.get('conteudo') ?? (podeReusar ? estado.conteudoId : null)
  const tema = parametros.get('tema') ?? (podeReusar ? estado.temaSolicitado : '')
  const livro = explicito ? parametros.get('livro') : podeReusar ? estado.livro : null
  const chave = conteudoId !== null || tema ? chaveMaterial(tema, conteudoId) : ''

  useEffect(() => store.connect(), [store])
  useEffect(() => { if (tema || conteudoId !== null) store.load(tema, { livro, conteudoId }) }, [store, tema, livro, conteudoId])

  const href = (caminho) => {
    const query = new URLSearchParams(conteudoId !== null ? { conteudo: conteudoId } : { tema: estado.temaSolicitado })
    if (estado.livro) query.set('livro', estado.livro)
    return `${caminho}?${query}`
  }
  const pronto = estado.status === 'ready' && estado.chave === chave && Boolean(chave)
  if (!pronto) {
    const erro = !chave ? new ApiError('Escolha um tema antes de abrir o material de estudo.', 400, 'tema_ausente')
      : estado.chave === chave ? estado.erro : null
    return <StudyStatus carregando={Boolean(chave) && !erro} tema={tema} reaberto={conteudoId !== null} erro={erro}
      onRetry={() => store.load(tema, { livro, conteudoId })}
      onChangeTheme={() => navigate('/inicio', { state: livro ? { livroId: livro } : null })} />
  }
  const novo = new URLSearchParams({ tema: estado.conteudo.tema })
  if (estado.livro) novo.set('livro', estado.livro)
  return <StudyContext.Provider value={{ conteudo: estado.conteudo, conteudoId, materialId: estado.materialId, livro: estado.livro, href,
    novoMaterialHref: `/resumo?${novo}`, salvos: estado.salvos, registrarSalvo: store.recordSaved }}><Outlet /></StudyContext.Provider>
}
