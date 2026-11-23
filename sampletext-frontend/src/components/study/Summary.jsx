export default function Summary({ onSave, onQuestions }) {
  return (
    <section className="study-screen summary-layout" aria-label="Resumo de regra da cadeia">
      <article className="summary-paper">
        <h1>Regra da cadeia</h1>
        <p>
          A regra da cadeia é uma das regras fundamentais do cálculo diferencial.
          Ela é utilizada para encontrar a derivada de uma função composta,
          ou seja, uma função dentro de outra função.
        </p>

        <h2>O que é a regra da cadeia?</h2>
        <p>
          Em termos simples, ela nos ajuda a derivar uma função em camadas.
          Primeiro, derivamos a função de fora, mantendo a de dentro.
          Depois, multiplicamos pela derivada da função de dentro.
        </p>
        <p>Se y = f(g(x)), então:</p>
        <p className="summary-formula">y′ = f′(g(x)) · g′(x)</p>

        <h2>Como identificar as funções?</h2>
        <p>Considere a função y = (5x² + 3x³)³.</p>
        <ul>
          <li>Função de dentro: g(x) = 5x² + 3x³.</li>
          <li>Função de fora: f(u) = u³.</li>
        </ul>
        <p>
          Uma maneira prática de reconhecer a composição é imaginar o conteúdo
          dos parênteses como uma única variável.
        </p>

        <h2>Passo a passo</h2>
        <ol>
          <li>Identifique a função de fora e a função de dentro.</li>
          <li>Derive a função de fora, mantendo o conteúdo dos parênteses.</li>
          <li>Calcule a derivada da função de dentro.</li>
          <li>Multiplique as duas derivadas.</li>
        </ol>

        <h2>Exemplo: função polinomial composta</h2>
        <p>Para y = (5x² + 3x³)³, aplicamos a regra da potência em cada etapa:</p>
        <ul>
          <li>Derivada de fora: f′(u) = 3u².</li>
          <li>Derivada de dentro: g′(x) = 10x + 9x².</li>
        </ul>
        <p>Substituindo na fórmula:</p>
        <p className="summary-formula">y′ = 3(5x² + 3x³)² · (10x + 9x²)</p>

        <h2>Outros exemplos</h2>
        <ul>
          <li>Se y = (2x + 1)⁴, então y′ = 8(2x + 1)³.</li>
          <li>Se y = sen(x²), então y′ = cos(x²) · 2x.</li>
          <li>Se y = e³ˣ, então y′ = 3e³ˣ.</li>
        </ul>

        <h2>Lembre-se</h2>
        <p>
          Não se esqueça de multiplicar pela derivada da função de dentro.
          Se houver mais de duas camadas, repita a regra em cada uma delas,
          sempre de fora para dentro.
        </p>
      </article>

      <aside className="summary-actions" aria-label="Ações do resumo">
        <button className="button button-light" type="button" onClick={onQuestions} disabled={!onQuestions}>
          Perguntas
        </button>
        <button
          className="button button-light"
          type="button"
          onClick={onSave}
          disabled={!onSave}
        >
          Salvar
        </button>
      </aside>
    </section>
  )
}
