# Permissões e Controle de Acesso

## 1. Objetivo

Este documento define as permissões dos usuários do InfinityCondo.

O controle de acesso deverá garantir que cada usuário:

- visualize apenas os dados permitidos;
- execute apenas ações autorizadas;
- acesse somente o condomínio ao qual pertence;
- não consiga manipular permissões pelo frontend;
- não consiga acessar recursos de outro condomínio;
- tenha suas operações relevantes registradas em auditoria.

As permissões deverão ser validadas obrigatoriamente no backend. O frontend poderá ocultar menus e botões, mas isso não substitui a validação da API.

---

## 2. Perfis do sistema

```text
PLATFORM_ADMIN
CONDOMINIUM_ADMIN
MANAGER
DOORMAN
RESIDENT
```

### 2.1 PLATFORM_ADMIN

Administrador geral da plataforma InfinityCondo, pertencente à Star Infinity Code.

Pode:

- cadastrar, editar, ativar e suspender condomínios;
- administrar planos, assinaturas e funcionalidades;
- acompanhar indicadores globais;
- consultar auditorias da plataforma;
- realizar suporte técnico autorizado;
- acompanhar erros e filas de processamento.

Não deverá operar rotinas diárias de um condomínio sem autorização, justificativa e auditoria.

### 2.2 CONDOMINIUM_ADMIN

Administrador principal do condomínio, normalmente o síndico ou responsável pela conta.

Pode:

- administrar usuários e permissões;
- cadastrar unidades residenciais;
- cadastrar moradores e porteiros;
- administrar visitantes, encomendas, reservas e áreas comuns;
- publicar avisos;
- acompanhar ocorrências e prestadores;
- consultar relatórios, BI Analytics e auditoria;
- alterar configurações;
- gerar backup e solicitar restauração, quando autorizado.

### 2.3 MANAGER

Gestor auxiliar do condomínio, como subsíndico, administradora, gerente predial ou funcionário administrativo.

O acesso do `MANAGER` será configurável. O `CONDOMINIUM_ADMIN` poderá habilitar ou desabilitar permissões específicas, respeitando os limites máximos definidos pelo backend.

Por padrão, poderá:

- consultar dados administrativos permitidos;
- gerenciar moradores e visitantes;
- acompanhar encomendas;
- aprovar reservas, quando autorizado;
- publicar avisos, quando autorizado;
- acompanhar ocorrências;
- cadastrar prestadores;
- consultar relatórios e BI, quando autorizado e disponível no plano.

Não poderá:

- excluir o condomínio;
- alterar o plano contratado;
- transferir titularidade;
- criar outro administrador principal;
- restaurar backup sem autorização;
- alterar configurações críticas;
- conceder permissões superiores às próprias;
- acessar recursos exclusivos da plataforma.

### 2.4 DOORMAN

Usuário operacional da portaria.

Pode:

- consultar moradores e unidades residenciais;
- registrar visitantes;
- registrar entrada e saída;
- registrar e entregar encomendas;
- consultar prestadores autorizados;
- registrar entrada e saída de prestadores;
- registrar ocorrências;
- visualizar avisos destinados à portaria;
- consultar informações necessárias ao plantão.

Não poderá:

- cadastrar administradores;
- alterar configurações do condomínio;
- visualizar auditorias administrativas;
- visualizar BI Analytics;
- gerar relatórios gerenciais;
- alterar planos;
- excluir moradores;
- aprovar reservas administrativas;
- acessar dados de outros condomínios;
- acessar módulos administrativos fora de suas atribuições.

Não existe módulo financeiro no escopo atual do InfinityCondo. Caso esse módulo seja criado no futuro, o porteiro não terá acesso por padrão.

### 2.5 RESIDENT

Morador vinculado a uma ou mais unidades residenciais.

Pode:

- consultar e atualizar dados pessoais permitidos;
- consultar suas unidades residenciais;
- cadastrar visitantes para suas unidades;
- acompanhar visitantes relacionados;
- informar encomendas esperadas;
- consultar suas encomendas;
- solicitar e acompanhar reservas;
- consultar avisos;
- registrar sugestões e reclamações;
- configurar preferências de notificação.

