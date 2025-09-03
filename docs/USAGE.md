# Uso

## Executando a Aplicação

1. Inicie os serviços:
   ```bash
   kubectl port-forward svc/transaction-api 8080:8080
   kubectl port-forward svc/notification-service 8081:8081
   ```

2. Acesse os endpoints:
   - **Transaction API**:
     - `POST /transactions`: Cria uma nova transação.
     - `GET /transactions/{id}`: Consulta uma transação específica.
     - `GET /health`: Verifica a saúde do serviço.
   - **Notification Service**:
     - `POST /notify`: Envia uma notificação.
     - `GET /notifications/{user_id}`: Consulta notificações de um usuário.
     - `GET /health`: Verifica a saúde do serviço.

## Exemplos de Requisições

- **Criar Transação**:
  ```bash
  curl -X POST http://localhost:8080/transactions -H "Content-Type: application/json" -d '{
    "user_id": "123",
    "amount": 100.50,
    "currency": "USD"
  }'
  ```

- **Enviar Notificação**:
  ```bash
  curl -X POST http://localhost:8081/notify -H "Content-Type: application/json" -d '{
    "user_id": "123",
    "message": "Transação concluída com sucesso."
  }'
  ```
