/**
 * End-to-end smoke test against a RUNNING API (default http://localhost:3000).
 *
 *   npm run smoke-test                 # uses API_URL or http://localhost:3000
 *   API_URL=http://10.0.2.2:3000 npm run smoke-test
 *
 * Exercises every public, user, admin-guard and collector endpoint, including
 * the Redis-backed notification pipeline, then deletes the temporary user and
 * outage it created. Exits with code 1 if any check fails.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, '..', '.env');
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
    }
}

const API = (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');
const COLLECTOR_KEY = process.env.COLLECTOR_API_KEY || '';
const results = [];
const created = { userIds: [], outageIds: [] };

async function call(method, route, { body, token, headers = {} } = {}) {
    const response = await fetch(API + route, {
        method,
        headers: {
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }
    return { status: response.status, data };
}

function check(name, condition, detail = '') {
    results.push({ name, ok: Boolean(condition) });
    console.log(`${condition ? '  ✓' : '  ✗'} ${name}${!condition && detail ? `  ->  ${detail}` : ''}`);
}

function section(title) {
    console.log(`\n${title}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
    console.log(`Smoke testing ${API}`);

    section('Service health');
    let res;
    try {
        res = await call('GET', '/');
    } catch (error) {
        console.error(`\n  ✗ Cannot reach ${API}: ${error.message}`);
        console.error('    Start the API first (npm run start:dev) and make sure PostgreSQL and Redis are running.');
        process.exit(1);
    }
    check('GET / responds', res.status === 200 && res.data?.status === 'ok', JSON.stringify(res.data));
    res = await call('GET', '/health');
    check('database is up', res.data?.database === 'up', JSON.stringify(res.data));
    check('redis is up (push notifications)', res.data?.redis === 'up', JSON.stringify(res.data));
    check('server runs in Kigali time', res.data?.timeZone === 'Africa/Kigali', res.data?.timeZone);

    section('Reference data');
    res = await call('GET', '/utilities');
    const utilities = Object.fromEntries((res.data ?? []).map((utility) => [utility.code, utility]));
    check('electricity and water utilities exist', utilities.ELECTRICITY && utilities.WATER, JSON.stringify(res.data));
    res = await call('GET', '/locations');
    const locations = res.data ?? [];
    const districts = locations.filter((location) => !location.sector);
    const sectors = locations.filter((location) => location.sector && !location.cell);
    check('all 30 districts seeded', new Set(districts.map((location) => location.district)).size === 30, `${districts.length}`);
    check('at least 416 sectors seeded', sectors.length >= 416, `${sectors.length}`);
    res = await call('GET', '/locations/district/Kicukiro');
    const kicukiro = (res.data ?? []).find((location) => !location.sector);
    const niboye = (res.data ?? []).find((location) => location.sector === 'Niboye');
    check('district lookup returns sectors', kicukiro && niboye);
    check('invalid location id is rejected with 400', (await call('GET', '/locations/not-a-uuid')).status === 400);

    section('Accounts');
    const suffix = String(Date.now()).slice(-6);
    const localPhone = `0789${suffix}`;
    const password = 'smoke-test-1';
    res = await call('POST', '/auth/register', {
        body: { phone: `+250 789 ${suffix.slice(0, 3)} ${suffix.slice(3)}`, password, firstName: 'Smoke', lastName: 'Test' },
    });
    check('register with +250 number', res.status === 201, JSON.stringify(res.data));
    if (res.data?.user?.id) created.userIds.push(res.data.user.id);
    check('phone stored as 07XXXXXXXX', res.data?.user?.phone === localPhone, res.data?.user?.phone);
    check('password never returned', res.data?.user && !('password' in res.data.user));
    res = await call('POST', '/auth/register', { body: { phone: localPhone, password, firstName: 'Smoke', lastName: 'Test' } });
    check('duplicate phone rejected with 409', res.status === 409, `${res.status}`);
    res = await call('POST', '/auth/register', { body: { phone: '0748123456', password, firstName: 'Smoke', lastName: 'Test' } });
    check('non-Rwandan number rejected with 400', res.status === 400, `${res.status}`);
    res = await call('POST', '/auth/login', { body: { phone: localPhone, password: 'wrong-password' } });
    check('wrong password rejected with 401', res.status === 401, `${res.status}`);
    res = await call('POST', '/auth/login', { body: { phone: `0789 ${suffix.slice(0, 3)} ${suffix.slice(3)}`, password } });
    check('login (spaced local number) returns a token', res.status === 201 && res.data?.accessToken, JSON.stringify(res.data));
    const token = res.data?.accessToken;
    check('GET /auth/me', (await call('GET', '/auth/me', { token })).data?.phone === localPhone);
    check('protected route without token returns 401', (await call('GET', '/subscriptions')).status === 401);
    res = await call('PATCH', '/users/me', { token, body: { firstName: 'Smokey', email: `smoke${suffix}@example.com` } });
    check('update profile', res.status === 200 && res.data?.firstName === 'Smokey', JSON.stringify(res.data));
    res = await call('PATCH', '/users/me/password', { token, body: { currentPassword: password, newPassword: 'smoke-test-2' } });
    check('change password', res.status === 200, JSON.stringify(res.data));
    res = await call('POST', '/auth/login', { body: { phone: localPhone, password: 'smoke-test-2' } });
    check('login with the new password', res.status === 201);

    section('Outages (public)');
    res = await call('GET', '/outages/upcoming');
    check('GET /outages/upcoming', res.status === 200 && Array.isArray(res.data));
    res = await call('GET', '/outages/active');
    check('GET /outages/active', res.status === 200 && Array.isArray(res.data));
    check('invalid outage id rejected with 400', (await call('GET', '/outages/abc')).status === 400);
    check('unknown outage returns 404', (await call('GET', '/outages/00000000-0000-4000-8000-000000000000')).status === 404);

    section('Following areas');
    const subscribe = () =>
        call('POST', '/subscriptions', { token, body: { locationId: kicukiro.id, utilityId: utilities.ELECTRICITY.id } });
    res = await subscribe();
    check('follow the whole of Kicukiro', res.status === 201, JSON.stringify(res.data));
    const subscriptionId = res.data?.id;
    check('following twice is rejected with 409', (await subscribe()).status === 409);
    check('stop following', (await call('DELETE', `/subscriptions/${subscriptionId}`, { token })).status === 200);
    check('follow again after removing', (await subscribe()).status === 201);
    res = await call('GET', '/subscriptions', { token });
    check('list followed areas', res.data?.length === 1 && res.data[0].location?.district === 'Kicukiro');

    section('Collector ingestion and alerts');
    const outagePayload = {
        title: 'Smoke test interruption in Kicukiro',
        description: 'Reason: Smoke test. Affected areas: Niboye.',
        utilityId: utilities.ELECTRICITY.id,
        locationId: niboye.id,
        locationIds: [niboye.id],
        startTime: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) + 'T09:00:00+02:00',
        endTime: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) + 'T13:00:00+02:00',
        status: 'planned',
        sourceType: 'official',
        sourceName: 'Rwanda Energy Group',
        sourceUrl: 'https://www.reg.rw/customer-service/power-outages/',
        externalId: `smoke-test-${suffix}`,
    };
    check('collector endpoint requires the API key', (await call('POST', '/outages/internal/collector', { body: outagePayload })).status === 401);
    const keyHeader = { 'X-API-Key': COLLECTOR_KEY };
    res = await call('POST', '/outages/internal/collector', { body: { ...outagePayload, utilityId: 'nope' }, headers: keyHeader });
    check('invalid collector payload rejected with 400', res.status === 400, `${res.status}`);
    res = await call('POST', '/outages/internal/collector', { body: outagePayload, headers: keyHeader });
    check('collector creates an outage', res.status === 201, JSON.stringify(res.data));
    const outage = res.data;
    if (outage?.id) created.outageIds.push(outage.id);
    check('09:00 Kigali time stored as 07:00 UTC', outage?.startTime?.endsWith('T07:00:00.000Z'), outage?.startTime);
    res = await call('POST', '/outages/internal/collector', { body: outagePayload, headers: keyHeader });
    check('same announcement twice rejected with 409', res.status === 409, `${res.status}`);
    check('new outage listed as upcoming', (await call('GET', '/outages/upcoming')).data?.some((item) => item.id === outage?.id));

    let alerts = [];
    for (let attempt = 0; attempt < 20 && !alerts.length; attempt += 1) {
        await sleep(1000);
        alerts = (await call('GET', '/notifications', { token })).data ?? [];
    }
    check('district follower alerted about a sector outage (queue + matching)', alerts.length === 1, `${alerts.length} alerts`);
    check('alert shows Kigali time', alerts[0]?.message?.includes('09:00–13:00 (Kigali time)'), alerts[0]?.message);
    if (alerts[0]) {
        res = await call('PATCH', `/notifications/${alerts[0].id}/read`, { token });
        check('mark alert as read', res.status === 200 && res.data?.isRead === true);
    }

    section('Community reports');
    const report = { locationId: niboye.id, utilityId: utilities.WATER.id, description: 'No water since this morning near the market.' };
    check('too-short report rejected with 400', (await call('POST', '/reports', { token, body: { ...report, description: 'short' } })).status === 400);
    res = await call('POST', '/reports', { token, body: report });
    check('submit report', res.status === 201 && res.data?.status === 'pending', JSON.stringify(res.data));
    const reportId = res.data?.id;
    check('identical report within 10 minutes rejected with 409', (await call('POST', '/reports', { token, body: report })).status === 409);
    res = await call('PATCH', `/reports/${reportId}`, { token, body: { description: 'No water since 7:00 this morning near the market.' } });
    check('edit pending report', res.status === 200);
    check('list my reports', (await call('GET', '/reports', { token })).data?.length === 1);

    section('Devices');
    const pushToken = `ExponentPushToken[smoke${suffix}]`;
    check('invalid push token rejected with 400', (await call('POST', '/devices', { token, body: { pushToken: 'nope', platform: 'android' } })).status === 400);
    res = await call('POST', '/devices', { token, body: { pushToken, platform: 'android' } });
    check('register device', res.status === 201 && res.data?.id, JSON.stringify(res.data));
    check('unregister device', (await call('DELETE', `/devices/${res.data?.id}`, { token })).status === 200);

    section('Data sources and access control');
    const heartbeat = { name: 'REG', success: true, itemCount: 0 };
    check('source heartbeat requires the API key', (await call('POST', '/data-sources/internal/report', { body: heartbeat })).status === 401);
    check('source heartbeat accepted with the API key', (await call('POST', '/data-sources/internal/report', { body: heartbeat, headers: keyHeader })).status === 201);
    check('admin overview forbidden for residents', (await call('GET', '/admin/overview', { token })).status === 403);
    check('creating locations requires admin', (await call('POST', '/locations', { body: { province: 'X', district: 'Y' } })).status === 401);
    check('changing outage status requires admin', (await call('PATCH', `/outages/${outage?.id}/status`, { token, body: { status: 'cancelled' } })).status === 403);
}

async function cleanup() {
    if (!created.userIds.length && !created.outageIds.length) return;
    const client = new pg.Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT || 5433),
        user: process.env.DATABASE_USER || 'utility_admin',
        password: process.env.DATABASE_PASSWORD || 'utility_password',
        database: process.env.DATABASE_NAME || 'utility_alerts',
    });
    try {
        await client.connect();
        // Deleting cascades to subscriptions, alerts, reports and devices.
        await client.query(`DELETE FROM outages WHERE id = ANY($1) AND "externalId" LIKE 'smoke-test-%'`, [created.outageIds]);
        await client.query(`DELETE FROM users WHERE id = ANY($1) AND "lastName" = 'Test'`, [created.userIds]);
        console.log('\nTemporary smoke-test data removed.');
    } catch (error) {
        console.warn(`\nCould not remove smoke-test data automatically: ${error.message}`);
    } finally {
        await client.end().catch(() => undefined);
    }
}

try {
    await run();
} catch (error) {
    check('smoke test completed without crashing', false, error.stack);
} finally {
    await cleanup();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
