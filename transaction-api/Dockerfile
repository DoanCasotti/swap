# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
# Copia package(s) e instala dependências (usa package-lock.json se existir)
COPY package.json package-lock.json* ./
RUN npm ci --production --silent

# Copia código da aplicação
COPY src ./src

# Final stage
FROM node:20-alpine
WORKDIR /app
# instala curl para healthcheck
RUN apk add --no-cache curl

# Copia node_modules e código do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
EXPOSE 8080

# Executar como usuário não-root (imagem node já fornece usuário 'node')
USER node

# Healthcheck usa endpoint /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "src/app.js"]
