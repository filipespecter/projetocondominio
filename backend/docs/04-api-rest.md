# InfinityCondo - API REST

## Objetivo

Este documento define o contrato da API REST do InfinityCondo.

A API será utilizada pelo frontend React para substituir o armazenamento atual em `localStorage`.

Todas as regras de autenticação, autorização, multi-tenant, validação e limites de plano serão aplicadas pelo backend.

---

# 1. Configuração Geral

## 1.1 URL-base

```text
/api/v1
```

Exemplo:

```text
http://localhost:3000/api/v1
```

A rota de verificação do servidor permanecerá fora do versionamento:

```text
GET /api/health
```

---

## 1.2 Formato das respostas

### Sucesso

```json
{
  "success": true,
  "data": {}
}
```

### Sucesso com mensagem

```json
{
  "success": true,
  "message": "Operação realizada com sucesso.",
  "data": {}
}
```

### Erro

```json
{
  "success": false,
  "message": "Não foi possível realizar a operação.",
  "errors": []
}
```

### Lista paginada

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

# 2. Autenticação

Rotas públicas:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

Rotas autenticadas:

```text
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
GET  /api/v1/auth/me
PATCH /api/v1/auth/change-password
```

---

## 2.1 Login

```text
POST /api/v1/auth/login
```

Permissão:

```text
Público
```

Descrição:

Realiza a autenticação do usuário.

### Requisição

```json
{
  "condominiumCode": "CONDO001",
  "username": "porteiro01",
  "password": "senha"
}
```

Para administradores da plataforma, `condominiumCode` poderá ser omitido.

### Resposta

```json
{
  "success": true,
  "data": {
    "accessToken": "token",
    "refreshToken": "token",
    "user": {
      "id": "uuid",
      "name": "Nome do usuário",
      "username": "porteiro01",
      "role": "DOORMAN",
      "condominiumId": "uuid",
      "mustChangePassword": false
    }
  }
}
```

### Possíveis erros

```text
400 - Dados inválidos
401 - Usuário ou senha inválidos
403 - Usuário bloqueado ou condomínio suspenso
429 - Muitas tentativas de acesso
```

---

## 2.2 Dados do usuário autenticado

```text
GET /api/v1/auth/me
```

Retorna os dados da sessão atual, perfil, condomínio e permissões.

### Resposta

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Nome do usuário",
      "email": "usuario@email.com",
      "role": "CONDOMINIUM_ADMIN"
    },
    "condominium": {
      "id": "uuid",
      "name": "Residencial Exemplo",
      "logoUrl": null
    },
    "permissions": [],
    "features": []
  }
}
```

---

## 2.3 Renovação de token

```text
POST /api/v1/auth/refresh
```

### Requisição

```json
{
  "refreshToken": "token"
}
```

### Resposta

```json
{
  "success": true,
  "data": {
    "accessToken": "novo-token",
    "refreshToken": "novo-refresh-token"
  }
}
```

---

## 2.4 Logout

```text
POST /api/v1/auth/logout
```

Encerra apenas a sessão atual.

---

## 2.5 Encerrar todas as sessões

```text
POST /api/v1/auth/logout-all
```

Revoga todas as sessões do usuário autenticado.

---

## 2.6 Alteração de senha

```text
PATCH /api/v1/auth/change-password
```

### Requisição

```json
{
  "currentPassword": "senha-atual",
  "newPassword": "nova-senha",
  "newPasswordConfirmation": "nova-senha"
}
```

---

# 3. Condomínio autenticado

## 3.1 Consultar perfil do condomínio

```text
GET /api/v1/condominium
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
DOORMAN
RESIDENT
```

Retorna somente o condomínio da sessão autenticada.

---

## 3.2 Atualizar perfil do condomínio

```text
PATCH /api/v1/condominium
```

Permissões:

```text
CONDOMINIUM_ADMIN
```

### Requisição

```json
{
  "fantasyName": "Residencial Exemplo",
  "legalName": "Condomínio Residencial Exemplo",
  "document": "00000000000000",
  "email": "contato@condominio.com",
  "phone": "81999999999",
  "zipCode": "00000000",
  "address": "Rua Exemplo",
  "number": "100",
  "complement": "",
  "district": "Bairro",
  "city": "Recife",
  "state": "PE"
}
```

---

## 3.3 Enviar logotipo

```text
POST /api/v1/condominium/logo
```

Permissões:

```text
CONDOMINIUM_ADMIN
```

Formato:

```text
multipart/form-data
```

---

# 4. Padrões de consulta

Listagens poderão aceitar:

```text
page
limit
search
status
sortBy
sortOrder
createdFrom
createdTo
```

Exemplo:

```text
GET /api/v1/residents?page=1&limit=20&search=Maria&status=ACTIVE
```

O backend deverá ignorar ou rejeitar filtros não permitidos.

---

# 5. Códigos HTTP

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

---

# 6. Regras obrigatórias

- O `condominiumId` será obtido da sessão autenticada.
- O frontend não poderá selecionar livremente outro condomínio.
- Toda entrada será validada com Zod.
- Toda rota privada exigirá autenticação.
- Toda operação relevante gerará auditoria.
- Recursos dependentes de plano serão validados no backend.
- Registros excluídos logicamente não aparecerão nas consultas normais.

---

# 7. Unidades Residenciais

Responsável pelo gerenciamento das unidades residenciais do condomínio.

Permissões:

- CONDOMINIUM_ADMIN
- MANAGER

Consulta:

- DOORMAN (somente leitura)
- RESIDENT (somente sua unidade)

---

## Listar unidades

```text
GET /api/v1/units
```

Filtros:

```text
page
limit
search
blockId
status
unitType
```

Resposta:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "identifier": "101",
      "block": "Bloco A",
      "floor": 1,
      "type": "APARTMENT",
      "status": "ACTIVE"
    }
  ]
}
```

---

## Buscar unidade

```text
GET /api/v1/units/:id
```

---

## Criar unidade

```text
POST /api/v1/units
```

Body:

```json
{
  "buildingBlockId": "uuid",
  "identifier": "101",
  "floor": 1,
  "unitType": "APARTMENT",
  "status": "ACTIVE",
  "observations": ""
}
```

