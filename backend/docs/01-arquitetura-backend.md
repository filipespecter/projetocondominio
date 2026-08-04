# InfinityCondo - Arquitetura do Backend

## Objetivo

O InfinityCondo é um sistema SaaS para gestão de condomínios desenvolvido pela Star Infinity Code.

O backend será responsável por toda a regra de negócio, autenticação, autorização, persistência dos dados, comunicação entre módulos e integração com serviços externos.

---

# Tecnologias

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT
- Zod
- bcrypt
- Docker (futuro)

---

# Arquitetura

O backend seguirá arquitetura modular.

Cada módulo possuirá:

- Controller
- Service
- Repository
- Validator
- Routes

Exemplo:

modules/
├── auth
├── users
├── condominiums
├── visitors
├── packages
├── reservations
├── notices
├── notifications
├── reports
└── audit

---

# Estrutura de pastas

src/

config/

middlewares/

modules/

shared/

utils/

validators/

---

# Multi Tenant

Todos os condomínios utilizarão o mesmo banco PostgreSQL.

Todo registro operacional possuirá:

condominiumId

Nenhuma consulta utilizará condominiumId enviado pelo frontend.

O condomínio será obtido através do usuário autenticado.

---

# Perfis

PLATFORM_ADMIN

CONDOMINIUM_ADMIN

MANAGER

DOORMAN

RESIDENT

---

# Planos

Inicialmente existirão dois planos.

ESSENTIAL

COMPLETE

As funcionalidades serão configuradas através de:

Plan

Feature

PlanFeature

---

# Segurança

JWT

Refresh Token

Hash de senha

Bloqueio após tentativas inválidas

Auditoria

---

# Comunicação

Os módulos nunca enviarão WhatsApp diretamente.

Sempre utilizarão NotificationService.

NotificationService decidirá se envia:

- Notificação interna
- Email
- WhatsApp
- Push

---

# Banco

Banco único PostgreSQL.

Prisma ORM.

Soft Delete quando necessário.

Auditoria de alterações.

---

# Objetivo da arquitetura

Separar responsabilidades.

Facilitar manutenção.

Facilitar testes.

Escalar para centenas de condomínios.

Permitir novas funcionalidades sem refatorações grandes.