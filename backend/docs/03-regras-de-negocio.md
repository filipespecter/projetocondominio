# InfinityCondo - Regras de Negócio

## Objetivo

Este documento define as principais regras de funcionamento do InfinityCondo.

As regras descritas aqui deverão ser respeitadas pelo backend, independentemente do comportamento do frontend.

O frontend poderá ocultar botões ou telas, mas a autorização real deverá sempre ser feita pelo backend.

---

# 1. Regras Gerais

## 1.1 Multi-tenant

O InfinityCondo utilizará um único banco PostgreSQL para vários condomínios.

Todo dado operacional deverá estar vinculado a um condomínio por meio de:

```text
condominiumId
```

O backend deverá obter o `condominiumId` a partir do usuário autenticado.

O frontend não poderá determinar livremente qual condomínio será consultado.

Exemplo permitido:

```text
Usuário autenticado
condominiumId obtido do token ou da sessão
backend aplica o filtro
```

Exemplo proibido:

```text
frontend envia outro condominiumId
backend consulta sem validar
```

---

## 1.2 Isolamento de dados

Um usuário de um condomínio nunca poderá:

- consultar dados de outro condomínio;
- editar dados de outro condomínio;
- excluir dados de outro condomínio;
- receber notificações de outro condomínio;
- visualizar relatórios de outro condomínio.

Toda consulta operacional deverá filtrar por:

```text
condominiumId
```

---

## 1.3 Exclusão lógica

Registros importantes deverão utilizar exclusão lógica através de:

```text
deletedAt
```

Quando `deletedAt` possuir uma data, o registro será considerado excluído.

Registros excluídos logicamente não deverão aparecer nas consultas normais.

Exclusão física somente será permitida quando:

- o registro for temporário;
- não existir obrigação de histórico;
- não houver relacionamento importante;
- a remoção for tecnicamente segura.

---

## 1.4 Auditoria

Operações relevantes deverão gerar registro de auditoria.

Exemplos:

- criação;
- alteração;
- exclusão;
- ativação;
- bloqueio;
- aprovação;
- rejeição;
- recebimento;
- retirada;
- login;
- troca de senha;
- alteração de plano;
- suspensão de condomínio.

A auditoria deverá registrar, quando disponível:

- usuário;
- condomínio;
- ação;
- módulo;
- entidade;
- identificador;
- descrição;
- dados anteriores;
- dados posteriores;
- endereço IP;
- dispositivo;
- data e hora.

---

# 2. Perfis de Acesso

## 2.1 PLATFORM_ADMIN

O administrador da plataforma pertence à Star Infinity Code.

Poderá:

- cadastrar condomínios;
- editar condomínios;
- ativar condomínios;
- suspender condomínios;
- cancelar condomínios;
- cadastrar planos;
- editar planos;
- cadastrar funcionalidades;
- configurar funcionalidades por plano;
- criar assinaturas;
- alterar assinaturas;
- consultar indicadores gerais;
- consultar auditorias da plataforma;
- cadastrar outros administradores da plataforma.

Normalmente deverá possuir:

```text
condominiumId = null
```

Não deverá operar como morador, porteiro ou síndico de forma automática.

Caso precise acessar um condomínio para suporte, deverá existir futuramente um fluxo controlado e auditado de suporte.

---

## 2.2 CONDOMINIUM_ADMIN

Representa o administrador principal do condomínio.

Poderá:

- editar dados do próprio condomínio;
- cadastrar blocos;
- cadastrar unidades;
- cadastrar moradores;
- cadastrar porteiros;
- cadastrar gestores;
- cadastrar áreas comuns;
- administrar visitantes;
- acompanhar encomendas;
- administrar reservas;
- publicar avisos;
- administrar ocorrências;
- cadastrar prestadores;
- acessar relatórios;
- acessar BI;
- administrar configurações;
- consultar auditoria do próprio condomínio.

Não poderá:

- acessar outros condomínios;
- alterar plano diretamente;
- alterar assinatura diretamente;
- administrar recursos globais da plataforma.

---