Resposta:

```text
201 Created
```

---

## Atualizar unidade

```text
PATCH /api/v1/units/:id
```

---

## Desativar unidade

```text
DELETE /api/v1/units/:id
```

Não remove fisicamente.

Realiza Soft Delete.

---

# 8. Moradores

Responsável pelos moradores vinculados às unidades.

---

## Listar moradores

```text
GET /api/v1/residents
```

Filtros:

```text
page
limit
search
status
residentialUnitId
relationshipType
```

---

## Buscar morador

```text
GET /api/v1/residents/:id
```

---

## Cadastrar morador

```text
POST /api/v1/residents
```

Body:

```json
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "phone": "81999999999",
  "username": "maria101",
  "password": "SenhaTemporaria123",
  "cpf": "00000000000",
  "birthDate": "1998-01-20",
  "residentialUnitId": "uuid",
  "relationshipType": "OWNER",
  "isPrimary": true
}
```

Regras:

- cria User;
- cria ResidentProfile;
- cria UnitResident;
- gera auditoria;
- poderá enviar convite futuramente.

---

## Atualizar morador

```text
PATCH /api/v1/residents/:id
```

---

## Desativar morador

```text
DELETE /api/v1/residents/:id
```

Realiza Soft Delete.

Mantém histórico.

---

## Alterar unidade

```text
PATCH /api/v1/residents/:id/unit
```

Body:

```json
{
  "residentialUnitId": "uuid"
}
```

---

## Alterar situação

```text
PATCH /api/v1/residents/:id/status
```

Body:

```json
{
  "status": "ACTIVE"
}
```

Situações:

```text
ACTIVE
INACTIVE
BLOCKED
```

---

## Listar moradores da unidade

```text
GET /api/v1/units/:id/residents
```

---

## Histórico do morador

```text
GET /api/v1/residents/:id/history
```

Retorna:

- mudanças cadastrais;
- alterações de unidade;
- auditorias;
- reservas;
- encomendas;
- notificações.
---

# 9. Porteiros

Responsável pelo cadastro e controle dos usuários da portaria.

Permissões administrativas:

```text
CONDOMINIUM_ADMIN
MANAGER, quando autorizado
```

O porteiro poderá consultar apenas os próprios dados de sessão.

---

## 9.1 Listar porteiros

```text
GET /api/v1/doormen
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
```

Filtros:

```text
page
limit
search
status
shift
```

O campo `search` poderá pesquisar por:

- nome;
- código;
- telefone;
- usuário;
- turno.

### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeCode": "P001",
      "name": "João da Silva",
      "phone": "81999999999",
      "username": "porteiro01",
      "shift": "MORNING",
      "status": "ACTIVE",
      "lastLoginAt": null,
      "lastLogoutAt": null,
      "lastShiftAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 9.2 Buscar porteiro

```text
GET /api/v1/doormen/:id
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
```

---

## 9.3 Cadastrar porteiro

```text
POST /api/v1/doormen
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER, quando autorizado
```

### Requisição

```json
{
  "name": "João da Silva",
  "phone": "81999999999",
  "username": "porteiro01",
  "temporaryPassword": "SenhaTemporaria123",
  "shift": "MORNING",
  "status": "ACTIVE"
}
```

### Turnos

```text
MORNING
AFTERNOON
NIGHT
OTHER
```

### Situações

```text
ACTIVE
INACTIVE
BLOCKED
```

### Comportamento

O backend deverá:

1. validar nome, telefone, usuário, senha e turno;
2. verificar se o nome de usuário já existe no condomínio;
3. gerar um código sequencial para o porteiro;
4. criar um usuário com perfil `DOORMAN`;
5. criar o perfil específico do porteiro;
6. definir troca obrigatória de senha no primeiro acesso;
7. gerar auditoria;
8. gerar registro operacional para relatórios.

### Resposta

```text
201 Created
```

---

## 9.4 Atualizar porteiro

```text
PATCH /api/v1/doormen/:id
```

### Requisição

```json
{
  "name": "João da Silva",
  "phone": "81988888888",
  "shift": "NIGHT",
  "status": "ACTIVE"
}
```

A senha não deverá ser devolvida nem editada junto aos dados comuns.

---

## 9.5 Alterar situação do porteiro

```text
PATCH /api/v1/doormen/:id/status
```

### Requisição

```json
{
  "status": "INACTIVE",
  "reason": "Afastamento temporário"
}
```

Ao bloquear ou desativar o porteiro:

- novas autenticações deverão ser impedidas;
- sessões ativas poderão ser revogadas;
- o histórico operacional deverá ser preservado;
- a ação deverá ser auditada.

---

## 9.6 Redefinir senha do porteiro

```text
POST /api/v1/doormen/:id/reset-password
```

### Requisição

```json
{
  "temporaryPassword": "NovaSenhaTemporaria123"
}
```

O backend deverá:

- salvar apenas o hash;
- revogar as sessões existentes;
- definir `mustChangePassword = true`;
- registrar auditoria.

---

## 9.7 Desativar porteiro

```text
DELETE /api/v1/doormen/:id
```

A operação realizará exclusão lógica ou desativação.

Não deverá remover:

- registros de visitantes;
- encomendas registradas;
- ocorrências;
- auditorias;
- histórico de plantões.

---

## 9.8 Consultar dados do próprio porteiro

```text
GET /api/v1/doormen/me
```

Permissão:

```text
DOORMAN
```

Retorna:

- identificação;
- código funcional;
- turno;
- condomínio;
- situação;
- último acesso.

---

# 10. Visitantes

Responsável pelo cadastro, autorização e controle de entrada e saída de visitantes.

O frontend atual utiliza os estados:

```text
Aguardando
Autorizado
Em Visita
Saiu
Bloqueado
```

Na API, eles serão padronizados como:

```text
WAITING
AUTHORIZED
ENTERED
EXITED
BLOCKED
```

---

## 10.1 Listar visitantes

```text
GET /api/v1/visitors
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
DOORMAN
```

Moradores poderão consultar apenas visitantes relacionados às próprias unidades.

Filtros:

```text
page
limit
search
status
residentialUnitId
visitorType
createdFrom
createdTo
```

