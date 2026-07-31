# InfinityCondo - Deploy

## Ambiente

- Node.js
- PostgreSQL
- Prisma
- PM2
- Nginx
- HTTPS (Let's Encrypt)

## Pipeline

GitHub
↓
CI/CD
↓
Build
↓
Migration Prisma
↓
Restart PM2
↓
Health Check

## Variáveis

DATABASE_URL
JWT_SECRET
REFRESH_SECRET
PORT
NODE_ENV
UPLOAD_PATH

## Produção

- Backup diário
- Logs centralizados
- HTTPS obrigatório
- Rate Limit
- Helmet
- CORS
- Compressão
- Monitoramento

## Hospedagem

Recomendado:

- VPS Hostinger
- Ubuntu 24.04 LTS
- Docker (opcional)

## Escalabilidade

Frontend React
↓
API Node
↓
PostgreSQL
↓
Storage
↓
Notification Service

