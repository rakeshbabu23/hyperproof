const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, closeDatabase } = require('../src/config/database');
const app = require('../src/app');

describe('risk and mitigation API (integration)', () => {
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

  it('creates a risk, applies a mitigation, and restores residual risk after deletion', async () => {
    const created = await request('POST', '/risks', {
      title: 'Data breach',
      description: 'Unauthorized access to customer data',
      category: 'Security',
      owner: 'Security Team',
      likelihood: 4,
      impact: 5,
      status: 'Open',
    });

    assert.equal(created.status, 201);
    assert.equal(created.payload.success, true);
    assert.equal(created.payload.data.inherentScore, 20);
    assert.equal(created.payload.data.residualScore, 20);
    assert.equal(created.payload.data.mitigationCount, 0);

    const riskId = created.payload.data.id;

    const mitigation = await request('POST', `/risks/${riskId}/mitigations`, {
      description: 'Enforce MFA for all users',
      effectiveness: 5,
    });

    assert.equal(mitigation.status, 201);
    assert.equal(mitigation.payload.success, true);
    assert.equal(mitigation.payload.data.risk.inherentScore, 20);
    assert.equal(mitigation.payload.data.risk.residualScore, 10);
    assert.equal(mitigation.payload.data.risk.mitigationCount, 1);

    const fetchedWithMitigation = await request('GET', `/risks/${riskId}`);
    assert.equal(fetchedWithMitigation.status, 200);
    assert.equal(fetchedWithMitigation.payload.data.inherentScore, 20);
    assert.equal(fetchedWithMitigation.payload.data.residualScore, 10);
    assert.equal(fetchedWithMitigation.payload.data.mitigationCount, 1);

    const deleted = await request(
      'DELETE',
      `/mitigations/${mitigation.payload.data.mitigation.id}`,
    );
    assert.equal(deleted.status, 200);
    assert.equal(deleted.payload.data.deleted, true);

    const fetchedAfterDelete = await request('GET', `/risks/${riskId}`);
    assert.equal(fetchedAfterDelete.status, 200);
    assert.equal(fetchedAfterDelete.payload.data.inherentScore, 20);
    assert.equal(fetchedAfterDelete.payload.data.residualScore, 20);
    assert.equal(fetchedAfterDelete.payload.data.mitigationCount, 0);
  });

  it('rejects closing a risk that has no mitigations', async () => {
    const created = await request('POST', '/risks', {
      title: 'Vendor outage',
      description: 'Critical vendor becomes unavailable',
      category: 'Operational',
      owner: 'Ops',
      likelihood: 3,
      impact: 3,
      status: 'Open',
    });

    assert.equal(created.status, 201);
    const riskId = created.payload.data.id;

    const closed = await request('PUT', `/risks/${riskId}`, {
      title: 'Vendor outage',
      description: 'Critical vendor becomes unavailable',
      category: 'Operational',
      owner: 'Ops',
      likelihood: 3,
      impact: 3,
      status: 'Closed',
    });

    assert.equal(closed.status, 400);
    assert.equal(closed.payload.success, false);
    assert.match(
      closed.payload.message,
      /cannot be marked as Closed when it has no mitigations/i,
    );
  });

  it('rejects deleting the last mitigation from a Closed risk', async () => {
    const created = await request('POST', '/risks', {
      title: 'Access control gap',
      description: 'Privileged access is not reviewed',
      category: 'Compliance',
      owner: 'Compliance',
      likelihood: 2,
      impact: 4,
      status: 'Open',
    });

    assert.equal(created.status, 201);
    const riskId = created.payload.data.id;

    const mitigation = await request('POST', `/risks/${riskId}/mitigations`, {
      description: 'Quarterly access review',
      effectiveness: 4,
    });
    assert.equal(mitigation.status, 201);
    const mitigationId = mitigation.payload.data.mitigation.id;

    const closed = await request('PUT', `/risks/${riskId}`, {
      title: 'Access control gap',
      description: 'Privileged access is not reviewed',
      category: 'Compliance',
      owner: 'Compliance',
      likelihood: 2,
      impact: 4,
      status: 'Closed',
    });
    assert.equal(closed.status, 200);

    const deleted = await request('DELETE', `/mitigations/${mitigationId}`);
    assert.equal(deleted.status, 400);
    assert.equal(deleted.payload.success, false);
    assert.match(
      deleted.payload.message,
      /cannot delete the last mitigation from a Closed risk/i,
    );

    const fetched = await request('GET', `/risks/${riskId}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.payload.data.status, 'Closed');
    assert.equal(fetched.payload.data.mitigationCount, 1);
  });
});