O campo `search` poderá pesquisar por:

- nome;
- documento;
- telefone;
- unidade;
- morador responsável.

### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Carlos Souza",
      "document": "00000000000",
      "phone": "81999999999",
      "visitorType": "COMMON",
      "unit": {
        "id": "uuid",
        "identifier": "101",
        "block": "Bloco A"
      },
      "resident": {
        "id": "uuid",
        "name": "Maria Silva"
      },
      "status": "WAITING",
      "observation": "",
      "authorized": false,
      "blocked": false,
      "entryAt": null,
      "exitAt": null,
      "createdAt": "2026-07-30T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 10.2 Buscar visitante

```text
GET /api/v1/visitors/:id
```

A consulta deverá retornar também:

- histórico de mudanças de status;
- responsável pelo cadastro;
- responsável pela autorização;
- porteiro da entrada;
- porteiro da saída;
- notificações relacionadas.

---

## 10.3 Cadastrar visitante pela administração

```text
POST /api/v1/visitors
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
DOORMAN
```

### Requisição

```json
{
  "name": "Carlos Souza",
  "document": "00000000000",
  "phone": "81999999999",
  "residentialUnitId": "uuid",
  "residentId": "uuid",
  "visitorType": "COMMON",
  "observation": "Visita familiar",
  "entryExpectedAt": "2026-07-30T18:00:00.000Z",
  "authorized": false,
  "blocked": false
}
```

### Tipos de visitante

```text
COMMON
SERVICE_PROVIDER
DELIVERY
OTHER
```

### Regras

- nome e unidade serão obrigatórios;
- o nome deverá possuir pelo menos três caracteres;
- o documento poderá ser obrigatório para prestadores;
- a unidade deverá pertencer ao condomínio autenticado;
- o morador informado deverá estar vinculado à unidade;
- visitante bloqueado deverá iniciar com status `BLOCKED`;
- visitante previamente autorizado deverá iniciar com status `AUTHORIZED`;
- os demais deverão iniciar com status `WAITING`.

---

## 10.4 Cadastrar autorização prévia pelo morador

```text
POST /api/v1/resident/visitor-authorizations
```

Permissão:

```text
RESIDENT
```

### Requisição

```json
{
  "residentialUnitId": "uuid",
  "visitorName": "Carlos Souza",
  "document": "00000000000",
  "phone": "81999999999",
  "visitorType": "COMMON",
  "validFrom": "2026-08-01T08:00:00.000Z",
  "validUntil": "2026-08-01T22:00:00.000Z",
  "observation": ""
}
```

O morador somente poderá autorizar visitante para unidade à qual esteja vinculado.

---

## 10.5 Atualizar visitante

```text
PATCH /api/v1/visitors/:id
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
DOORMAN
```

Não será permitido alterar livremente um visitante que já tenha encerrado a visita.

Correções posteriores deverão ser auditadas.

---

## 10.6 Autorizar visitante

```text
PATCH /api/v1/visitors/:id/authorize
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
RESIDENT vinculado à unidade
DOORMAN, quando registrar autorização recebida
```

### Requisição

```json
{
  "observation": "Autorizado pelo morador por telefone"
}
```

### Resultado

```text
WAITING -> AUTHORIZED
```

O backend deverá registrar:

- quem autorizou;
- data e hora;
- origem da autorização;
- observação;
- auditoria.

---

## 10.7 Bloquear visitante

```text
PATCH /api/v1/visitors/:id/block
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "reason": "Acesso não autorizado"
}
```

### Resultado

```text
WAITING -> BLOCKED
AUTHORIZED -> BLOCKED
```

Um visitante bloqueado não poderá ter a entrada registrada.

---

## 10.8 Remover bloqueio

```text
PATCH /api/v1/visitors/:id/unblock
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "newStatus": "WAITING",
  "reason": "Bloqueio removido após conferência"
}
```

---

## 10.9 Registrar entrada

```text
PATCH /api/v1/visitors/:id/check-in
```

Permissões:

```text
DOORMAN
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "observation": "",
  "documentConfirmed": true
}
```

### Resultado

```text
AUTHORIZED -> ENTERED
```

O backend deverá registrar:

- horário de entrada;
- porteiro responsável;
- sessão utilizada;
- unidade de destino;
- auditoria;
- histórico operacional.

A entrada não deverá ser permitida quando o visitante estiver:

```text
WAITING
BLOCKED
EXITED
```

---

## 10.10 Registrar saída

```text
PATCH /api/v1/visitors/:id/check-out
```

Permissões:

```text
DOORMAN
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "observation": ""
}
```

### Resultado

```text
ENTERED -> EXITED
```

O backend deverá registrar:

- horário de saída;
- porteiro responsável;
- auditoria;
- histórico da visita.

---

## 10.11 Alterar status administrativo

```text
PATCH /api/v1/visitors/:id/status
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "status": "AUTHORIZED",
  "reason": "Autorização confirmada pela administração"
}
```

Essa rota será reservada para correções ou exceções administrativas.

As operações comuns deverão utilizar as rotas específicas:

```text
/authorize
/block
/unblock
/check-in
/check-out
```

---

## 10.12 Excluir ou cancelar visitante

```text
DELETE /api/v1/visitors/:id
```

Um visitante sem movimentação poderá ser cancelado ou excluído logicamente.

Visitantes que já tenham entrada, saída ou histórico relevante não deverão ser apagados fisicamente.

---

## 10.13 Consultar histórico do visitante

```text
GET /api/v1/visitors/:id/history
```

Retorna eventos como:

```text
CREATED
AUTHORIZED
BLOCKED
UNBLOCKED
CHECKED_IN
CHECKED_OUT
UPDATED
CANCELED
```

