import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import SalvarModal from '../components/SalvarModal'
import { useResumo } from '../study/useResumo'
import './Resumo.css'

// O adaptador da #16 fornece o material; o visual e o modal existentes são reutilizados.
export default function Resumo() {
  const navigate = useNavigate()
  const { conteudo, statusSalvar, salvar, irParaPerguntas, mensagemSalvar, reaberto, livroSalvo,
    escolhendoLivro, guardar, salvoNoModal, fecharModal } = useResumo()

  return (
    <Layout>
      <main className="resumo">
        <article className="resumo__papel">
          <h1 className="resumo__titulo">{conteudo.tema}</h1>
          <Markdown>{conteudo.resumo}</Markdown>
        </article>

        <div className="resumo__lateral">
          <aside className="resumo__acoes" aria-label="Ações do resumo">
            <button type="button" className="botao botao--claro" onClick={irParaPerguntas}>
              Perguntas
            </button>
            <button
              type="button"
              className="botao botao--claro"
              disabled={statusSalvar === 'salvando' || statusSalvar === 'salvo'}
              onClick={salvar}
            >
              {statusSalvar === 'salvo' ? 'Salvo' : 'Salvar'}
            </button>
            {statusSalvar === 'salvo' && livroSalvo && (
              <button type="button" className="botao botao--claro" onClick={() => navigate('/livro/' + livroSalvo)}>
                Ver livro
              </button>
            )}
          </aside>
          <p className="resumo__aviso" role="status">
            {statusSalvar === 'salvando' && 'Salvando…'}
            {statusSalvar === 'salvo' && !reaberto && 'Resumo salvo.'}
            {statusSalvar === 'erro' && mensagemSalvar}
          </p>
        </div>
      </main>

      {escolhendoLivro && (
        <SalvarModal aoSalvar={guardar} aoConcluir={salvoNoModal} aoFechar={fecharModal} />
      )}
    </Layout>
  )
}
