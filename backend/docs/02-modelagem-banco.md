# InfinityCondo - Modelagem do Banco de Dados

## Objetivo

Este documento define toda a estrutura do banco de dados do
InfinityCondo.

Nenhuma tabela deverá ser criada no Prisma antes de estar documentada
aqui.

------------------------------------------------------------------------

# Organização

O banco será dividido em domínios.

1.  Plataforma SaaS
2.  Condomínio
3.  Pessoas
4.  Operação
5.  Comunicação
6.  Administração

------------------------------------------------------------------------

# Domínio 1 - Plataforma SaaS

## Plan

Responsável pelos planos comercializados.

Campos:

-   id
-   name
-   code
-   description
-   monthlyPrice
-   yearlyPrice
-   active
-   displayOrder
-   createdAt
-   updatedAt
-   deletedAt

Relacionamentos:

Plan ↓ PlanFeature ↓ Feature

Também possui:

Subscription

------------------------------------------------------------------------

## Feature

Representa uma funcionalidade do sistema.

Exemplos:

-   BI
-   Relatórios
-   Notificações
-   WhatsApp
-   Dashboard
-   Backup

Campos:

-   id
-   code
-   name
-   description
-   valueType
-   active
-   createdAt
-   updatedAt
-   deletedAt

------------------------------------------------------------------------

## PlanFeature

Relaciona planos e funcionalidades.

Campos:

-   planId
-   featureId
-   enabled
-   limitValue
-   configuration

------------------------------------------------------------------------

## Subscription

Representa a assinatura do condomínio.

Campos:

-   id
-   condominiumId
-   planId
-   status
-   billingCycle
-   monthlyValue
-   contractStart
-   contractEnd
-   trialEnd
-   suspendedAt
-   canceledAt
-   cancellationReason
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# Domínio 2 - Condomínio

## Condominium

Representa um cliente do InfinityCondo.

Campos:

-   id
-   code
-   fantasyName
-   legalName
-   document
-   email
-   phone
-   zipCode
-   address
-   number
-   complement
-   district
-   city
-   state
-   logo
-   timezone
-   status
-   createdAt
-   updatedAt
-   deletedAt

------------------------------------------------------------------------

## BuildingBlock

Representa:

-   bloco
-   torre
-   setor

Campos:

-   id
-   condominiumId
-   name
-   description
-   active
-   createdAt
-   updatedAt

------------------------------------------------------------------------

## ResidentialUnit

Representa qualquer unidade residencial.

Pode ser:

-   apartamento
-   casa
-   cobertura

Campos:

-   id
-   condominiumId
-   buildingBlockId
-   identifier
-   floor
-   unitType
-   status
-   observations
-   createdAt
-   updatedAt
-   deletedAt

------------------------------------------------------------------------

## CommonArea

Representa áreas comuns.

Exemplos:

-   Piscina
-   Salão de festas
-   Academia
-   Churrasqueira

Campos:

-   id
-   condominiumId
-   name
-   description
-   reservationRequired
-   active
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# Domínio 3 - Pessoas

## User

Única tabela de autenticação.

Campos:

-   id
-   condominiumId
-   name
-   username
-   email
-   phone
-   passwordHash
-   role
-   status
-   mustChangePassword
-   lastLogin
-   createdAt
-   updatedAt
-   deletedAt

------------------------------------------------------------------------

## UnitResident

Relaciona moradores às unidades.

Campos:

-   id
-   unitId
-   userId
-   relationshipType
-   isPrimary
-   startDate
-   endDate

------------------------------------------------------------------------

## ResidentProfile

Informações específicas do morador.

Campos:

-   id
-   userId
-   cpf
-   birthDate
-   emergencyContact
-   emergencyPhone

------------------------------------------------------------------------

## DoormanProfile

Informações específicas do porteiro.

Campos:

-   id
-   userId
-   employeeCode
-   workShift
-   hiredAt

------------------------------------------------------------------------

# Domínio 4 - Operação

Tabelas previstas:

-   Visitor
-   VisitorAuthorization
-   Package
-   Reservation
-   Occurrence
-   Notice
-   ServiceProvider

------------------------------------------------------------------------

# Domínio 5 - Comunicação

Tabelas previstas:

-   Notification
-   NotificationRecipient
-   EmailQueue
-   WhatsappQueue
-   PushQueue

------------------------------------------------------------------------

# Domínio 6 - Administração

Tabelas previstas:

-   AuditLog
-   SystemSetting
-   FileUpload

------------------------------------------------------------------------

# Regras Gerais

Todas as tabelas operacionais possuirão:

-   condominiumId
-   createdAt
-   updatedAt

Sempre que necessário utilizarão:

-   deletedAt

Nenhum dado será excluído fisicamente sem necessidade.

------------------------------------------------------------------------

# Índices

Todos os campos de pesquisa frequente deverão possuir índice.

Exemplos:

-   email
-   username
-   document
-   condominiumId
-   status
-   createdAt

------------------------------------------------------------------------

# Próximas etapas

Após aprovação desta modelagem serão criados:

-   schema.prisma
-   migrations
-   seed
-   repositories
-   services