### Exemplo de resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CHECKED_IN",
      "status": "ENTERED",
      "performedBy": {
        "id": "uuid",
        "name": "Porteiro João"
      },
      "createdAt": "2026-07-30T18:05:00.000Z"
    }
  ]
}
```

---

## 10.14 Visitantes relacionados à própria unidade

```text
GET /api/v1/resident/visitors
```

Permissão:

```text
RESIDENT
```

Filtros:

```text
residentialUnitId
status
createdFrom
createdTo
```

O morador somente poderá consultar unidades às quais esteja vinculado.

---

## 10.15 Notificações do fluxo de visitantes

As seguintes ações poderão gerar notificações:

```text
visitante cadastrado pela portaria;
visitante aguardando autorização;
visitante autorizado;
visitante entrou;
visitante saiu;
visitante bloqueado.
```

Destinatários possíveis:

- morador responsável;
- moradores ativos da unidade;
- administração;
- central da portaria.

O cadastro ou a mudança de status não deverá falhar caso um envio externo de WhatsApp ou e-mail apresente erro.

---

## 10.16 Regras de transição de status

Transições normais permitidas:

```text
WAITING -> AUTHORIZED
WAITING -> BLOCKED
WAITING -> CANCELED

AUTHORIZED -> ENTERED
AUTHORIZED -> BLOCKED
AUTHORIZED -> CANCELED

BLOCKED -> WAITING
BLOCKED -> AUTHORIZED

ENTERED -> EXITED
```

Transições inválidas deverão retornar:

```text
409 Conflict
```

Exemplo:

```json
{
  "success": false,
  "message": "Não é possível registrar a saída de um visitante que ainda não entrou.",
  "errors": []
}
```
---

# 11. Encomendas

Responsável pelo controle de encomendas do condomínio.

Fluxo principal:

Morador informa encomenda esperada
↓

Porteiro recebe

↓

Sistema notifica moradores

↓

Morador retira

↓

Histórico permanece salvo

---

## 11.1 Listar encomendas

GET /api/v1/packages

Permissões:

CONDOMINIUM_ADMIN

MANAGER

DOORMAN

RESIDENT (somente suas unidades)

Filtros:

- page
- limit
- search
- residentialUnitId
- status
- receivedFrom
- receivedTo
- expectedOnly

---

## 11.2 Buscar encomenda

GET /api/v1/packages/:id

Retorna:

- dados da encomenda
- unidade residencial
- morador
- porteiro responsável
- histórico
- notificações

---

## 11.3 Registrar encomenda recebida

POST /api/v1/packages

Permissões:

DOORMAN

CONDOMINIUM_ADMIN

MANAGER

Body

```json
{
  "residentialUnitId":"uuid",
  "description":"Mercado Livre",
  "carrier":"Correios",
  "trackingCode":"AB123456789BR",
  "receivedAt":"2026-07-30T18:00:00Z",
  "observation":""
}
```

Ao salvar:

- cria movimentação
- registra porteiro
- registra horário
- envia notificação
- gera auditoria

Status inicial:

RECEIVED

---

## 11.4 Informar encomenda esperada

POST /api/v1/packages/expected

Permissão:

RESIDENT

Body

```json
{
  "description":"Amazon",
  "trackingCode":"BR123456",
  "expectedDate":"2026-08-01"
}
```

Status inicial:

EXPECTED

Essa informação ficará visível para a portaria.

---

## 11.5 Atualizar encomenda

PATCH /api/v1/packages/:id

---

## 11.6 Marcar como entregue

PATCH /api/v1/packages/:id/deliver

Permissões:

DOORMAN

CONDOMINIUM_ADMIN

MANAGER

Body

```json
{
  "receivedBy":"João da Silva",
  "document":"00000000000",
  "observation":""
}
```

Resultado:

RECEIVED

↓

DELIVERED

Registrar:

- data
- hora
- responsável
- porteiro

---

## 11.7 Cancelar encomenda

PATCH /api/v1/packages/:id/cancel

Status:

CANCELED

---

## 11.8 Histórico

GET /api/v1/packages/:id/history

Eventos:

EXPECTED

RECEIVED

NOTIFIED

DELIVERED

RETURNED

CANCELED

---

## 11.9 Situações

EXPECTED

RECEIVED

NOTIFIED

DELIVERED

RETURNED

CANCELED

---

## 11.10 Notificações

Recebimento

↓

Morador recebe

Entrega

↓

Histórico atualizado

Cancelamento

↓

Morador recebe aviso

---

# 12. Áreas Comuns

Responsável pelas áreas reserváveis.

Exemplos:

- Piscina
- Salão
- Academia
- Churrasqueira
- Quadra

---

## 12.1 Listar áreas

GET /api/v1/common-areas

Filtros:

page

limit

search

active

---

## 12.2 Buscar área

GET /api/v1/common-areas/:id

---

## 12.3 Criar área

POST /api/v1/common-areas

Permissões:

CONDOMINIUM_ADMIN

MANAGER

Body

```json
{
    "name":"Salão de Festas",
    "description":"",
    "capacity":80,
    "reservationRequired":true,
    "active":true
}
```

---

## 12.4 Atualizar área

PATCH /api/v1/common-areas/:id

---

## 12.5 Desativar área

DELETE /api/v1/common-areas/:id

Soft Delete

---

## 12.6 Configurar horários

PATCH /api/v1/common-areas/:id/schedule

Body

```json
{
    "openingTime":"08:00",
    "closingTime":"22:00",
    "allowedDays":[
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY"
    ]
}
```

---

## 12.7 Configurar regras

PATCH /api/v1/common-areas/:id/settings

Body

```json
{
    "maxReservationsPerMonth":2,
    "minimumAdvanceHours":24,
    "maximumAdvanceDays":60,
    "requiresApproval":true
}
```

---

## 12.8 Histórico

GET /api/v1/common-areas/:id/history

Retorna:

- alterações
- reservas
- auditorias

---

## 12.9 Situação

ACTIVE

INACTIVE

UNDER_MAINTENANCE

---

## 12.10 Auditoria

Toda alteração deverá registrar:

- usuário
- data
- campo alterado
- valor anterior
- valor novo
---

# 13. Reservas

Responsável pelas reservas das áreas comuns.

Fluxo:

Morador solicita

↓

Sistema valida disponibilidade

↓

Administrador aprova (quando necessário)

↓

Reserva confirmada

↓

Uso da área

↓

Histórico

---

## 13.1 Listar reservas

GET /api/v1/reservations

Permissões:

CONDOMINIUM_ADMIN

MANAGER

DOORMAN (consulta)

RESIDENT (somente suas reservas)

Filtros:

- page
- limit
- search
- areaId
- residentialUnitId
- residentId
- status
- startDate
- endDate

---

## 13.2 Buscar reserva

GET /api/v1/reservations/:id

Retorna:

- área
- morador
- unidade
- situação
- histórico
- notificações

---

## 13.3 Solicitar reserva

POST /api/v1/reservations

Permissão:

RESIDENT

Body

```json
{
    "commonAreaId":"uuid",
    "residentialUnitId":"uuid",
    "reservationDate":"2026-08-05",
    "startTime":"18:00",
    "endTime":"22:00",
    "observation":"Aniversário"
}
```

Validações:

- área ativa
- horário permitido
- limite mensal
- conflito de horário
- plano contratado

---

## 13.4 Aprovar reserva

PATCH /api/v1/reservations/:id/approve

Permissões:

CONDOMINIUM_ADMIN

MANAGER

Resultado:

PENDING

↓

APPROVED

---

## 13.5 Rejeitar reserva

PATCH /api/v1/reservations/:id/reject

Body

```json
{
    "reason":"Horário indisponível"
}
```

Resultado:

PENDING

↓

REJECTED

---

## 13.6 Cancelar reserva

PATCH /api/v1/reservations/:id/cancel

Permissões:

Morador (quando permitido)

Administrador

Gestor

Resultado:

↓

CANCELED

---

## 13.7 Concluir reserva

PATCH /api/v1/reservations/:id/finish

↓

COMPLETED

---

## 13.8 Histórico

GET /api/v1/reservations/:id/history

---

## 13.9 Situações

PENDING

APPROVED

REJECTED

CANCELED

COMPLETED

---

## 13.10 Notificações

Solicitação

↓

Administrador

Aprovação

↓

Morador

Rejeição

↓

Morador

Cancelamento

↓

Todos envolvidos

---

# 14. Avisos

Responsável pela comunicação oficial do condomínio.

---

## 14.1 Listar avisos

GET /api/v1/notices

Filtros:

- page
- limit
- search
- category
- active

---

## 14.2 Buscar aviso

GET /api/v1/notices/:id

---

## 14.3 Publicar aviso

POST /api/v1/notices

Permissões:

CONDOMINIUM_ADMIN

MANAGER

Body

```json
{
    "title":"Falta de água",
    "content":"O abastecimento será interrompido.",
    "category":"GENERAL",
    "priority":"HIGH",
    "publishAt":"2026-08-01T08:00:00Z",
    "expiresAt":"2026-08-03T23:59:59Z"
}
```

---

## 14.4 Atualizar aviso

PATCH /api/v1/notices/:id

---

## 14.5 Remover aviso

DELETE /api/v1/notices/:id

Soft Delete

---

## 14.6 Registrar leitura

PATCH /api/v1/notices/:id/read

Permissão:

RESIDENT

DOORMAN

MANAGER

---

## 14.7 Histórico

GET /api/v1/notices/:id/history

---

## 14.8 Categorias

GENERAL

MAINTENANCE

SECURITY

EVENT

FINANCIAL

OTHER

---

## 14.9 Prioridades

LOW

NORMAL

HIGH

URGENT

---

# 15. Sugestões e Reclamações

Responsável pelas solicitações dos moradores.

---

## 15.1 Listar

GET /api/v1/feedback

Permissões:

CONDOMINIUM_ADMIN

MANAGER

RESIDENT (somente as próprias)

---

## 15.2 Criar

POST /api/v1/feedback

Body

```json
{
    "type":"COMPLAINT",
    "title":"Barulho",
    "description":"Apartamento vizinho..."
}
```

---

## 15.3 Atualizar status

PATCH /api/v1/feedback/:id/status

Situações:

OPEN

VIEWED

IN_PROGRESS

RESOLVED

CLOSED

---

## 15.4 Responder

POST /api/v1/feedback/:id/reply

---

## 15.5 Histórico

GET /api/v1/feedback/:id/history

---

# 16. Ocorrências

Responsável pelo registro e acompanhamento de fatos relevantes no condomínio.

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
DOORMAN
```