## 2.3 MANAGER

Representa subsíndico, gestor ou auxiliar administrativo.

Poderá receber permissões administrativas configuráveis pelo `CONDOMINIUM_ADMIN`.

Inicialmente poderá:

- consultar moradores;
- consultar unidades;
- administrar visitantes;
- acompanhar encomendas;
- administrar reservas;
- publicar avisos;
- acompanhar ocorrências;
- consultar relatórios.

A criação de outros administradores principais deverá ser restrita ao `CONDOMINIUM_ADMIN`.

As permissões do `MANAGER` serão configuráveis pelo `CONDOMINIUM_ADMIN`, que poderá habilitar ou desabilitar funcionalidades conforme as necessidades do condomínio, respeitando os limites definidos pelo backend.

---

## 2.4 DOORMAN

Representa o porteiro.

Poderá:

- consultar unidades ativas;
- consultar moradores necessários à operação;
- registrar visitantes;
- registrar entrada de visitantes;
- registrar saída de visitantes;
- consultar autorizações;
- registrar encomendas;
- marcar encomenda como retirada;
- registrar ocorrências;
- consultar prestadores autorizados;
- registrar entrada e saída de prestadores.

Não poderá:

- cadastrar planos;
- editar assinatura;
- editar configurações administrativas;
- excluir moradores;
- excluir unidades;
- acessar dados de outros condomínios;
- alterar permissões.

---

## 2.5 RESIDENT

Representa o morador.

Poderá:

- consultar seus dados;
- consultar suas unidades;
- consultar seus vínculos;
- informar encomenda esperada;
- consultar encomendas da própria unidade;
- solicitar reserva;
- acompanhar suas reservas;
- consultar avisos;
- enviar sugestão;
- enviar reclamação;
- autorizar visitante;
- consultar notificações.

Não poderá:

- acessar unidades não vinculadas;
- visualizar encomendas de outras unidades;
- visualizar reservas privadas de outros moradores;
- acessar relatórios administrativos;
- cadastrar porteiros;
- cadastrar moradores;
- alterar configurações do condomínio.

---

# 3. Regras de Condomínio

## 3.1 Cadastro

Somente `PLATFORM_ADMIN` poderá criar um novo condomínio na plataforma.

No momento da criação, o condomínio deverá possuir:

- código único;
- nome;
- status;
- plano ou período de teste;
- administrador principal.

---

## 3.2 Código do condomínio

Cada condomínio deverá possuir um código único.

Exemplos:

```text
CONDO001
RESIDENCIAL_SOL
INFINITY_0001
```

Esse código poderá ser utilizado internamente em:

- suporte;
- logs;
- relatórios;
- integrações;
- identificação técnica.

---

## 3.3 Situação do condomínio

Situações previstas:

```text
TRIAL
ACTIVE
SUSPENDED
CANCELED
```

### TRIAL

Condomínio em período de teste.

### ACTIVE

Condomínio com acesso normal.

### SUSPENDED

Acesso operacional bloqueado temporariamente.

### CANCELED

Contrato encerrado.

---

## 3.4 Suspensão

Quando um condomínio estiver suspenso:

- usuários comuns não poderão acessar os módulos;
- dados não deverão ser apagados;
- auditorias deverão ser preservadas;
- o administrador da plataforma continuará com acesso;
- a reativação deverá restaurar o acesso.

---

# 4. Regras de Planos

## 4.1 Planos iniciais

O sistema terá inicialmente:

```text
ESSENTIAL
COMPLETE
```

---

## 4.2 Recursos

Os recursos não deverão ser definidos apenas por colunas fixas no plano.

A disponibilidade será controlada por:

```text
Plan
Feature
PlanFeature
```

---

## 4.3 Tipos de recurso

Um recurso poderá ser:

```text
BOOLEAN
LIMIT
CONFIGURATION
```

### BOOLEAN

Ativado ou desativado.

Exemplo:

```text
BI_ANALYTICS
```

### LIMIT

Possui limite numérico.

Exemplo:

```text
MAX_USERS = 100
MAX_UNITS = 200
```

### CONFIGURATION

Possui configuração em formato estruturado.

Exemplo:

```text
WHATSAPP_CONFIGURATION
```

---

## 4.4 Validação de recursos

O backend deverá verificar o plano antes de executar ações limitadas.

Exemplo:

```text
condomínio atingiu MAX_USERS
novo usuário não poderá ser cadastrado
```

O frontend poderá exibir aviso, mas o backend deverá impedir a operação.

---

# 5. Regras de Usuários

## 5.1 Tabela única

Todos os usuários utilizarão a mesma tabela de autenticação.

Não deverão existir tabelas separadas de login para:

- síndico;
- porteiro;
- morador;
- administrador da plataforma.

---

## 5.2 Nome de usuário

O nome de usuário deverá ser único dentro do condomínio.

Dois condomínios poderão possuir usuários com o mesmo `username`.

Exemplo permitido:

```text
Condomínio A: porteiro01
Condomínio B: porteiro01
```

---

## 5.3 E-mail

Quando informado, o e-mail deverá ser válido.

A definição de unicidade global será confirmada na modelagem final.

Para evitar conflitos futuros, o ideal é que o login principal utilize contexto de condomínio, e-mail ou identificador controlado.

---

## 5.4 Senha

A senha nunca deverá ser salva em texto puro.

Deverá ser armazenado somente:

```text
passwordHash
```

A aplicação deverá usar algoritmo seguro de hash.

---

## 5.5 Primeiro acesso

Usuários criados administrativamente poderão receber senha temporária.

Nesse caso:

```text
mustChangePassword = true
```

O usuário deverá trocar a senha no primeiro acesso.

---

## 5.6 Bloqueio

Após várias tentativas inválidas, o usuário poderá ser bloqueado temporariamente.

Campos previstos:

```text
failedLoginAttempts
lockedUntil
```

Ao realizar login com sucesso:

- tentativas inválidas deverão voltar a zero;
- bloqueio temporário deverá ser removido, quando aplicável;
- `lastLoginAt` deverá ser atualizado.

---

## 5.7 Desativação

Usuários desativados não poderão autenticar.

A desativação não deverá apagar:

- histórico;
- auditoria;
- vínculos antigos;
- reservas;
- registros operacionais.

---

# 6. Regras de Blocos e Unidades

## 6.1 Blocos

O bloco será opcional.

Um condomínio poderá:

- possuir vários blocos;
- possuir apenas um bloco;
- não utilizar blocos.

Exemplos:

```text
Bloco A
Torre Norte
Prédio 2
Setor 1
```

---

## 6.2 Unidades

Cada unidade deverá pertencer a um condomínio.

Uma unidade poderá pertencer opcionalmente a um bloco.

Tipos previstos:

```text
APARTMENT
HOUSE
PENTHOUSE
OTHER
```

---

## 6.3 Identificação

A identificação da unidade deverá ser única dentro do contexto necessário.

Exemplos:

```text
Bloco A / 101
Bloco B / 101
Casa 15
Cobertura 01
```

Quando houver bloco, a combinação poderá ser:

```text
buildingBlockId + identifier
```

Quando não houver bloco:

```text
condominiumId + identifier
```

---

## 6.4 Exclusão de unidade

Uma unidade com histórico não deverá ser apagada fisicamente.

Deverá ser desativada ou excluída logicamente.

---

# 7. Regras de Moradores

## 7.1 Vínculo com unidade

O usuário morador deverá estar vinculado a pelo menos uma unidade para acessar dados residenciais.

O vínculo será registrado em:

```text
UnitResident
```

---

## 7.2 Tipos de vínculo

Tipos previstos:

```text
OWNER
TENANT
DEPENDENT
AUTHORIZED_OCCUPANT
```

---

## 7.3 Múltiplas unidades

Um usuário poderá estar vinculado a mais de uma unidade.

Exemplo:

```text
proprietário da unidade residencial 101
proprietário da unidade residencial 202
```

---

## 7.4 Múltiplos moradores

