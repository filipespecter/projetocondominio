# InfinityCondo - Fluxos do Sistema

## Objetivo

Este documento descreve os principais fluxos operacionais do backend do InfinityCondo.

Todos os fluxos deverão ser executados pelo backend, respeitando:

- autenticação;
- autorização (RBAC);
- isolamento por condomínio (multi-tenant);
- auditoria;
- regras de negócio;
- validações;
- plano contratado.

---

# 1. Fluxo de Autenticação

Login
↓
Validação das credenciais
↓
Validação do condomínio
↓
Validação do usuário
↓
Geração do Access Token
↓
Geração do Refresh Token
↓
Registro em auditoria
↓
Sessão iniciada

---

# 2. Fluxo de Cadastro de Condomínio

PLATFORM_ADMIN
↓
Cria condomínio
↓
Cria administrador principal
↓
Cria assinatura
↓
Aplica plano (ESSENTIAL ou COMPLETE)
↓
Condomínio ativo

---

# 3. Fluxo de Unidades Residenciais

Administrador/Gestor autorizado
↓
Cadastrar unidade residencial
↓
Validar duplicidade
↓
Salvar
↓
Auditoria

---

# 4. Fluxo de Moradores

Cadastrar usuário
↓
Criar perfil RESIDENT
↓
Vincular à unidade residencial
↓
Gerar auditoria
↓
Disponibilizar acesso

---

# 5. Fluxo de Porteiros

Cadastrar porteiro
↓
Criar usuário DOORMAN
↓
Senha temporária
↓
Primeiro acesso obriga troca de senha

---

# 6. Fluxo de Visitantes

Cadastro
↓
Aguardando autorização
↓
Autorizado
↓
Entrada registrada
↓
Saída registrada
↓
Histórico preservado

---

# 7. Fluxo de Encomendas

Morador informa encomenda esperada (opcional)
↓
Porteiro registra recebimento
↓
Notificação aos moradores
↓
Retirada registrada
↓
Histórico preservado

---

# 8. Fluxo de Reservas

Morador solicita
↓
Validação de disponibilidade
↓
Aprovação automática ou manual
↓
Reserva confirmada
↓
Conclusão ou cancelamento

---

# 9. Fluxo de Avisos

Administrador publica
↓
Definição do público
↓
Envio das notificações
↓
Registro de leitura

---

# 10. Fluxo de Sugestões/Reclamações

Morador envia
↓
Administração analisa
↓
Status atualizado
↓
Resposta
↓
Encerramento

---

# 11. Fluxo de Ocorrências

Registro
↓
Classificação
↓
Tratamento
↓
Resolução
↓
Fechamento

---

# 12. Fluxo de Prestadores

Cadastro
↓
Autorização
↓
Entrada
↓
Saída
↓
Histórico

---

# 13. Fluxo de Notificações

Evento do sistema
↓
NotificationService
↓
IN_APP
EMAIL
WHATSAPP
PUSH

Falhas externas nunca cancelam a operação principal.

---

# 14. Fluxo de Auditoria

Toda operação relevante gera:

- usuário
- condomínio
- ação
- data/hora
- entidade
- IP
- antes/depois

---

# 15. Fluxo de Autorização

authenticate
↓
requireRole
↓
requirePermission
↓
requireFeature
↓
Executar operação

---

# 16. Fluxo de BI e Relatórios

Consulta
↓
Validação do plano
↓
Coleta dos dados
↓
Geração dos indicadores
↓
Exportação (PDF/XLSX/CSV)

---

# 17. Fluxo de Backup

Administrador autorizado
↓
Gerar backup
↓
Auditoria
↓
Arquivo disponível

Restauração exige autenticação recente.

---

# 18. Fluxo de Upload

Validação
↓
Upload
↓
Associação ao condomínio
↓
Registro em auditoria

---

# 19. Fluxo de Validação do Plano

Requisição
↓
Verificar Feature
↓
Permitido → Executa
Negado → FEATURE_NOT_AVAILABLE

---

# 20. Fluxo Final

Toda requisição seguirá obrigatoriamente:

Autenticação
↓
Validação do usuário
↓
Validação do condomínio
↓
RBAC
↓
Plano
↓
Regra de negócio
↓
Persistência
↓
Auditoria
↓
Resposta da API
