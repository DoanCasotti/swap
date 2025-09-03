const request = require('supertest');
const app = require('../src/app'); // Ajuste o caminho para o arquivo principal do serviço

describe('Transaction API', () => {
  it('should create a new transaction', async () => {
    const response = await request(app)
      .post('/transactions')
      .send({
        user_id: '123',
        amount: 100.5,
        currency: 'USD',
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should fetch a transaction by ID', async () => {
    const transactionId = 'txn_001';
    const response = await request(app).get(`/transactions/${transactionId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', transactionId);
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