Uma unidade poderá possuir vários moradores.

Exemplo:

```text
proprietário
cônjuge
filho
inquilino
dependente
```

---

## 7.5 Responsável principal

Cada vínculo poderá indicar:

```text
isPrimary
```

A unidade poderá ter um responsável principal ativo.

A regra final sobre quantidade de responsáveis será definida na implementação.

---

## 7.6 Histórico de ocupação

Quando um morador sair da unidade, o vínculo não deverá ser apagado.

Deverá registrar:

```text
endDate
active = false
```

Isso preserva o histórico.

---

# 8. Regras de Porteiros

## 8.1 Cadastro

Porteiros poderão ser cadastrados pelo:

- `CONDOMINIUM_ADMIN`;
- `MANAGER`, quando possuir permissão.

---

## 8.2 Vínculo

Todo porteiro deverá pertencer a um condomínio.

Porteiro não deverá possuir acesso a outro condomínio usando a mesma sessão.

---

## 8.3 Turno

O perfil do porteiro poderá armazenar:

- código funcional;
- turno;
- data de contratação;
- situação.

---

# 9. Regras de Visitantes

## 9.1 Cadastro

Visitantes poderão ser cadastrados por:

- porteiro;
- administrador;
- gestor;
- morador, por autorização prévia.

---

## 9.2 Dados mínimos

O visitante deverá possuir pelo menos:

- nome;
- unidade de destino;
- data ou momento da visita;
- status.

Documento e telefone poderão ser opcionais, conforme configuração.

---

## 9.3 Situações

Situações previstas:

```text
WAITING
AUTHORIZED
DENIED
ENTERED
EXITED
CANCELED
```

---

## 9.4 Autorização

A autorização poderá ser feita por:

- morador vinculado à unidade;
- administrador;
- gestor autorizado.

O porteiro poderá registrar autorização recebida por outro canal, desde que a ação seja auditada.

---

## 9.5 Entrada

Um visitante somente poderá entrar quando estiver autorizado, salvo exceção administrativa auditada.

Ao registrar entrada:

- status deverá mudar;
- horário de entrada deverá ser salvo;
- usuário responsável deverá ser registrado.

---

## 9.6 Saída

Ao registrar saída:

- horário de saída deverá ser salvo;
- status deverá mudar para `EXITED`;
- ação deverá ser auditada.

---

# 10. Regras de Encomendas

## 10.1 Registro

A encomenda poderá ser registrada pelo porteiro.

Deverá estar vinculada a:

- condomínio;
- unidade;
- responsável pelo registro;
- data de recebimento.

---

## 10.2 Situações

Situações previstas:

```text
EXPECTED
RECEIVED
NOTIFIED
DELIVERED
RETURNED
CANCELED
```

---

## 10.3 Encomenda esperada

O morador poderá informar uma encomenda esperada.

Essa informação deverá aparecer para a portaria.

Ao receber a encomenda, o porteiro poderá associar o recebimento ao registro esperado.

---

## 10.4 Notificação

Ao registrar a encomenda como recebida:

- moradores ativos da unidade deverão receber notificação interna;
- WhatsApp poderá ser enviado quando o recurso estiver ativo;
- e-mail poderá ser enviado quando configurado.

O registro da encomenda não deverá falhar apenas porque o envio externo falhou.

---

## 10.5 Retirada

Ao entregar a encomenda:

- data e hora deverão ser registradas;
- responsável pela retirada poderá ser informado;
- porteiro responsável deverá ser registrado;
- status deverá mudar para `DELIVERED`.

---

# 11. Regras de Áreas Comuns

## 11.1 Cadastro

Áreas comuns poderão ser cadastradas por:

- administrador do condomínio;
- gestor autorizado.

---

## 11.2 Configuração

Uma área poderá definir:

- necessidade de reserva;
- capacidade;
- duração padrão;
- antecedência mínima;
- antecedência máxima;
- horários permitidos;
- dias disponíveis;
- regras de utilização.

---

## 11.3 Desativação

Área desativada:

- não poderá receber novas reservas;
- manterá o histórico;
- reservas futuras deverão ser tratadas administrativamente.

---

# 12. Regras de Reservas

## 12.1 Solicitação

Moradores ativos poderão solicitar reserva para áreas disponíveis.

A reserva deverá pertencer a:

- condomínio;
- área comum;
- usuário;
- unidade;
- data;
- horário.

---

## 12.2 Conflito

Não poderão existir reservas aprovadas para a mesma área em horários conflitantes.

A verificação deverá ser feita pelo backend.

---

## 12.3 Situações

Situações previstas:

```text
PENDING
APPROVED
REJECTED
CANCELED
COMPLETED
```

---

## 12.4 Aprovação

A aprovação poderá ser:

- automática;
- manual.

Essa decisão dependerá da configuração da área.

---

## 12.5 Cancelamento

A reserva poderá ser cancelada:

- pelo solicitante, dentro das regras;
- pelo administrador;
- pelo gestor autorizado.

Cancelamentos administrativos deverão ser auditados.

---

## 12.6 Notificação

Mudanças importantes deverão gerar notificação:

- reserva solicitada;
- reserva aprovada;
- reserva rejeitada;
- reserva cancelada;
- lembrete de reserva.

---

# 13. Regras de Avisos

## 13.1 Publicação

Avisos poderão ser publicados por:

- administrador;
- gestor autorizado.

---

## 13.2 Público

O aviso poderá ser direcionado para:

- todo o condomínio;
- um bloco;
- uma unidade;
- um perfil específico;
- usuários selecionados.

---

## 13.3 Período

Avisos poderão possuir:

- data de publicação;
- data de início;
- data de expiração.

Avisos expirados não deverão aparecer como ativos.

---

## 13.4 Leitura

O sistema poderá registrar quais usuários visualizaram o aviso.

---

# 14. Regras de Sugestões e Reclamações

## 14.1 Criação

Moradores poderão enviar:

- sugestão;
- reclamação;
- solicitação.

---

## 14.2 Situações

Situações previstas:

```text
OPEN
VIEWED
IN_PROGRESS
RESOLVED
CLOSED
```

---

## 14.3 Visibilidade

A manifestação deverá ser visível para:

- autor;
- administrador;
- gestor autorizado.

Não deverá ser pública para outros moradores.

---

## 14.4 Histórico

Mudanças de status e respostas deverão permanecer registradas.

---

# 15. Regras de Ocorrências

## 15.1 Registro

Ocorrências poderão ser registradas por:

- porteiro;
- administrador;
- gestor.

---

## 15.2 Conteúdo

A ocorrência poderá possuir:

- título;
- descrição;
- categoria;
- gravidade;
- turno;
- unidade relacionada;
- usuário relacionado;
- anexos;
- data e hora.

---

## 15.3 Alteração

Ocorrências não deverão ser apagadas fisicamente.

Correções deverão ficar auditadas.

---

# 16. Regras de Prestadores

## 16.1 Cadastro

Prestadores poderão representar:

- pessoa autônoma;
- funcionário terceirizado;
- empresa.

---

## 16.2 Dados

Poderão ser armazenados:

- nome;
- documento;
- empresa;
- telefone;
- serviço;
- unidade de destino;
- período autorizado;
- observações.

---

## 16.3 Entrada e saída

A entrada e a saída deverão registrar:

- data;
- hora;
- porteiro responsável;
- unidade ou área de destino.

---

# 17. Regras de Notificações

## 17.1 Centralização

Módulos operacionais não deverão enviar WhatsApp ou e-mail diretamente.

Deverão solicitar envio ao:

```text
NotificationService
```

---

## 17.2 Canais

Canais previstos:

```text
IN_APP
EMAIL
WHATSAPP
PUSH
```

---

## 17.3 Falha externa

Falha de e-mail ou WhatsApp:

- não deverá desfazer a operação principal;
- deverá gerar tentativa pendente ou falha;
- deverá permitir reprocessamento;
- deverá ser registrada tecnicamente.

---

## 17.4 Leitura