Moradores não poderão consultar ocorrências administrativas, salvo quando houver um recurso futuro específico para ciência ou resposta.

---

## 16.1 Listar ocorrências

```text
GET /api/v1/occurrences
```

Filtros:

```text
page
limit
search
category
severity
status
residentialUnitId
createdBy
createdFrom
createdTo
```

### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "protocol": "OCC-2026-000001",
      "title": "Portão apresentou falha",
      "description": "O portão da garagem travou durante o plantão.",
      "category": "MAINTENANCE",
      "severity": "MEDIUM",
      "status": "OPEN",
      "shift": "NIGHT",
      "unit": null,
      "createdBy": {
        "id": "uuid",
        "name": "Porteiro João"
      },
      "createdAt": "2026-07-30T22:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 16.2 Buscar ocorrência

```text
GET /api/v1/occurrences/:id
```

Retorna:

- dados completos;
- unidade relacionada;
- usuário relacionado;
- responsável pelo registro;
- anexos;
- respostas;
- histórico de status;
- auditorias relacionadas.

---

## 16.3 Registrar ocorrência

```text
POST /api/v1/occurrences
```

Permissões:

```text
DOORMAN
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "title": "Portão apresentou falha",
  "description": "O portão da garagem travou durante o plantão.",
  "category": "MAINTENANCE",
  "severity": "MEDIUM",
  "shift": "NIGHT",
  "residentialUnitId": null,
  "relatedUserId": null,
  "occurredAt": "2026-07-30T22:10:00.000Z"
}
```

### Comportamento

O backend deverá:

1. validar os dados;
2. gerar protocolo único;
3. vincular o condomínio autenticado;
4. registrar o usuário responsável;
5. iniciar a ocorrência com status `OPEN`;
6. gerar histórico de status;
7. registrar auditoria;
8. notificar a administração quando necessário.

---

## 16.4 Atualizar ocorrência

```text
PATCH /api/v1/occurrences/:id
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
DOORMAN, apenas enquanto estiver aberta e dentro das regras
```

Alterações posteriores deverão ficar registradas no histórico.

---

## 16.5 Alterar status

```text
PATCH /api/v1/occurrences/:id/status
```