Não poderá:

- visualizar dados de outros moradores;
- visualizar encomendas ou reservas privadas de outras unidades;
- consultar auditoria;
- cadastrar porteiros;
- alterar dados do condomínio;
- aprovar suas próprias solicitações;
- consultar ocorrências administrativas internas.

---

## 3. Terminologia oficial

Para atender apartamentos, casas, blocos, vilas e outros formatos, o termo técnico oficial será:

```text
Unidade residencial
```

Nome sugerido no código:

```text
ResidentialUnit
```

O termo `apartamento` poderá permanecer apenas:

- na interface atual durante a transição;
- como exemplo de unidade residencial;
- em campos visuais específicos de condomínios verticais.

No backend, banco de dados, API e documentação técnica, o padrão será `unidade residencial`.

---

## 4. Princípios de autorização

### 4.1 Negação por padrão

```text
Sem permissão definida = acesso negado
```

### 4.2 Isolamento por condomínio

Todo recurso do condomínio deverá possuir `condominiumId`.

O backend deverá obter o condomínio pela sessão autenticada. O frontend não poderá escolher livremente o `condominiumId`.

A exceção será o `PLATFORM_ADMIN`, com acesso explícito e auditado.

### 4.3 Menor privilégio

Cada perfil receberá somente as permissões necessárias às suas funções.

### 4.4 Validação obrigatória

O backend deverá validar, nesta ordem:

1. autenticação;
2. situação do usuário;
3. situação do condomínio;
4. isolamento por condomínio;
5. perfil;
6. permissão específica;
7. plano e funcionalidade;
8. propriedade do recurso;
9. regra de negócio.

### 4.5 Propriedade do recurso

Exemplos:

- morador acessa somente suas encomendas e reservas;
- morador altera somente visitantes ligados às suas unidades;
- porteiro acessa somente o próprio condomínio;
- administrador consulta somente a auditoria do próprio condomínio;
- gestor acessa somente os módulos autorizados.

---

## 5. Status de usuário

```text
PENDING
ACTIVE
BLOCKED
INACTIVE
```

- `PENDING`: cadastro criado, mas ainda não ativado;
- `ACTIVE`: acesso permitido;
- `BLOCKED`: acesso temporariamente negado;
- `INACTIVE`: usuário desativado, com histórico preservado.

---

## 6. Matriz geral de permissões

Legenda:

```text
C = criar
V = visualizar
A = atualizar
E = excluir ou desativar
O = executar ação operacional
P = somente registros próprios
L = acesso limitado
— = não permitido
```

| Módulo | PLATFORM_ADMIN | CONDOMINIUM_ADMIN | MANAGER | DOORMAN | RESIDENT |
|---|---:|---:|---:|---:|---:|
| Plataforma | C/V/A/E | — | — | — | — |
| Condomínios | C/V/A/E | V/A próprio | V próprio | — | — |
| Planos | C/V/A/E | V próprio | V limitado | — | — |
| Usuários | V/A global | C/V/A/E | C/V/A/L | V limitado | V/A próprio |
| Unidades residenciais | V global | C/V/A/E | C/V/A | V | V própria |
| Moradores | V global | C/V/A/E | C/V/A/E | V limitado | V/A próprio |
| Porteiros | V global | C/V/A/E | C/V/A/L | V próprio | — |
| Visitantes | V global | C/V/A/E/O | C/V/A/O | C/V/A/O | C/V/A/P |
| Encomendas | V global | C/V/A/E/O | C/V/A/O | C/V/A/O | C/V/P |
| Áreas comuns | V global | C/V/A/E | C/V/A/L | V | V |
| Reservas | V global | C/V/A/E/O | C/V/A/O | V | C/V/A/P |
| Avisos | V global | C/V/A/E | C/V/A/E | V | V |
| Sugestões | V global | V/A/O | V/A/O | — | C/V/P |
| Ocorrências | V global | C/V/A/E/O | C/V/A/O | C/V/A/O | — |
| Prestadores | V global | C/V/A/E/O | C/V/A/O | V/O | V limitado |
| Notificações | V global | V/A próprio | V/A próprio | V/A próprio | V/A próprio |
| Relatórios | V global | C/V | C/V limitado | — | — |
| BI Analytics | V global | V | V limitado | — | — |
| Configurações | V global | V/A | V/A/L | — | V/A preferências |
| Auditoria | V global | V próprio condomínio | V limitado | — | — |
| Backup | V global | C/V/O | L | — | — |