Notificações internas deverão registrar:

- destinatário;
- data de criação;
- data de leitura;
- status.

---

# 18. Regras de Arquivos

## 18.1 Serviço central

Uploads deverão utilizar um serviço centralizado.

Tipos de arquivo previstos:

- logotipo;
- foto de usuário;
- foto de visitante;
- anexo de ocorrência;
- anexo de aviso;
- documento de prestador.

---

## 18.2 Segurança

O backend deverá validar:

- tamanho;
- extensão;
- tipo MIME;
- usuário responsável;
- condomínio;
- finalidade do arquivo.

---

## 18.3 Armazenamento

Inicialmente poderá ser utilizado armazenamento local em desenvolvimento.

Em produção, o sistema deverá permitir integração com serviço externo, como:

- Amazon S3;
- Cloudflare R2;
- serviço compatível com S3.

O caminho físico não deverá ficar acoplado às regras dos módulos.

---

# 19. Regras de Relatórios e BI

## 19.1 Isolamento

Relatórios deverão usar exclusivamente dados do condomínio autenticado.

---

## 19.2 Permissões

Relatórios administrativos poderão ser acessados por:

- administrador;
- gestor autorizado;
- administrador da plataforma, quando necessário.

---

## 19.3 Exportações

Formatos previstos:

```text
PDF
XLSX
CSV
```

---

## 19.4 Plano

Recursos avançados de BI poderão depender do plano contratado.

O backend deverá validar a funcionalidade antes de fornecer os dados.

---

# 20. Regras de Configurações

Cada condomínio poderá possuir configurações próprias.

Exemplos:

- regras de visitantes;
- regras de reservas;
- horários da portaria;
- canais de notificação;
- identidade visual;
- limites operacionais;
- mensagens padrão.

Configurações de um condomínio nunca poderão afetar outro.

---

# 21. Regras de Autenticação

## 21.1 Access Token

O access token terá duração curta.

Deverá conter apenas informações essenciais.

Exemplo:

```text
userId
role
condominiumId
sessionId
```

---

## 21.2 Refresh Token

O refresh token terá duração maior.

O token original não deverá ser salvo no banco.

Deverá ser armazenado somente seu hash.

---

## 21.3 Revogação

O sistema deverá permitir:

- logout da sessão atual;
- encerramento de todas as sessões;
- revogação de token;
- bloqueio de usuário;
- invalidação após troca de senha.

---

# 22. Regras de API

As rotas principais serão versionadas:

```text
/api/v1
```

Exemplos:

```text
/api/v1/auth
/api/v1/users
/api/v1/units
/api/v1/visitors
/api/v1/packages
/api/v1/reservations
```

A rota de saúde poderá permanecer:

```text
/api/health
```

---

# 23. Validação

Toda entrada externa deverá ser validada com Zod.

Deverão ser validados:

- body;
- params;
- query;
- tipos;
- campos obrigatórios;
- limites;
- formatos;
- enums.

Dados enviados pelo frontend nunca deverão ser considerados confiáveis.

---

# 24. Transações

Operações que alterarem vários registros relacionados deverão utilizar transação.

Exemplos:

- criação de condomínio, assinatura e administrador;
- recebimento de encomenda e criação de notificações internas;
- aprovação de reserva e bloqueio do horário;
- cancelamento de usuário e encerramento de sessões.

---

# 25. Regras de Concorrência

O backend deverá evitar operações duplicadas.

Exemplos:

- duas reservas para o mesmo horário;
- retirada duplicada de encomenda;
- entrada duplicada de visitante;
- criação duplicada de usuário;
- processamento duplicado de notificação.

Sempre que necessário deverão ser utilizados:

- restrições únicas;
- transações;
- validações de status;
- idempotência.

---

# 26. Regra Final

Nenhuma regra de segurança deverá depender exclusivamente do frontend.

O backend será sempre a fonte de verdade para:

- autenticação;
- autorização;
- isolamento multi-tenant;
- limites de planos;
- validações;
- transições de status;
- auditoria;
- persistência.