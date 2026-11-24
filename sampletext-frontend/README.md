# React + Vite

## Integração do resumo e quiz — #16

O fluxo de estudo usa a API para validar o tema e carregar um resumo com dez
perguntas. Resumo, resolução e resultado compartilham o mesmo material; erros
não são substituídos por exemplos. A reabertura por ID e o modal de salvar da
entrega de livros/conteúdos foram preservados. Configure `VITE_API_URL` e
`VITE_USAR_MOCK=false` para usar também o CRUD real. Consulte os contratos e
limites em [integração de estudo](docs/integracao-estudo.md).

Salvar agora inclui as dez perguntas do material. O quiz registra cada escolha
no histórico da API antes de avançar e permite reenviar sem duplicar registros.
Atualize também o backend e execute `python manage.py migrate` para aplicar a
migração `0005_persistencia_quiz`.

## Sessão e HTTP — #6 e #12

As rotas de estudo agora validam a sessão com o backend. O contexto compartilha
o usuário, restaura o login e acompanha a saída em outras abas. O cliente HTTP
trata erros, timeout, cancelamento e expiração de token. Execute `npm test` para
verificar as regras. Configuração e uso: [sessão e HTTP](docs/sessao-http.md).

## Busca, menu lateral e tela do livro (#3, #7 e #13)

- `/inicio` (`pages/Inicio.jsx`): tela "O que vamos estudar hoje?". Valida o tema e, se servir, abre `/resumo?tema=...`. O login agora leva para ela. Estados: carregando ("Verificando o tema…"), tema amplo ("Cálculo I é um tema muito amplo, destrinche", com o campo limpo), matéria inválida (mantém o texto para corrigir), campo vazio e erro de conexão (com "Tentar de novo").
- `/livro/:id` (`pages/Livro.jsx`): tópicos do livro como chips (cada um abre o resumo do tema) e botão "Novo conteúdo", que volta à busca. Livro sem tópicos, livro inexistente (404) e erro de rede têm mensagem própria.
- `components/Sidebar.jsx`: menu "Meus livros", com o livro aberto destacado. O `Layout` controla se ele está aberto, pelo botão da barra ou pela tecla Esc, e lembra o estado ao trocar de tela (`sessionStorage`).
- `components/TopBar.jsx` (#3): o botão de menu agora funciona e informa `aria-expanded`; a marca "SampleText" leva a `/inicio`.
- `services/livros.js`: `listarLivros`, `buscarLivro` e `validarTema`. Com `VITE_USAR_MOCK` ligado (padrão) usam `livrosMock` e `services/temas.js`. As rotas reais estão marcadas com `TODO` (#9 do backend e validação do tema):
  `GET /livros/`, `GET /livros/:id/` e `POST /conteudos/validar-tema/` (resposta `{ status: 'ok' | 'amplo' | 'invalido', tema? }`).

## Fluxo completo da busca, livros e conteúdos salvos

- Busca: `POST /conteudos/validar-tema/` → se `amplo`, o campo é limpo e o usuário digita um subtópico, validado de novo → `ok` abre `/resumo?tema=...` (`POST /conteudos/gerar/`).
- Salvar o resumo: `SalvarModal` escolhe um livro existente ou cria um novo (`POST /livros/` + `POST /conteudos/`). Com `?livro=<id>` salva direto.
- Reabrir: chips do livro abrem `/resumo?conteudo=<id>` (`GET /conteudos/:id/`).
- Gerenciar: botão "Gerenciar" na tela do livro permite renomear/excluir livro e conteúdos (`PATCH`/`DELETE`).
- Menu lateral: lista os livros e tem "Novo livro" (modal); atualiza sozinho ao criar/renomear/excluir.
- **API real:** defina `VITE_USAR_MOCK=false` e `VITE_API_URL` no `.env`. Sem isso o app usa dados de exemplo (`services/lojaMock.js`).
- Testes: `node --test` (sem argumentos) roda `livros.test.js` e os demais.

No modo mock, testar na busca: `Cálculo I` ou `Química` (tema amplo), `qwrtp` (inválido) e `Regra da cadeia` (válido).

Testar as regras de classificação do tema sem navegador:

```sh
node --test src/services/temas.test.js
```


## Controlador do quiz — #14

A #14 fica em `src/quiz/`, separada das telas #5, #10 e #18:

- `quiz.js`: reducer puro, correção, pontuação, avanço, resolução e reinício.
- `exampleQuestions.js`: três questões fixas usadas somente nos testes do controlador.
- `QuizSession.jsx`: mantém a tentativa em memória entre as rotas do quiz.
- `QuizPages.jsx`: conecta os contratos das telas às ações do controlador e reutiliza a página `Resolucao` existente, sem editar seu código.

Executar `npm run dev`, entrar e escolher um tema na busca. O botão Perguntas do
resumo abre o quiz com os dados carregados pela #16. As URLs do quiz preservam
o tema ou o ID do conteúdo salvo para identificar a origem do material.

Uma confirmação correta vale um ponto e avança. Uma incorreta abre a resolução
e só avança quando o estudante clica em Próxima pergunta. Isso também vale para
a última pergunta: a resolução aparece antes do resultado. O percentual final
é a proporção de acertos arredondada ao inteiro mais próximo, com pesos iguais.
Refazer limpa respostas e pontuação e retorna à primeira pergunta.

`/resultado` recebe apenas a nota já calculada; suas telas não foram alteradas.
Voltar pela navegação do navegador não soma pontos nem permite pular questões.
O progresso da tentativa fica em memória: recarregar a página ou sair do fluxo
inicia uma nova sessão, preservando as respostas já confirmadas no histórico da API.

A correção e a pontuação permanecem isoladas em `src/quiz/quiz.js`; esse módulo
não importa React, navegação ou serviços HTTP.

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
