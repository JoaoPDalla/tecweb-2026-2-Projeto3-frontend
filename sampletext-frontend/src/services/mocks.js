// Dados de exemplo usados enquanto o backend de resumo/perguntas não existe.
// O texto vem do Markdown + LaTeX que a IA vai devolver ($...$ inline, $$...$$ em bloco).

export const resumoMock = {
  id: 1,
  tema: 'Regra da cadeia',
  resumo: `A **Regra da Cadeia** é uma das regras fundamentais do cálculo diferencial. Ela é utilizada para encontrar a derivada de uma função composta, ou seja, uma função dentro de outra função (como $f(g(x))$).

## O que é a Regra da Cadeia?

Em termos simples, se você tem uma função que depende de um termo, e esse termo depende de $x$, a variação total de $y$ em relação a $x$ é o produto da variação de $y$ em relação ao termo intermediário pela taxa de variação desse termo em relação a $x$.

Na notação matemática, se $y = f(u)$ e $u = g(x)$, a derivada de $y$ em relação a $x$ é:

$$\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$$

Ou, na forma de função composta:

$$\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$$

> Dica mnemônica: derive a função de fora (mantendo a de dentro intacta) e multiplique pela derivada da função de dentro.

## Como aplicar (passo a passo)

1. Identifique a função composta: reconheça qual é a "função de fora" (a operação principal) e qual é a "função de dentro" (o argumento ou termo interno).
2. Derive a função de fora: aplique as regras normais de derivação à função externa, mas substitua o argumento interno por uma variável temporária.
3. Derive a função de dentro: encontre a derivada da parte interna em relação a $x$.
4. Multiplique os resultados: o resultado final é o produto do passo 2 pelo passo 3.

## Exemplos práticos

### Exemplo 1: função polinomial com expoente

Encontre a derivada de $f(x) = (3x^2 + 5)^4$.

- Função de fora: $u^4$ (cuja derivada é $4u^3$)
- Função de dentro: $u = 3x^2 + 5$ (cuja derivada é $6x$)

Aplicando a regra da cadeia:

$$f'(x) = 4(3x^2 + 5)^3 \\cdot (6x)$$

$$f'(x) = 24x(3x^2 + 5)^3$$

### Exemplo 2: função trigonométrica

Encontre a derivada de $f(x) = \\sin(4x^2)$.

- Função de fora: $\\sin(u)$ (cuja derivada é $\\cos(u)$)
- Função de dentro: $u = 4x^2$ (cuja derivada é $8x$)

Aplicando a regra da cadeia:

$$f'(x) = \\cos(4x^2) \\cdot (8x)$$

$$f'(x) = 8x \\cos(4x^2)$$`,
}

export const resolucaoMock = {
  numero: 1,
  total: 10,
  materia: 'Regra da cadeia',
  enunciado: 'Qual a derivada de $(5x^2 + 3x^3)^3$?',
  escolhida: {
    texto: '$3(5x^2 + 3x^3)^2$',
    explicacao:
      'Você derivou só a função de fora. Faltou multiplicar pela derivada da função de dentro, $10x + 9x^2$.',
  },
  correta: {
    texto: '$3(5x^2 + 3x^3)^2 \\cdot (10x + 9x^2)$',
    explicacao:
      'Pela regra da cadeia, derive a potência (função de fora) e multiplique pela derivada de $5x^2 + 3x^3$, que é $10x + 9x^2$.',
  },
}

// Livros de exemplo (menu lateral e tela do livro). Cada tópico vira um chip.
export const livrosMock = [
  {
    id: 1,
    nome: 'Cálculo I',
    topicos: [
      { id: 1, tema: 'Integral definida' },
      { id: 2, tema: 'Limite' },
      { id: 3, tema: 'Derivadas' },
    ],
  },
  {
    id: 2,
    nome: 'Química',
    topicos: [
      { id: 4, tema: 'Ligações químicas' },
      { id: 5, tema: 'Estequiometria' },
    ],
  },
  { id: 3, nome: 'História', topicos: [] },
]
