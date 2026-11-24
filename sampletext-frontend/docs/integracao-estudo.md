# Resumo e quiz com dados do backend — #16

## Fluxo

1. A busca existente consulta `POST /api/conteudos/validar-tema/` pelo serviço
   `services/geracao.js`. Os estados `ok`, `amplo` e `invalido` continuam sendo
   apresentados pela tela de busca existente.
2. `/resumo?tema=...` solicita `POST /api/conteudos/gerar/` com `{tema}`. A resposta
   é validada antes de renderizar o resumo ou iniciar o quiz.
3. Resumo, perguntas, resolução e resultado compartilham o mesmo objeto
   `{tema, resumo, perguntas}` durante o fluxo. As dez perguntas e suas explicações
   vêm do backend. O quiz usa o controlador puro da #14, sem correção nas telas.
4. Voltar ao resumo ou refazer o quiz reaproveita esse material, sem outro pedido
   de geração. O tema e o livro de origem são preservados nos links e na navegação
   da resolução existente, inclusive quando ela devolve uma URL sem parâmetros.

A geração e a validação do tema no fluxo da #16 sempre usam a API; não há troca
silenciosa pelos exemplos antigos quando ocorre um erro. `exampleQuestions.js`
continua disponível apenas para os testes do controlador.

## Separação de responsabilidades

- `services/geracao.js`: transporte e contratos dos dois endpoints da IA.
- `study/material.js`: verificação da resposta e orientação para os erros.
- `study/studyStore.js`: carregamento, deduplicação, cancelamento e material ativo,
  independente de React. Um pedido atrasado não substitui o tema atual. Os efeitos
  duplicados do StrictMode compartilham um único pedido.
- `study/StudyRoute.jsx`: liga a URL e a sessão autenticada ao carregamento do
  material. O estado é descartado ao sair do fluxo ou trocar de usuário.
- `study/useResumo.js`: adapta as ações do resumo ao carregamento e ao salvamento
  existentes. A tela conserva sua apresentação e o modal de escolha de livro.
- `quiz/QuizSession.jsx` e `QuizPages.jsx`: entregam as perguntas reais ao reducer
  da #14 e os dados de apresentação às telas. Markdown/LaTeX são renderizados
  pelo componente Markdown já existente, por um callback de apresentação.

`quiz/quiz.js`, as regras de pontuação e os componentes de resolução/resultado
não foram reescritos. As mudanças na busca se limitam à importação do serviço real.
Os serviços de CRUD (`conteudos.js`, `livros.js`), telas de livro, menu e modais
da entrega dos outros integrantes permanecem preservados.

## Conteúdos salvos e limites do backend

`/resumo?conteudo=<id>` continua reabrindo o resumo pelo serviço existente, sem
gerar ou substituir seu texto. Se houver perguntas vinculadas, o quiz usa a lista
retornada pelo backend, com sua quantidade real (o contrato de nova geração exige
dez). O título do conteúdo pode ter sido renomeado sem modificar o tema das
perguntas; essa organização do conteúdo salvo é respeitada.

Atualmente, a geração retorna perguntas com IDs locais como `pergunta-1`, e o
salvamento de Conteúdo aceita livro, tema e resumo, sem persistir essas perguntas.
O frontend não inventa IDs de banco nem envia esses identificadores ao endpoint
de respostas. A correção e a nota continuam no controlador local da #14; o
registro de respostas no histórico é uma integração separada dessa leitura.

Para um resumo salvo sem perguntas, a interface informa a ausência e oferece
**Gerar novo material**. Essa ação abre uma nova geração sobre o tema, com resumo
e questões consistentes entre si, preservando o resumo salvo. Não mostra o quiz
de exemplo nem um resultado artificial de zero questões.

O salvamento conserva o modal existente e o livro escolhido. Uma resposta de
salvamento com `perguntas: []` não apaga as questões da tentativa atual. Ao voltar
do quiz, o estado de salvo também é conservado enquanto o material estiver aberto.

## Erros e navegação

O material deve ter resumo não vazio, dez perguntas na geração, IDs distintos,
quatro alternativas `a`–`d`, textos e explicações não vazios e um gabarito válido.
O tema é conferido, aceitando a forma canônica do cache do backend (acentos,
maiúsculas e espaços). Respostas incompletas são recusadas antes de abrir o quiz.

Falhas de rede, timeout, cota, configuração ou resposta inválida mostram a mensagem
da API e permitem tentar novamente. Temas recusados ou amplos orientam a escolher
outro. Conteúdo inexistente apresenta erro de abertura. Um 401 continua sendo
tratado pela sessão da #6 e leva ao login.

Recarregar a página ou sair do fluxo descarta a tentativa em memória. Se a URL
identificar o tema ou conteúdo, o material é consultado novamente e o quiz começa
uma nova tentativa. Abrir uma URL de quiz sem origem pede a escolha de um tema,
sem assumir Regra da cadeia. O cancelamento interrompe a espera no cliente; não
garante interromper uma geração que o servidor já tenha iniciado.

## Configuração e verificação

Configure `VITE_API_URL` e use `VITE_USAR_MOCK=false` para ligar também o CRUD de
livros/conteúdos à API real. A chave da IA é configurada somente no backend.
O modo mock de CRUD dos outros serviços continua disponível para desenvolvimento;
ele não altera o serviço de geração usado nesta integração.

```text
npm test
npm run build
npm run lint
```

Além dos testes de contrato, concorrência, cancelamento e reaproveitamento do
material, o fluxo foi conferido no navegador com Django real e banco temporário,
simulando somente o provedor de IA: login, busca, geração, dez perguntas, resolução,
resultado, reinício, retorno ao resumo, falha/recuperação, tema inválido, modal de
salvamento, navegação ao livro e reabertura por ID. Nenhum crédito de IA foi consumido.
