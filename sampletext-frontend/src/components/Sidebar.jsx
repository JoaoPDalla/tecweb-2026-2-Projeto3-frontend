import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { aoMudarLivros, criarLivro, listarLivros } from '../services/livros'
import NomeModal from './NomeModal'
import './Sidebar.css'

// Menu lateral "Meus livros". Só é montado quando o menu está aberto,
// então a lista é buscada na primeira vez que o usuário o abre.
export default function Sidebar({ id }) {
  const navigate = useNavigate()
  const [estado, setEstado] = useState({ status: 'carregando' }) // carregando | erro | pronto
  const [tentativa, setTentativa] = useState(0)
  const [criando, setCriando] = useState(false)

  // Livro criado, renomeado ou excluído em qualquer tela: a lista se atualiza sozinha.
  useEffect(() => aoMudarLivros(() => setTentativa((n) => n + 1)), [])

  useEffect(() => {
    let cancelado = false
    listarLivros()
      .then((livros) => !cancelado && setEstado({ status: 'pronto', livros }))
      .catch(() => !cancelado && setEstado({ status: 'erro' }))
    return () => {
      cancelado = true
    }
  }, [tentativa])

  function tentarDeNovo() {
    setEstado({ status: 'carregando' })
    setTentativa((n) => n + 1)
  }

  function livroCriado(livro) {
    setCriando(false)
    navigate(`/livro/${livro.id}`) // o livro novo está vazio: o próximo passo é criar o primeiro conteúdo
  }

  return (
    <aside id={id} className="menu" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="menu__titulo">
        Meus livros:
      </h2>

      {estado.status === 'carregando' && (
        <p className="menu__aviso" role="status">
          Carregando…
        </p>
      )}

      {estado.status === 'erro' && (
        <div role="alert">
          <p className="menu__aviso">Não foi possível carregar os livros.</p>
          <button type="button" className="botao botao--claro menu__tentar" onClick={tentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado.status === 'pronto' && (
        <>
          {estado.livros.length === 0 ? (
            <p className="menu__aviso">Você ainda não tem livros. Crie o primeiro.</p>
          ) : (
            <nav aria-label="Livros">
              <ul className="menu__lista">
                {estado.livros.map((livro) => (
                  <li key={livro.id}>
                    <NavLink
                      to={`/livro/${livro.id}`}
                      className={({ isActive }) => `menu__livro${isActive ? ' menu__livro--ativo' : ''}`}
                    >
                      {livro.nome}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <button type="button" className="botao menu__novo" onClick={() => setCriando(true)}>
            Novo livro
          </button>
        </>
      )}

      {criando && (
        <NomeModal
          titulo="Novo livro"
          rotulo="Nome do livro"
          confirmar="Criar livro"
          aoEnviar={(nome, signal) => criarLivro(nome, { signal })}
          aoConcluir={livroCriado}
          aoFechar={() => setCriando(false)}
        />
      )}
    </aside>
  )
}