### Requisição

```json
{
  "status": "IN_PROGRESS",
  "observation": "Manutenção acionada."
}
```

Situações:

```text
OPEN
VIEWED
IN_PROGRESS
RESOLVED
CLOSED
CANCELED
```

Transições normais:

```text
OPEN -> VIEWED
OPEN -> IN_PROGRESS
VIEWED -> IN_PROGRESS
IN_PROGRESS -> RESOLVED
RESOLVED -> CLOSED
OPEN -> CANCELED
```

Transições inválidas deverão retornar:

```text
409 Conflict
```

---

## 16.6 Adicionar resposta

```text
POST /api/v1/occurrences/:id/replies
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
DOORMAN
```

### Requisição

```json
{
  "message": "Empresa de manutenção acionada."
}
```

---

## 16.7 Listar respostas

```text
GET /api/v1/occurrences/:id/replies
```

---

## 16.8 Adicionar anexo

```text
POST /api/v1/occurrences/:id/attachments
```

Formato:

```text
multipart/form-data
```

Campos:

```text
file
description
```

---

## 16.9 Remover anexo

```text
DELETE /api/v1/occurrences/:id/attachments/:attachmentId
```

A exclusão deverá respeitar permissões e gerar auditoria.

---

## 16.10 Cancelar ocorrência

```text
PATCH /api/v1/occurrences/:id/cancel
```

### Requisição

```json
{
  "reason": "Registro duplicado."
}
```

A ocorrência não deverá ser apagada fisicamente.

---

## 16.11 Histórico

```text
GET /api/v1/occurrences/:id/history
```

Eventos possíveis:

```text
CREATED
UPDATED
STATUS_CHANGED
REPLY_ADDED
ATTACHMENT_ADDED
ATTACHMENT_REMOVED
CANCELED
```

---

## 16.12 Categorias

```text
SECURITY
MAINTENANCE
NOISE
ACCESS
PACKAGE
VISITOR
COMMON_AREA
ADMINISTRATIVE
OTHER
```

---

## 16.13 Gravidade

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Ocorrências `HIGH` ou `CRITICAL` poderão gerar notificação imediata para a administração.

---

# 17. Prestadores

Responsável pelo cadastro, autorização e controle de acesso de prestadores de serviço.

Permissões administrativas:

```text
CONDOMINIUM_ADMIN
MANAGER
```

Permissões operacionais:

```text
DOORMAN
```

---

## 17.1 Listar prestadores

```text
GET /api/v1/service-providers
```

Filtros:

```text
page
limit
search
status
providerType
residentialUnitId
authorizedFrom
authorizedTo
```

---

## 17.2 Buscar prestador

```text
GET /api/v1/service-providers/:id
```

Retorna:

- dados cadastrais;
- empresa;
- serviço;
- unidade ou área de destino;
- período autorizado;
- documentos;
- histórico de acessos;
- situação atual.

---

## 17.3 Cadastrar prestador

```text
POST /api/v1/service-providers
```

Permissões:

```text
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "name": "José Pereira",
  "document": "00000000000",
  "phone": "81999999999",
  "companyName": "Empresa Exemplo",
  "providerType": "INDIVIDUAL",
  "serviceDescription": "Manutenção elétrica",
  "residentialUnitId": "uuid",
  "commonAreaId": null,
  "validFrom": "2026-08-01T08:00:00.000Z",
  "validUntil": "2026-08-01T18:00:00.000Z",
  "observation": ""
}
```

### Tipos

```text
INDIVIDUAL
COMPANY_EMPLOYEE
OUTSOURCED
DELIVERY
OTHER
```

---

## 17.4 Atualizar prestador

```text
PATCH /api/v1/service-providers/:id
```

---

## 17.5 Autorizar prestador

```text
PATCH /api/v1/service-providers/:id/authorize
```

### Requisição

```json
{
  "validFrom": "2026-08-01T08:00:00.000Z",
  "validUntil": "2026-08-01T18:00:00.000Z",
  "observation": ""
}
```

Resultado:

```text
PENDING -> AUTHORIZED
```

---

## 17.6 Bloquear prestador

```text
PATCH /api/v1/service-providers/:id/block
```

### Requisição

```json
{
  "reason": "Documento inválido."
}
```

Resultado:

```text
PENDING -> BLOCKED
AUTHORIZED -> BLOCKED
```

---

## 17.7 Registrar entrada

```text
PATCH /api/v1/service-providers/:id/check-in
```

Permissões:

```text
DOORMAN
CONDOMINIUM_ADMIN
MANAGER
```

### Requisição

```json
{
  "destinationConfirmed": true,
  "observation": ""
}
```

O backend deverá validar:

- prestador autorizado;
- período de validade;
- bloqueios;
- destino;
- entrada ainda não aberta.

---

## 17.8 Registrar saída

```text
PATCH /api/v1/service-providers/:id/check-out
```

### Requisição

```json
{
  "observation": ""
}
```

---

## 17.9 Desativar prestador

```text
DELETE /api/v1/service-providers/:id
```

Realiza exclusão lógica ou desativação.

O histórico de acessos deverá ser preservado.

---

## 17.10 Documentos do prestador

```text
POST /api/v1/service-providers/:id/documents
GET /api/v1/service-providers/:id/documents
DELETE /api/v1/service-providers/:id/documents/:documentId
```

Formato de envio:

```text
multipart/form-data
```

---

## 17.11 Histórico

```text
GET /api/v1/service-providers/:id/history
```

Eventos:

```text
CREATED
UPDATED
AUTHORIZED
BLOCKED
UNBLOCKED
CHECKED_IN
CHECKED_OUT
DOCUMENT_ADDED
DOCUMENT_REMOVED
DEACTIVATED
```

---

## 17.12 Situações

```text
PENDING
AUTHORIZED
ENTERED
EXITED
BLOCKED
INACTIVE
```

---

# 18. Notificações

Responsável pela central de notificações do InfinityCondo.

Canais:

```text
IN_APP
EMAIL
WHATSAPP
PUSH
```

Os módulos operacionais deverão solicitar notificações por meio de um serviço central.

---

## 18.1 Listar notificações do usuário

```text
GET /api/v1/notifications
```

