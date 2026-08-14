const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, closeDatabase } = require('../src/config/database');
const app = require('../src/app');

describe('risk and mitigation API', () => {
  let server;
  let baseUrl;

  before(async () => {
    initDatabase(':memory:');
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    closeDatabase();
  });

  async function request(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json();
    return { status: response.status, payload };
  }

  function riskBody(overrides = {}) {
    return {
      title: 'Sample risk',
      description: 'Sample description',
      category: 'Security',
      owner: 'Owner',
      likelihood: 4,
      impact: 5,
      status: 'Open',
      ...overrides,
    };
  }

  async function createOpenRisk(overrides = {}) {
    const created = await request('POST', '/risks', riskBody(overrides));
    assert.equal(created.status, 201);
    return created.payload.data;
  }

  it('creates a risk with calculated inherent and residual scores', async () => {
    const created = await request('POST', '/risks', riskBody());

    assert.equal(created.status, 201);
    assert.equal(created.payload.success, true);
    assert.equal(created.payload.data.inherentScore, 20);
    assert.equal(created.payload.data.inherentSeverity, 'Critical');
    assert.equal(created.payload.data.residualScore, 20);
    assert.equal(created.payload.data.mitigationCount, 0);
  });

  it('gets a risk by id', async () => {
    const risk = await createOpenRisk({ title: 'Get me' });

    const fetched = await request('GET', `/risks/${risk.id}`);

    assert.equal(fetched.status, 200);
    assert.equal(fetched.payload.data.id, risk.id);
    assert.equal(fetched.payload.data.title, 'Get me');
    assert.equal(fetched.payload.data.inherentScore, 20);
  });

  it('updates a risk', async () => {
    const risk = await createOpenRisk({ title: 'Before update' });

    const updated = await request('PUT', `/risks/${risk.id}`, riskBody({
      title: 'After update',
      likelihood: 2,
      impact: 2,
      status: 'Mitigating',
    }));

    assert.equal(updated.status, 200);
    assert.equal(updated.payload.data.title, 'After update');
    assert.equal(updated.payload.data.status, 'Mitigating');
    assert.equal(updated.payload.data.inherentScore, 4);
    assert.equal(updated.payload.data.residualScore, 4);
  });

  it('deletes a risk', async () => {
    const risk = await createOpenRisk({ title: 'Delete me' });

    const deleted = await request('DELETE', `/risks/${risk.id}`);
    assert.equal(deleted.status, 200);
    assert.equal(deleted.payload.data.deleted, true);

    const fetched = await request('GET', `/risks/${risk.id}`);
    assert.equal(fetched.status, 404);
  });

  it('creates a mitigation and lowers residual risk', async () => {
    const risk = await createOpenRisk();

    const created = await request('POST', `/risks/${risk.id}/mitigations`, {
      description: 'Enable MFA',
      effectiveness: 5,
    });

    assert.equal(created.status, 201);
    assert.equal(created.payload.data.mitigation.effectiveness, 5);
    assert.equal(created.payload.data.risk.residualScore, 10);
    assert.equal(created.payload.data.risk.mitigationCount, 1);
  });

  it('updates a mitigation and recalculates residual risk', async () => {
    const risk = await createOpenRisk();
    const created = await request('POST', `/risks/${risk.id}/mitigations`, {
      description: 'Training',
      effectiveness: 1,
    });
    const mitigationId = created.payload.data.mitigation.id;
    assert.equal(created.payload.data.risk.residualScore, 18);

    const updated = await request('PUT', `/mitigations/${mitigationId}`, {
      description: 'Stronger control',
      effectiveness: 5,
    });

    assert.equal(updated.status, 200);
    assert.equal(updated.payload.data.mitigation.effectiveness, 5);
    assert.equal(updated.payload.data.risk.residualScore, 10);
  });

  it('deletes a mitigation and restores residual risk', async () => {
    const risk = await createOpenRisk();
    const created = await request('POST', `/risks/${risk.id}/mitigations`, {
      description: 'Temporary control',
      effectiveness: 5,
    });
    const mitigationId = created.payload.data.mitigation.id;

    const deleted = await request('DELETE', `/mitigations/${mitigationId}`);

    assert.equal(deleted.status, 200);
    assert.equal(deleted.payload.data.deleted, true);
    assert.equal(deleted.payload.data.risk.residualScore, 20);
    assert.equal(deleted.payload.data.risk.mitigationCount, 0);
  });

  it('rejects closing a risk with zero mitigations', async () => {
    const risk = await createOpenRisk({ title: 'Cannot close yet' });

    const closed = await request('PUT', `/risks/${risk.id}`, riskBody({
      title: 'Cannot close yet',
      status: 'Closed',
    }));

    assert.equal(closed.status, 400);
    assert.equal(closed.payload.success, false);
    assert.match(
      closed.payload.message,
      /cannot be marked as Closed when it has no mitigations/i,
    );
  });

  it('allows closing a risk that has at least one mitigation', async () => {
    const risk = await createOpenRisk({ title: 'Ready to close' });
    await request('POST', `/risks/${risk.id}/mitigations`, {
      description: 'Control in place',
      effectiveness: 3,
    });

    const closed = await request('PUT', `/risks/${risk.id}`, riskBody({
      title: 'Ready to close',
      status: 'Closed',
    }));

    assert.equal(closed.status, 200);
    assert.equal(closed.payload.data.status, 'Closed');
    assert.equal(closed.payload.data.mitigationCount, 1);
  });

  it('rejects invalid likelihood', async () => {
    const response = await request('POST', '/risks', riskBody({ likelihood: 0 }));

    assert.equal(response.status, 400);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /likelihood/i);
  });

  it('rejects invalid impact', async () => {
    const response = await request('POST', '/risks', riskBody({ impact: 6 }));

    assert.equal(response.status, 400);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /impact/i);
  });

  it('rejects invalid effectiveness', async () => {
    const risk = await createOpenRisk();

    const response = await request('POST', `/risks/${risk.id}/mitigations`, {
      description: 'Bad effectiveness',
      effectiveness: 9,
    });

    assert.equal(response.status, 400);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /effectiveness/i);
  });

  it('returns 404 for a nonexistent risk', async () => {
    const response = await request('GET', '/risks/999999');

    assert.equal(response.status, 404);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /not found/i);
  });

  it('returns 404 for a nonexistent mitigation', async () => {
    const response = await request('PUT', '/mitigations/999999', {
      description: 'Does not exist',
      effectiveness: 3,
    });

    assert.equal(response.status, 404);
    assert.equal(response.payload.success, false);
    assert.match(response.payload.message, /not found/i);
  });

  it('rejects creating a risk as Closed with zero mitigations', async () => {
    const response = await request('POST', '/risks', riskBody({ status: 'Closed' }));

    assert.equal(response.status, 400);
    assert.match(
      response.payload.message,
      /cannot be marked as Closed when it has no mitigations/i,
    );
  });

  it('filters by category and status together (AND)', async () => {
    await createOpenRisk({
      title: 'Security Open',
      category: 'Security',
      status: 'Open',
      likelihood: 5,
      impact: 5,
    });
    await createOpenRisk({
      title: 'Security Mitigating',
      category: 'Security',
      status: 'Mitigating',
      likelihood: 1,
      impact: 1,
    });
    await createOpenRisk({
      title: 'Financial Open',
      category: 'Financial',
      status: 'Open',
      likelihood: 3,
      impact: 3,
    });

    const response = await request(
      'GET',
      '/risks?category=Security&status=Open',
    );

    assert.equal(response.status, 200);
    assert.ok(response.payload.data.length >= 1);
    for (const risk of response.payload.data) {
      assert.equal(risk.category, 'Security');
      assert.equal(risk.status, 'Open');
    }
  });

  it('sorts risks by residual score descending', async () => {
    await createOpenRisk({
      title: 'Low residual sort check',
      likelihood: 1,
      impact: 1,
    });
    await createOpenRisk({
      title: 'High residual sort check',
      likelihood: 5,
      impact: 5,
    });

    const response = await request('GET', '/risks');
    assert.equal(response.status, 200);
    assert.ok(response.payload.data.length >= 2);

    const residuals = response.payload.data.map((risk) => risk.residualScore);
    for (let i = 1; i < residuals.length; i += 1) {
      assert.ok(
        residuals[i - 1] >= residuals[i],
        `expected residual order descending, got ${residuals.join(', ')}`,
      );
    }
  });

  it('cascades mitigation deletion when a risk is deleted', async () => {
    const risk = await createOpenRisk({ title: 'Cascade parent' });
    const mitigation = await request('POST', `/risks/${risk.id}/mitigations`, {
      description: 'Will be cascaded',
      effectiveness: 2,
    });
    const mitigationId = mitigation.payload.data.mitigation.id;

    const deleted = await request('DELETE', `/risks/${risk.id}`);
    assert.equal(deleted.status, 200);

    const updateOrphan = await request('PUT', `/mitigations/${mitigationId}`, {
      description: 'Gone',
      effectiveness: 2,
    });
    assert.equal(updateOrphan.status, 404);
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const response = await fetch(`${baseUrl}/risks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /invalid json/i);
  });
});
