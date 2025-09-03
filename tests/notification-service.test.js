const request = require('supertest');
const app = require('../src/app'); // Ajuste o caminho para o arquivo principal do serviço

describe('Notification Service', () => {
  it('should send a notification', async () => {
    const response = await request(app)
      .post('/notify')
      .send({
        user_id: '123',
        message: 'Transaction completed successfully.',
      });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('should fetch notifications for a user', async () => {
    const userId = '123';
    const response = await request(app).get(`/notifications/${userId}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
