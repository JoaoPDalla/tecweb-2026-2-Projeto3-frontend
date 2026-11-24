import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { validarTema } from '../services/livros'
import './Inicio.css'

const TITULO_PADRAO = 'O que vamos estudar hoje?'
const PLACEHOLDER_PADRAO = 'Ex: Trigonometria'
const PLACEHOLDER_AMPLO = 'Ex: Regra da Cadeia'
const DICA_INVALIDO = 'Tente algo como Trigonometria ou Regra da Cadeia.'
const DICA_AMPLO = 'Escolha um assunto mais específico dentro dele.'

// Tela de busca: valida o tema; se for amplo demais, pede um subtópico e valida de novo;
// quando o tema serve, abre o resumo. O mesmo campo serve para as duas rodadas.
// Estados: ocioso | vazio | carregando | amplo | invalido | erro
export default function Inicio() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const livroId = state?.livroId // vem do "Novo conteúdo" da tela do livro

  const [tema, setTema] = useState('')
  const [estado, setEstado] = useState({ status: 'ocioso' })
  const pedidoAtual = useRef(0) // resultados de pedidos antigos são ignorados
  const controlador = useRef(null) // cancela a validação em andamento ao sair da tela

  useEffect(() => {
    return () => {
      pedidoAtual.current += 1
      controlador.current?.abort()
    }
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    const temaLimpo = tema.trim().replace(/\s+/g, ' ')
    if (!temaLimpo) {
      setEstado({ status: 'vazio' })
      return
    }

    const pedido = ++pedidoAtual.current
    controlador.current = new AbortController()
    setEstado({ status: 'carregando' })
    try {
      const resposta = await validarTema(temaLimpo, { signal: controlador.current.signal })
      if (pedido !== pedidoAtual.current) return

      if (resposta.status === 'ok') {
        const parametros = new URLSearchParams({ tema: temaLimpo })
        if (livroId) parametros.set('livro', livroId) // o resumo salva direto neste livro
        navigate(`/resumo?${parametros}`)
        return
      }

      if (resposta.status === 'amplo') setTema('') // campo limpo, pronto para o subtópico
      setEstado({ status: resposta.status, tema: resposta.tema ?? temaLimpo, motivo: resposta.motivo })
    } catch (e) {
      if (pedido === pedidoAtual.current && e?.name !== 'AbortError') setEstado({ status: 'erro', mensagem: e.message })
    }
  }

  function aoDigitar(evento) {
    setTema(evento.target.value)
    if (estado.status === 'vazio') setEstado({ status: 'ocioso' })
  }

  const { status } = estado
  const carregando = status === 'carregando'
  const amplo = status === 'amplo'

  let titulo = TITULO_PADRAO
  if (amplo) titulo = `${estado.tema} é um tema muito amplo, destrinche`
  if (status === 'invalido') titulo = `“${estado.tema}” não parece uma matéria de estudo`

  // O motivo vem da IA do backend; sem ele, usa uma dica fixa.
  let aviso = null
  if (carregando) aviso = { texto: 'Verificando o tema…', papel: 'status' }
  if (status === 'vazio') aviso = { texto: 'Digite um tema para começar.', papel: 'alert', erro: true }
  if (amplo) aviso = { texto: estado.motivo || DICA_AMPLO, papel: 'status' }
  if (status === 'invalido') aviso = { texto: estado.motivo || DICA_INVALIDO, papel: 'status' }
  if (status === 'erro') aviso = { texto: estado.mensagem, papel: 'alert', erro: true }

  return (
    <Layout>
      <main className="inicio">
        <form className="inicio__form" onSubmit={enviar} noValidate aria-busy={carregando}>
          <div aria-live="polite">
            <label className="titulo-pagina" htmlFor="tema">
              {titulo}
            </label>
          </div>

          <input
            id="tema"
            className="inicio__campo"
            type="text"
            name="tema"
            autoComplete="off"
            autoFocus
            maxLength={100}
            placeholder={amplo ? PLACEHOLDER_AMPLO : PLACEHOLDER_PADRAO}
            value={tema}
            onChange={aoDigitar}
            readOnly={carregando}
            aria-invalid={status === 'vazio' || status === 'invalido' ? 'true' : undefined}
            aria-describedby={aviso ? 'tema-aviso' : undefined}
          />

          {aviso && (
            <p
              id="tema-aviso"
              className={`inicio__aviso${aviso.erro ? ' inicio__aviso--erro' : ''}`}
              role={aviso.papel}
            >
              {aviso.texto}
            </p>
          )}

          {status === 'erro' && (
            <button type="submit" className="botao botao--escuro">
              Tentar de novo
            </button>
          )}
        </form>
      </main>
    </Layout>
  )
}
