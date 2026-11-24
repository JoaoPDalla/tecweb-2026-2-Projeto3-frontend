# Sessão e cliente HTTP — #6 e #12

## Sessão (#6)

`AuthProvider` compartilha o usuário e as ações `entrar`, `sair`, `restaurar` e
`esquecerSessao`. O login atual conserva seu visual e passa a usar o contexto.
O botão Sair na barra chama o logout do backend e remove a sessão local; se a
rede falhar, apresenta o erro e permite tentar novamente.

Ao abrir a aplicação, uma sessão salva é conferida em `GET /api/auth/me/` antes
de renderizar páginas protegidas. Enquanto isso, mostra a verificação da sessão.
Uma falha de conexão permite tentar novamente sem apagar o token. Um 401 remove
a sessão e leva ao login. O contexto também acompanha mudanças em outras abas.

As rotas `/inicio`, `/livro/:id`, `/resumo`, `/pergunta`, `/resolucao` e `/resultado`
exigem sessão validada. Quem tentar abri-las sem login retorna à rota solicitada
após entrar, preservando os parâmetros da URL. O login continua público e vai
para `/inicio` quando não houver uma rota de retorno.

O formato antigo `{token, nome}` é aceito e atualizado após a validação com o
servidor. O formato novo conserva `{token, usuario, nome}`. Se o armazenamento do
navegador falhar, a sessão funciona em memória até recarregar. Uma resposta 401
de um pedido antigo não encerra uma sessão nova. O token continua sendo emitido
e validado pelo backend existente; a proteção de rotas não substitui essa validação.

## HTTP (#12)

`request(caminho, opcoes)` mantém compatibilidade com os serviços existentes.
As opções são `method`, `corpo`, `signal`, `timeout`, `autenticar` e `token`.
O timeout padrão é 120 segundos, cobrindo as duas chamadas de IA de até 45 segundos
do backend. O token é incluído por padrão; o login usa `autenticar: false`.

`ApiError` fornece `message`, `status`, `code` e `errors`. Erros de campo aninhados
e erros `{code, detail}` do backend são interpretados. HTML de erro não é exibido
ao usuário. Falhas de rede usam `code: conexao`, timeout usa `code: timeout`, e
cancelamentos são `AbortError`. Respostas 204 não exigem corpo JSON.

`useRequest()` retorna `{loading, error, data, executar, cancelar}`. Ele cancela
o pedido anterior ao executar outro e impede que resultados antigos ou de uma
tela desmontada atualizem seu estado. O login e a saída já usam esse hook.

```jsx
const pedido = useRequest()
await pedido.executar((signal) => request('/rota/', { signal }))
```

`useApiActivity()` retorna a quantidade de pedidos HTTP ativos para consumidores
que precisarem de um indicador geral. `createApiClient()` aceita transporte,
armazenamento e callback de expiração injetáveis para testes.

## Configuração e limites

Copie `.env.example` para `.env` e ajuste `VITE_API_URL`. Nunca coloque uma chave
de IA em uma variável `VITE_*`; essa chave pertence exclusivamente ao backend.

`VITE_USAR_MOCK=true` conserva os exemplos de conteúdo/livros enquanto suas APIs
e a integração #16 não estiverem prontas. Autenticação sempre usa o backend real.
As telas e os serviços de livros, busca, resumo e resolução não foram reescritos.
Login, barra e rotas receberam apenas a ligação necessária com a sessão.

## Verificação

```text
npm test
npm run build
npm run lint
```

Há testes de token, erros, timeout, cancelamento, pedidos concorrentes,
armazenamento bloqueado, sessão antiga e respostas atrasadas. O fluxo de navegador
foi conferido com uma API local em banco temporário: redirecionamento de rota
protegida, login com retorno, restauração ao recarregar e logout entre duas abas.
