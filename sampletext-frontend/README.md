# React + Vite

## Quiz com dados de exemplo — #14

A #14 fica em `src/quiz/`, separada das telas #5, #10 e #18:

- `quiz.js`: reducer puro, correção, pontuação, avanço, resolução e reinício.
- `exampleQuestions.js`: três questões de Regra da cadeia com alternativas e explicações fixas. Não chama IA ou API.
- `QuizSession.jsx`: mantém a tentativa em memória entre as rotas do quiz.
- `QuizPages.jsx`: conecta os contratos das telas às ações do controlador e reutiliza a página `Resolucao` existente, sem editar seu código.

Executar `npm run dev` e abrir `/pergunta`, ou usar o botão Perguntas do resumo
existente. O quiz sempre usa os três exemplos de Regra da cadeia, independentemente
do conteúdo solicitado no resumo. A integração com dados reais permanece na #16.

Uma confirmação correta vale um ponto e avança. Uma incorreta abre a resolução
e só avança quando o estudante clica em Próxima pergunta. Isso também vale para
a última pergunta: a resolução aparece antes do resultado. O percentual final
é a proporção de acertos arredondada ao inteiro mais próximo, com pesos iguais.
Refazer limpa respostas e pontuação e retorna à primeira pergunta.

`/resultado` recebe apenas a nota já calculada; suas telas não foram alteradas.
Voltar pelo histórico não soma pontos nem permite pular questões. A tentativa
não é persistida: recarregar a página ou sair do fluxo inicia uma nova sessão.

As únicas alterações no fluxo compartilhado são os registros de rotas em
`App.jsx`. Login, resumo, resolução, barra, estilos globais e serviços existentes
permanecem inalterados.

Testar as regras sem navegador ou dependências adicionais:

```sh
node --test src/quiz/quiz.test.js
```

## Telas de estudo — Ma7zz (#5, #10 e #18)

Esta entrega adiciona componentes isolados em `src/components/study/`:

- **#5:** `Summary` e `Solution` são apresentações estáticas do Figma. Não substituem as páginas integradas de resumo e resolução.
- **#10:** `Question` permite selecionar uma alternativa por mouse/teclado, trocar a seleção antes da confirmação e confirmar sem envio duplicado. Mantém a seleção quando a confirmação falha e permite tentar novamente.
- **#18:** `QuizResult` apresenta contagens e percentual recebidos prontos, mensagem opcional e ações externas de refazer/voltar. Também trata resultado indisponível.

O `App`, as rotas existentes, o login, a barra superior, as páginas integradas,
os serviços e os estilos globais permanecem inalterados. A prévia reutiliza o
`Layout` existente, e os estilos das telas consomem as variáveis de tema do projeto.

### Revisar a prévia

Executar `npm ci` e `npm run dev`, e abrir `/preview-ma7zz.html` no endereço
informado pelo Vite. Essa entrada é independente da aplicação principal.

As abas mostram resumo, pergunta, solução e resultado final. Na pergunta,
é possível simular falha de confirmação ou limpar a seleção. O adaptador de
exemplo somente registra os IDs recebidos, sem HTTP, correção ou avanço do quiz.
Os resultados de exemplo são independentes dessa escolha. A ação Refazer apenas
registra o pedido na prévia, sem implementar o reinício real.

O build padrão continua gerando a aplicação principal. Para compilar também
a entrada de revisão, executar após `npm run build`:

```sh
node --input-type=module -e "import { build } from 'vite'; await build({ build: { outDir: 'dist/preview-ma7zz', rolldownOptions: { input: 'preview-ma7zz.html' } } });"
```

### Integrar Question (#10)

Importar `Question` e `StudyScreens.css` de `src/components/study/`.

```jsx
<Question
  question={{ id: 'q1', topic: 'Regra da cadeia', prompt: 'Enunciado', answers: [
    { id: 'a', text: 'Alternativa A' },
    { id: 'b', text: 'Alternativa B' },
  ] }}
  number={1}
  total={10}
  onSubmitAnswer={handleSubmitAnswer}
/>
```

- `question.id` deve ser estável e mudar para uma nova pergunta. A troca limpa
  a seleção local e o estado de confirmação, sem decidir a sequência do quiz.
- `onSubmitAnswer` recebe `{ questionId, answerId }`, sem a alternativa correta.
  Pode retornar uma promessa: resolução confirma o envio; rejeição mantém a
  seleção e apresenta a opção de tentar novamente.
- Para controlar a escolha por fora, passar `selectedAnswerId` e
  `onAnswer(answerId)`. Nesse modo o consumidor limpa a seleção externa ao trocar
  a pergunta. `disabled` bloqueia a interação.

### Integrar QuizResult (#18)

Importar `QuizResult` e o mesmo `StudyScreens.css`.

```jsx
<QuizResult
  result={{
    topic: 'Regra da cadeia',
    totalQuestions: 10,
    correctAnswers: 7,
    incorrectAnswers: 2,
    unansweredQuestions: 1,
    scorePercentage: 70,
    summary: 'Mensagem opcional recebida do controlador.',
  }}
  onRetry={handleRetry}
  onBackToSummary={handleBackToSummary}
/>
```

Os totais devem ser números válidos e o percentual deve estar entre 0 e 100.
`result={null}` apresenta o estado indisponível. Os callbacks notificam o
consumidor; a tela não limpa sessão, inicia perguntas nem decide rotas.

### Limite com a #14

As telas de `components/study/` recebem perguntas e callbacks e não corrigem,
calculam notas ou escolhem a sequência. Essas regras ficam no controlador
`src/quiz/` da #14, documentado acima. A conexão à API e à IA continua na #16.

## Informações do template

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
