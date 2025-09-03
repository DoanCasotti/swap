# Instalação

## Pré-requisitos

- Git
- Node.js
- Docker
- Kubernetes (kubectl e um cluster configurado)
- Crossplane configurado com o Provider AWS

## Passos

1. Clone o repositório oficial:
   ```bash
   git clone https://github.com/DoanCasotti/swap.git
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd swap
   ```
3. Configure o Crossplane:
   - Instale os providers necessários.
   - Aplique as `Compositions` e `XRDs` do diretório `crossplane/`.

4. Instale as dependências dos microserviços:
   ```bash
   npm install
   ```

5. Crie as imagens Docker:
   ```bash
   docker build -t transaction-api ./docker/transaction-api
   docker build -t notification-service ./docker/notification-service
   ```

6. Aplique os manifests do Kubernetes:
   ```bash
   kubectl apply -f k8s/
   ```

7. Acesse a aplicação:
   - Transaction API: `http://localhost:8080`
   - Notification Service: `http://localhost:8081`
