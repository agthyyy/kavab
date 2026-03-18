// Feature: kavabanga-learning-platform, Setup verification
import * as fc from 'fast-check';
import app from '../app';
import supertest from 'supertest';

describe('Backend setup', () => {
  it('health endpoint returns ok', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('fast-check is configured with 100 runs', () => {
    let count = 0;
    fc.assert(
      fc.property(fc.integer(), (_n) => {
        count++;
        return true;
      }),
    );
    expect(count).toBe(100);
  });
});
