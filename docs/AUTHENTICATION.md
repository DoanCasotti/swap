# Sistema de Autenticação - Fintech Platform

## Visão Geral

O sistema de autenticação implementado utiliza JWT (JSON Web Tokens) com padrão de access/refresh tokens para fornecer segurança robusta e escalável para a plataforma fintech.

## Arquitetura de Segurança

### 1. Padrão de Tokens
- **Access Token**: JWT com curta duração (15 minutos) contendo informações do usuário
- **Refresh Token**: JWT com longa duração (7 dias) para renovar access tokens
- **Webhook Signature**: HMAC SHA-256 para autenticação de webhooks entre serviços

### 2. Componentes Implementados

#### Transaction API Service (Porta 8080)
- **Endpoints de Autenticação**:
  - `POST /auth/register` - Registro de novos usuários
  - `POST /auth/login` - Login com email/senha
  - `POST /auth/refresh` - Renovação de access token
  - `POST /auth/logout` - Logout e invalidação de tokens

- **Endpoints Protegidos**:
  - `POST /transactions` - Criar transação (requer autenticação)
  - `GET /transactions/:id` - Buscar transação (requer autenticação)
  - `GET /admin/users` - Endpoint administrativo (requer role admin)

#### Notification Service (Porta 8081)
- **Endpoints Protegidos**:
  - `POST /notify` - Enviar notificação (requer autenticação)
  - `GET /notifications/:user_id` - Buscar notificações do usuário
  
- **Webhook Endpoints**:
  - `POST /webhook/transaction` - Receber eventos do Transaction API

## Middleware de Segurança

### 1. Authentication Middleware
```javascript
// Autenticação obrigatória
app.use('/protected-route', authenticateToken);

// Autenticação opcional
app.use('/public-route', optionalAuth);

// Autorização por role
app.use('/admin-route', authenticateToken, authorize(['admin']));
```

### 2. Webhook Authentication
```javascript
// Verificação de assinatura HMAC
app.post('/webhook/transaction', authenticateWebhook);
```

## Fluxo de Autenticação

### 1. Registro de Usuário
```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "João",
  "lastName": "Silva"
}
```

**Validações**:
- Email único e válido
- Senha forte (mínimo 8 caracteres, maiúscula, minúscula, número, símbolo)
- Campos obrigatórios preenchidos

### 2. Login
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Resposta**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "role": "user"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

### 3. Uso de Tokens
```bash
# Incluir token no header Authorization
Authorization: Bearer <access-token>
```

### 4. Renovação de Token
```bash
POST /auth/refresh
{
  "refreshToken": "refresh-token"
}
```

## Configuração de Segurança

### 1. Variáveis de Ambiente
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Webhook Security
WEBHOOK_SECRET=your-webhook-secret-key

# Database
DB_HOST=localhost
DB_NAME=fintech_platform
DB_USER=postgres
DB_PASSWORD=secure-password

# Redis for Caching
REDIS_URL=redis://localhost:6379
```

### 2. Configurações de Segurança
- **Password Hashing**: bcrypt com salt rounds 12
- **Helmet.js**: Proteção de headers HTTP
- **CORS**: Configurado com origins específicos
- **Rate Limiting**: Implementado via middleware
- **Request Logging**: Winston para auditoria

## Testes de Autenticação

### 1. Transaction API Tests
```bash
cd docker/transaction-api
npm test
```

**Cobertura de Testes**:
- ✅ JWT token generation e verification
- ✅ Middleware de autenticação
- ✅ Registro de usuários
- ✅ Login e logout
- ✅ Autorização por roles
- ✅ Validation de inputs

### 2. Notification Service Tests
```bash
cd docker/notification-service
npm test
```

**Cobertura de Testes**:
- ✅ Autenticação JWT
- ✅ Webhook signature verification
- ✅ Middleware de autorização

## Segurança em Kubernetes

### 1. Secrets Management
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jwt-secrets
data:
  JWT_SECRET: <base64-encoded-secret>
  JWT_REFRESH_SECRET: <base64-encoded-secret>
  WEBHOOK_SECRET: <base64-encoded-secret>
```

### 2. RBAC Configuration
- Service accounts isolados para cada serviço
- Permissions mínimas necessárias
- Network policies para isolamento de rede

### 3. Pod Security Standards
- Containers executam como usuário não-root (UID 10001)
- Read-only root filesystem
- Security contexts restritivos
- Resource limits configurados

## Melhores Práticas Implementadas

### 1. Segurança de Tokens
- Access tokens com curta duração
- Refresh tokens armazenados no banco com expiração
- Invalidação de tokens no logout
- Rotação automática de refresh tokens

### 2. Validação de Dados
- Joi para validation de schemas
- Sanitização de inputs
- Tratamento seguro de erros

### 3. Logging e Auditoria
- Log de todas as ações de autenticação
- Tracking de tentativas de login
- Auditoria de mudanças críticas

### 4. Rate Limiting
- Proteção contra ataques de força bruta
- Throttling de requests por IP
- Timeouts apropriados

## Troubleshooting

### 1. Token Expirado
```json
{
  "error": "Token expired"
}
```
**Solução**: Use o refresh token para obter novo access token

### 2. Token Inválido
```json
{
  "error": "Invalid token"
}
```
**Solução**: Realize novo login

### 3. Webhook Signature Inválida
```json
{
  "error": "Invalid webhook signature"
}
```
**Solução**: Verifique se o WEBHOOK_SECRET está correto em ambos os serviços

### 4. Permissões Insuficientes
```json
{
  "error": "Access denied. Insufficient permissions."
}
```
**Solução**: Verifique se o usuário tem a role necessária para o endpoint

## Próximos Passos

1. **Rate Limiting**: Implementar redis-based rate limiting
2. **OAuth 2.0**: Adicionar suporte a providers externos (Google, GitHub)
3. **MFA**: Implementar autenticação de dois fatores
4. **Session Management**: Gerenciamento avançado de sessões
5. **Audit Logging**: Sistema completo de auditoria