Permissões:

```text
Usuário autenticado
```

Filtros:

```text
page
limit
read
type
channel
createdFrom
createdTo
```

### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Nova encomenda recebida",
      "message": "Uma encomenda foi recebida para sua unidade.",
      "type": "PACKAGE_RECEIVED",
      "channel": "IN_APP",
      "readAt": null,
      "createdAt": "2026-07-30T18:00:00.000Z",
      "metadata": {
        "packageId": "uuid"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 18.2 Contagem de não lidas

```text
GET /api/v1/notifications/unread-count
```

### Resposta

```json
{
  "success": true,
  "data": {
    "count": 4
  }
}
```

---

## 18.3 Marcar como lida

```text
PATCH /api/v1/notifications/:id/read
```

O usuário somente poderá alterar notificações destinadas a ele.

---

## 18.4 Marcar todas como lidas

```text
PATCH /api/v1/notifications/read-all
```

---

## 18.5 Excluir notificação da caixa do usuário

```text
DELETE /api/v1/notifications/:id
```

A exclusão poderá apenas ocultar a notificação do destinatário, preservando o registro técnico necessário.

---

## 18.6 Preferências de notificação

```text
GET /api/v1/notification-preferences
PATCH /api/v1/notification-preferences
```

### Requisição

```json
{
  "inApp": true,
  "email": true,
  "whatsapp": false,
  "push": true,
  "packageReceived": true,
  "reservationUpdated": true,
  "visitorWaiting": true,
  "noticePublished": true
}
```

As preferências não poderão desativar comunicações obrigatórias de segurança ou administração quando isso for definido pelo condomínio.

---

## 18.7 Administração das filas

```text
GET /api/v1/admin/notification-jobs
GET /api/v1/admin/notification-jobs/:id
POST /api/v1/admin/notification-jobs/:id/retry
PATCH /api/v1/admin/notification-jobs/:id/cancel
```

Permissões:

```text
PLATFORM_ADMIN
CONDOMINIUM_ADMIN, limitado ao próprio condomínio e quando autorizado
```

Filtros:

```text
status
channel
type
createdFrom
createdTo
```

---

## 18.8 Situações de envio

```text
PENDING
PROCESSING
SENT
FAILED
CANCELED
```

---

## 18.9 Reprocessamento

Falhas externas deverão permitir nova tentativa.

O reprocessamento deverá:

- respeitar limite de tentativas;
- registrar a última falha;
- registrar a próxima tentativa;
- impedir processamento duplicado;
- manter idempotência.

---

# 19. Uploads e Arquivos

Responsável pelo armazenamento centralizado de arquivos.

---

## 19.1 Enviar arquivo genérico

```text
POST /api/v1/files
```

Formato:

```text
multipart/form-data
```

Campos:

```text
file
purpose
entityType
entityId
description
```

Finalidades possíveis:

```text
CONDOMINIUM_LOGO
USER_PHOTO
VISITOR_PHOTO
OCCURRENCE_ATTACHMENT
NOTICE_ATTACHMENT
SERVICE_PROVIDER_DOCUMENT
OTHER
```

---

## 19.2 Buscar metadados do arquivo

```text
GET /api/v1/files/:id
```

---

## 19.3 Baixar ou visualizar arquivo

```text
GET /api/v1/files/:id/content
```

O backend deverá validar permissão antes de entregar o conteúdo.

---

## 19.4 Excluir arquivo

```text
DELETE /api/v1/files/:id
```

A exclusão deverá:

- validar se o arquivo ainda está em uso;
- respeitar o condomínio;
- gerar auditoria;
- remover ou marcar o arquivo como excluído.

---

## 19.5 Regras de validação

O backend deverá validar:

- tamanho máximo;
- extensão;
- tipo MIME;
- finalidade;
- entidade relacionada;
- condomínio;
- permissão do usuário.

Arquivos executáveis ou suspeitos deverão ser rejeitados.

---

## 19.6 Armazenamento

Em desenvolvimento:

```text
armazenamento local
```

Em produção:

```text
serviço compatível com S3
```

Os módulos não deverão conhecer o caminho físico do arquivo.

---

# 20. Auditoria

Responsável pela rastreabilidade das operações relevantes.

Permissões:

```text
PLATFORM_ADMIN
CONDOMINIUM_ADMIN
MANAGER, quando autorizado
```

---

## 20.1 Listar auditorias

```text
GET /api/v1/audit-logs
```

Filtros:

```text
page
limit
search
module
action
entityType
entityId
userId
createdFrom
createdTo
```

O administrador do condomínio somente poderá consultar auditorias do próprio condomínio.

---

## 20.2 Buscar auditoria

```text
GET /api/v1/audit-logs/:id
```

### Resposta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "module": "PACKAGES",
    "action": "STATUS_CHANGED",
    "entityType": "Package",
    "entityId": "uuid",
    "description": "Encomenda marcada como entregue.",
    "performedBy": {
      "id": "uuid",
      "name": "Porteiro João",
      "role": "DOORMAN"
    },
    "before": {
      "status": "RECEIVED"
    },
    "after": {
      "status": "DELIVERED"
    },
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0",
    "createdAt": "2026-07-30T19:00:00.000Z"
  }
}
```

---

## 20.3 Exportar auditorias

```text
GET /api/v1/audit-logs/export
```

Formatos:

```text
CSV
XLSX
PDF
```

Parâmetro:

```text
format
```

Exemplo:

```text
GET /api/v1/audit-logs/export?format=csv
```

---

## 20.4 Ações auditáveis

Exemplos:

```text
CREATED
UPDATED
DELETED
RESTORED
STATUS_CHANGED
AUTHORIZED
REJECTED
BLOCKED
UNBLOCKED
CHECKED_IN
CHECKED_OUT
LOGIN
LOGIN_FAILED
LOGOUT
PASSWORD_CHANGED
PASSWORD_RESET
PLAN_CHANGED
SUBSCRIPTION_CHANGED
FILE_UPLOADED
FILE_DELETED
```

---

## 20.5 Imutabilidade

Registros de auditoria não deverão ser editados por usuários comuns.

A exclusão física deverá ser altamente restrita e obedecer às políticas legais e de retenção.

---

# 21. Histórico Unificado de Status

O InfinityCondo utilizará um mecanismo comum para registrar mudanças de estado em módulos operacionais.

Módulos iniciais:

```text
VISITORS
PACKAGES
RESERVATIONS
OCCURRENCES
SERVICE_PROVIDERS
FEEDBACK
```

---

## 21.1 Consultar histórico de uma entidade

```text
GET /api/v1/status-history/:entityType/:entityId
```

Permissões:

Determinadas pelo módulo da entidade.

### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "entityType": "PACKAGE",
      "entityId": "uuid",
      "previousStatus": "RECEIVED",
      "newStatus": "DELIVERED",
      "reason": null,
      "performedBy": {
        "id": "uuid",
        "name": "Porteiro João"
      },
      "createdAt": "2026-07-30T19:00:00.000Z"
    }
  ]
}
```