---

## 7. Regras principais por módulo

### 7.1 Unidades residenciais

- criação e atualização: `CONDOMINIUM_ADMIN` e `MANAGER` autorizado;
- exclusão: `CONDOMINIUM_ADMIN`;
- porteiro: consulta operacional;
- morador: somente unidades vinculadas.

A exclusão deverá ser lógica quando houver histórico relacionado.

### 7.2 Moradores

- criação e administração: `CONDOMINIUM_ADMIN` e `MANAGER` autorizado;
- porteiro: somente dados necessários à identificação e ao contato;
- morador: somente os próprios dados permitidos.

O porteiro não deverá visualizar senhas, tokens ou dados privados sem finalidade operacional.

### 7.3 Porteiros

- criação, bloqueio e desativação: `CONDOMINIUM_ADMIN` ou `MANAGER` autorizado;
- porteiro pode editar somente dados pessoais permitidos;
- morador não acessa cadastros de porteiros.

### 7.4 Visitantes

- moradores cadastram visitantes para suas unidades;
- porteiros registram, consultam e operam entrada e saída;
- administradores e gestores acompanham todos os registros do condomínio;
- bloqueios deverão registrar motivo.

### 7.5 Encomendas

- recebimento e entrega: portaria, administração ou gestor autorizado;
- encomenda esperada: morador;
- morador visualiza somente encomendas das próprias unidades;
- entrega registra responsável, data, hora e usuário da operação.

### 7.6 Áreas comuns e reservas

- áreas comuns: administradas por `CONDOMINIUM_ADMIN` ou `MANAGER` autorizado;
- reservas: morador solicita para unidade vinculada;
- aprovação ou rejeição: administração ou gestor autorizado;
- porteiro consulta somente agenda operacional;
- morador não aprova a própria solicitação.

### 7.7 Avisos

- criação: administração ou gestor autorizado;
- leitura: usuários pertencentes ao público do aviso;
- públicos possíveis: todos, administração, porteiros, moradores ou unidades específicas.

### 7.8 Sugestões e reclamações

- criação: morador;
- consulta: morador vê apenas as próprias;
- resposta e mudança de status: administração ou gestor autorizado.

### 7.9 Ocorrências

- criação: porteiro, gestor ou administrador;
- consulta: conforme perfil e permissão;
- encerramento: administração ou gestor;
- porteiro poderá concluir ocorrências simples somente quando autorizado.

### 7.10 Prestadores

- cadastro e autorização: administração ou gestor;
- entrada e saída: portaria, gestor ou administração;
- porteiro poderá impedir temporariamente uma entrada por motivo operacional ou de segurança.

### 7.11 Notificações

Cada usuário acessará somente suas notificações e preferências.

### 7.12 Relatórios

- geração: `CONDOMINIUM_ADMIN` e `MANAGER` autorizado;
- porteiro não gera relatórios gerenciais;
- consultas operacionais do plantão não serão consideradas relatórios gerenciais.

### 7.13 BI Analytics

Permitido para:

```text
CONDOMINIUM_ADMIN
MANAGER, conforme permissão e plano
```

Não permitido inicialmente para porteiros e moradores.

### 7.14 Configurações

- configurações gerais: administrador;
- gestor: somente itens autorizados;
- porteiro: sem acesso;
- morador: somente preferências pessoais;
- configurações críticas: `CONDOMINIUM_ADMIN` e `PLATFORM_ADMIN`.

### 7.15 Auditoria

- plataforma: auditoria global;
- administrador: auditoria do próprio condomínio;
- gestor: acesso limitado;
- porteiro e morador: sem acesso.

