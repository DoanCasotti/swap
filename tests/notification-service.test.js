const request = require('supertest');
const app = require('../notification-service/src/app'); // ajustado para o caminho do service

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
    await request(app).post('/notify').send({ user_id: '123', message: 'one' });
    await request(app).post('/notify').send({ user_id: '123', message: 'two' });
    const response = await request(app).get(`/notifications/123`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