---

## 21.2 Regras do histórico

Toda mudança de status deverá registrar:

- entidade;
- identificador;
- status anterior;
- novo status;
- usuário responsável;
- motivo, quando aplicável;
- condomínio;
- data e hora.

O histórico não substitui a auditoria.

Diferença:

```text
Histórico de status:
focado nas mudanças de estado da entidade.

Auditoria:
focada na rastreabilidade completa da operação.
```
---

# 22. Relatórios

Responsável pela geração de relatórios administrativos.

Permissões:

PLATFORM_ADMIN

CONDOMINIUM_ADMIN

MANAGER

---

## 22.1 Listar relatórios disponíveis

GET /api/v1/reports

Resposta

- Visitantes
- Encomendas
- Reservas
- Moradores
- Porteiros
- Prestadores
- Ocorrências
- Auditoria

---

## 22.2 Gerar relatório

POST /api/v1/reports/generate

Body

```json
{
    "report":"PACKAGES",
    "format":"PDF",
    "filters":{}
}
```

Formatos

PDF

XLSX

CSV

---

## 22.3 Baixar relatório

GET /api/v1/reports/:id/download

---

## 22.4 Histórico

GET /api/v1/reports/history

---

# 23. Dashboard

Responsável pelos indicadores do Dashboard.

GET /api/v1/dashboard

Retorna

```json
{
    "units":{},
    "residents":{},
    "visitors":{},
    "packages":{},
    "reservations":{},
    "occurrences":{},
    "doormen":{},
    "commonAreas":{}
}
```

---

# 24. BI Analytics

Responsável pelos gráficos do sistema.

Permissões

CONDOMINIUM_ADMIN

MANAGER

---

## 24.1 Resumo

GET /api/v1/analytics/summary

---

## 24.2 Visitantes

GET /api/v1/analytics/visitors

---

## 24.3 Encomendas

GET /api/v1/analytics/packages

---

## 24.4 Reservas

GET /api/v1/analytics/reservations

---

## 24.5 Ocorrências

GET /api/v1/analytics/occurrences

---

## 24.6 Moradores

GET /api/v1/analytics/residents

---

## 24.7 Exportação

GET /api/v1/analytics/export

Formatos

PDF

XLSX

CSV

---

# 25. Configurações

Responsável pelas configurações do condomínio.

Permissões

CONDOMINIUM_ADMIN

---

## 25.1 Buscar configurações

GET /api/v1/settings

---

## 25.2 Atualizar configurações

PATCH /api/v1/settings

---

## 25.3 Dados do condomínio

PATCH /api/v1/settings/condominium

---

## 25.4 Horários

PATCH /api/v1/settings/schedules

---

## 25.5 Visitantes

PATCH /api/v1/settings/visitors

---

## 25.6 Reservas

PATCH /api/v1/settings/reservations

---

## 25.7 Notificações

PATCH /api/v1/settings/notifications

---

## 25.8 Backup

POST /api/v1/settings/backup

---

## 25.9 Restaurar Backup

POST /api/v1/settings/restore

Formato

multipart/form-data

---

# 26. Administração da Plataforma

Exclusivo da Star Infinity Code.

Permissões

PLATFORM_ADMIN

---

## Condomínios

GET /api/v1/platform/condominiums

POST /api/v1/platform/condominiums

PATCH /api/v1/platform/condominiums/:id

DELETE /api/v1/platform/condominiums/:id

---

## Planos

GET /api/v1/platform/plans

POST /api/v1/platform/plans

PATCH /api/v1/platform/plans/:id

DELETE /api/v1/platform/plans/:id

---

## Funcionalidades

GET /api/v1/platform/features

POST /api/v1/platform/features

PATCH /api/v1/platform/features/:id

DELETE /api/v1/platform/features/:id

---

## Assinaturas

GET /api/v1/platform/subscriptions

PATCH /api/v1/platform/subscriptions/:id

---

## Dashboard da Plataforma

GET /api/v1/platform/dashboard

Retorna

- quantidade de condomínios
- usuários
- assinaturas
- planos ativos
- receita mensal
- receita anual
- condomínios em teste
- condomínios suspensos

---

## Auditoria Global

GET /api/v1/platform/audit

---

# 27. Convenções da API

Todos os endpoints deverão:

- utilizar autenticação JWT quando privados;
- validar dados com Zod;
- respeitar o condomínio autenticado;
- gerar auditoria quando necessário;
- utilizar transações quando houver múltiplas gravações;
- utilizar paginação nas listagens;
- utilizar Soft Delete quando aplicável;
- retornar respostas padronizadas.

---

# 28. Versionamento

Versão inicial

/api/v1

Futuras versões

/api/v2

/api/v3

As versões anteriores deverão permanecer funcionais durante o período de migração.

---

# 29. Convenções de Nome

Coleções

Plural

Exemplos

/users

/residents

/packages

/visitors

Ações

Verbos específicos

Exemplos

/check-in

/check-out

/approve

/reject

/block

/unblock

/read

/export

---

# 30. Objetivo Final

Esta API foi projetada para substituir totalmente o armazenamento em localStorage utilizado no frontend atual.

Toda regra de negócio ficará centralizada no backend.

O frontend terá apenas a responsabilidade de consumir os endpoints e apresentar as informações ao usuário.

O backend será a única fonte de verdade do sistema.