Registros de auditoria não poderão ser alterados por usuários comuns.

### 7.16 Backup

- gerar: administrador; gestor somente com permissão específica;
- restaurar: administrador ou plataforma com autorização;
- restauração exige autenticação recente, confirmação, validação e auditoria.

---

## 8. Permissões por plano

Planos iniciais:

```text
ESSENTIAL
COMPLETE
```

### ESSENTIAL

- autenticação;
- unidades residenciais;
- moradores;
- porteiros;
- visitantes;
- encomendas;
- avisos;
- reservas básicas;
- áreas comuns;
- configurações básicas;
- notificações internas.

### COMPLETE

Inclui o ESSENTIAL e poderá adicionar:

- BI Analytics;
- relatórios avançados;
- exportação PDF, XLSX e CSV;
- auditoria detalhada;
- notificações por WhatsApp e e-mail;
- ocorrências avançadas;
- prestadores;
- backup e restauração;
- personalizações e integrações futuras.

Mesmo que o perfil tenha permissão, a API deverá bloquear recursos que não façam parte do plano.

```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_AVAILABLE",
    "message": "Este recurso não está disponível no plano contratado."
  }
}
```

---

## 9. Permissões personalizadas do MANAGER

Exemplo:

```json
{
  "canManageResidents": true,
  "canManageDoormen": false,
  "canApproveReservations": true,
  "canPublishNotices": true,
  "canViewReports": true,
  "canViewAnalytics": true,
  "canViewAuditLogs": false,
  "canManageSettings": false,
  "canGenerateBackup": false
}
```

Regras:

1. o administrador define as permissões;
2. a API valida cada permissão;
3. o frontend apenas representa visualmente o acesso;
4. permissões não elevam o perfil;
5. o gestor nunca poderá receber privilégios de `PLATFORM_ADMIN`;
6. ações críticas poderão permanecer exclusivas do administrador principal.

---

## 10. Middlewares de autorização

Exemplo conceitual:

```javascript
authenticate()
requireRole("CONDOMINIUM_ADMIN", "MANAGER")
requireCondominiumAccess()
requirePermission("reservations.approve")
requireFeature("RESERVATIONS")
```

---

## 11. Respostas de erro

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Autenticação necessária."
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Você não possui permissão para realizar esta ação."
  }
}
```

### 404 Not Found

Recursos de outro condomínio poderão retornar `404` para não confirmar a existência de dados externos.

---

## 12. Segurança contra escalonamento de privilégio

O backend deverá impedir que um usuário:

- altere o próprio perfil;
- conceda permissões superiores às próprias;
- altere o `condominiumId`;
- atribua usuários a outro condomínio;
- manipule permissões pelo corpo da requisição;
- acesse endpoints administrativos diretamente;
- contorne regras modificando o frontend;
- consulte recursos por identificadores de outro condomínio.

---

## 13. Regras finais

1. Toda autorização acontecerá no backend.
2. O frontend não será considerado barreira de segurança.
3. Todo recurso será filtrado por `condominiumId`.
4. Moradores acessarão somente dados próprios ou de suas unidades residenciais.
5. Porteiros terão acesso apenas operacional.
6. Gestores terão permissões configuráveis e limitadas.
7. Administradores controlarão o próprio condomínio.
8. O administrador da plataforma controlará o SaaS.
9. Funcionalidades respeitarão o plano contratado.
10. Operações sensíveis gerarão auditoria.
11. Exclusões preservarão históricos quando necessário.
12. A API negará todo acesso não expressamente autorizado.
13. O termo técnico padrão será `unidade residencial`.
14. Não existe módulo financeiro no escopo atual.

---

## 14. Objetivo final

O modelo de permissões deverá garantir:

- isolamento entre condomínios;
- proteção dos dados dos moradores;
- separação entre funções administrativas e operacionais;
- flexibilidade para diferentes equipes;
- segurança contra acesso indevido;
- compatibilidade com planos comerciais;
- rastreabilidade das ações;
- expansão futura do SaaS.
