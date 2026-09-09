const { Client } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'utility_admin',
        password: 'utility_password',
        database: 'utility_alerts',
    });

    await client.connect();
    const passwordHash = bcrypt.hashSync('password123', 10);
    await client.query(
        "update users set password = $1, role = 'ADMIN' where phone = '0780000000'",
        [passwordHash]
    );

    const res = await client.query(
        "select phone, role, password from users where phone = '0780000000'",
    );

    const row = res.rows[0];
    console.log('row=', JSON.stringify(row));
    console.log('compare=', bcrypt.compareSync('password123', row.password));

    await client.end();
})();
