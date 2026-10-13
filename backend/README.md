# API de Gestão de Colaboradores e Folha de Pagamento (Node.js + Express)

Implementação de uma API de RH/folha de pagamento com Node.js, Express, SQLite (`better-sqlite3`) e autenticação JWT: cadastro de colaboradores, marcação de ponto, regras financeiras (descontos/adicionais), geração de folha de pagamento, DSR sobre horas extras, cálculo de férias e bônus. Base arquitetural (camadas, JWT, tratamento de erros) explicada passo a passo em [Aula 05](https://pleonr.github.io/apisMicrosservicos/exemplo-node-express).

## Pré-requisitos

- Node.js 18 ou mais recente

## Instalação e execução

```bash
cd exemplos/api-node
npm install
npm run seed   # popula o banco com dados de exemplo (recomendado)
npm start
```

O servidor sobe em `http://localhost:3000`. Na primeira execução, um arquivo `usuarios.db` é criado automaticamente na raiz desta pasta (as tabelas são criadas sozinhas, se ainda não existirem).

Para desenvolvimento com reinício automático a cada alteração:

```bash
npm run dev
```

### Populando o banco com dados de exemplo

```bash
npm run seed
```

Isso apaga o conteúdo das tabelas e recria 7 colaboradores (1 `ADMIN` + 6 `EMPLOYEE`), registros de ponto para Ana Silva (id 3), 2 regras financeiras ativas e 1 folha de pagamento já gerada. Credenciais de seed:

| E-mail | Senha | Papel |
| --- | --- | --- |
| `admin@empresa.com` | `Admin@123` | `ADMIN` |
| `ana.silva@empresa.com` (id 3) | `Emp@123` | `EMPLOYEE` |
| `bruno.lima@empresa.com` (id 4) | `Emp@123` | `EMPLOYEE` |
| demais colaboradores (Carlos, Diana, Eduardo, Fernanda) | `Emp@123` | `EMPLOYEE` |

Se o banco estiver vazio (sem `npm run seed`), o primeiro `POST /auth/registrar` não exige token e cria o `ADMIN` inicial (regra de bootstrap).

## Variáveis de ambiente (opcionais)

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do servidor |
| `JWT_SECRET` | `segredo-de-desenvolvimento` | Segredo usado para assinar/validar tokens JWT |
| `DB_PATH` | `./usuarios.db` | Caminho do arquivo SQLite |

```bash
JWT_SECRET=algo-mais-seguro PORT=4000 npm start
```

## Endpoints

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/registrar` | Bootstrap: sem token se o banco estiver vazio; `ADMIN` depois disso | Cadastra um colaborador |
| `POST` | `/auth/login` | Não | Retorna um token JWT |
| `GET` | `/usuarios` | `ADMIN` | Lista todos os colaboradores |
| `GET` | `/usuarios/:id` | `ADMIN` ou o próprio | Busca um colaborador |
| `PUT` | `/usuarios/:id` | `ADMIN` | Substitui o cadastro completo |
| `PATCH` | `/usuarios/:id` | `ADMIN` ou o próprio (campos sensíveis só por `ADMIN`) | Atualiza campos do cadastro |
| `DELETE` | `/usuarios/:id` | `ADMIN` | Remove um colaborador |
| `GET` / `PATCH` | `/usuarios/:id/remuneracao` | `GET`: `ADMIN` ou o próprio · `PATCH`: `ADMIN` | Consulta/atualiza valor-hora e carga horária |
| `POST` | `/ponto/marcar` | Qualquer autenticado | Marca entrada/saída/almoço do dia (sequencial) |
| `GET` | `/ponto/hoje` | Qualquer autenticado | Registro de ponto do dia |
| `GET` | `/ponto/historico` | Qualquer autenticado | Histórico do próprio período (`dataInicio`/`dataFim`) |
| `GET` | `/ponto/resumo-horas` | Qualquer autenticado | Horas normais/extras do próprio período |
| `GET` | `/usuarios/:id/ponto/historico` \| `/resumo-horas` | `ADMIN` | Mesma consulta acima, para qualquer colaborador |
| `POST` / `GET` | `/regras-financeiras` | `POST`: `ADMIN` · `GET`: qualquer autenticado (`EMPLOYEE` só vê ativas) | Cadastra/lista regras de desconto e adicional |
| `PATCH` / `DELETE` | `/regras-financeiras/:id` | `ADMIN` | Atualiza/remove uma regra (bloqueado se já usada em folha) |
| `GET` | `/usuarios/:id/folha/pre-calculo` | `ADMIN` | Simula o cálculo de folha para um período |
| `POST` | `/usuarios/:id/folha/gerar` | `ADMIN` | Persiste a folha do período (bloqueia sobreposição) |
| `GET` | `/usuarios/:id/folhas` \| `/folhas/:folhaId` | `ADMIN` ou o próprio | Lista/detalha folhas geradas |
| `GET` | `/usuarios/:id/dsr` | `ADMIN` ou o próprio | DSR sobre horas extras do período |
| `POST` | `/usuarios/:id/ferias/calcular` | `ADMIN` | Calcula férias + 1/3 constitucional |
| `POST` / `GET` | `/usuarios/:id/bonus` | `POST`: `ADMIN` · `GET`: `ADMIN` ou o próprio | Cadastra/lista bônus (fixo ou percentual) |

## Testando com `curl`

```bash
# Login (copie o token da resposta)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@empresa.com", "senha": "Admin@123"}'

# Listar colaboradores (rota protegida, só ADMIN)
curl http://localhost:3000/usuarios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Marcar entrada
curl -X POST http://localhost:3000/ponto/marcar \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" -H "Content-Type: application/json" \
  -d '{"tipo": "ENTRADA"}'

# Pré-cálculo de folha de um colaborador
curl "http://localhost:3000/usuarios/3/folha/pre-calculo?dataInicio=2026-08-01&dataFim=2026-08-10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Cada endpoint tem exemplos completos de `curl` (incluindo os casos de erro esperados) nos tutoriais de implementação da atividade correspondente.

## Estrutura do projeto

```
api-node/
├── server.js                            # ponto de entrada, sobe o servidor
├── scripts/seed.js                      # popula o banco com dados de exemplo
└── src/
    ├── app.js                           # monta express + rotas + middlewares
    ├── db.js                            # conexão SQLite + schema (todas as tabelas)
    ├── models/                          # queries SQL (usuarioModel, registroPontoModel,
    │                                    #   regraFinanceiraModel, folhaPagamentoModel, bonusModel)
    ├── services/                        # regras puras (sem acesso a banco): authService,
    │                                    #   calculoHorasService, calculoFolhaService,
    │                                    #   calculoDsrService, calculoFeriasService
    ├── controllers/                     # authController, usuarioController, pontoController,
    │                                    #   regraFinanceiraController, folhaController,
    │                                    #   feriasController, bonusController
    ├── middlewares/
    │   ├── auth.js                      # valida o JWT (auth) / popula se houver (authOpcional)
    │   ├── permitir.js                  # restringe uma rota a um conjunto de roles
    │   ├── errorHandler.js              # formata qualquer erro como JSON
    │   └── asyncHandler.js              # encaminha erros (sync ou async) ao errorHandler
    ├── validation/regras.js             # helpers de validação (obrigatorio, validar)
    ├── utils/periodo.js                 # validação de dataInicio/dataFim
    ├── errors/apiError.js               # erro com status HTTP embutido
    └── routes/
        ├── authRoutes.js
        ├── usuarioRoutes.js             # inclui remuneração, ponto/folha/férias/bônus por :id
        ├── pontoRoutes.js
        └── regraFinanceiraRoutes.js
```

Este projeto usa **ES Modules** (`import`/`export`), habilitado via `"type": "module"` no `package.json`.

Para apagar o banco e recomeçar do zero:

```bash
rm usuarios.db
npm run seed
```

## Testes automatizados

```bash
npm test
```

Roda a suíte de testes de integração (Vitest + Supertest) contra a API real, com SQLite em memória (`DB_PATH=':memory:'`, configurado em `vitest.config.js` — nunca toca no `usuarios.db` do disco). Há um arquivo por atividade em `tests/integration/`, cobrindo o checklist de cada tutorial:

```
tests/integration/
├── helpers.js  # fixtures: criarUsuario, tokenPara, limparBanco...
├── 01-cadastro-colaboradores.test.js
├── 02-listagem-consulta-usuarios.test.js
├── 03-atualizacao-remocao-usuarios.test.js
├── 04-parametros-remuneracao.test.js
├── 05-cadastro-listagem-regras-financeiras.test.js
├── 06-atualizacao-remocao-regras-financeiras.test.js
├── 07-marcacao-de-ponto.test.js
├── 08-consulta-ponto-hoje.test.js
├── 09-historico-ponto-colaborador.test.js
├── 10-historico-ponto-admin.test.js
├── 11-calculo-horas-trabalhadas.test.js
├── 12-pre-calculo-salario.test.js
├── 13-geracao-folha-pagamento.test.js
├── 14-consulta-folhas-pagamento.test.js
├── 15-calculo-dsr.test.js
├── 16-calculo-ferias.test.js
└── 17-cadastro-calculo-bonus.test.js
```
