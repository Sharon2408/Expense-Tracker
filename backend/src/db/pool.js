const { Pool, types } = require('pg');
const env = require('../config/env');

/**
 * By default `pg` parses a SQL DATE into a JS Date built from LOCAL time
 * components. Express then serializes that Date via toJSON()/toISOString(),
 * which renders it in UTC - shifting the calendar date backward by one day
 * for any positive UTC-offset server timezone (e.g. IST, which this app
 * runs under). Returning the raw 'YYYY-MM-DD' string instead sidesteps the
 * conversion entirely, so every expense_date/next_due_date/etc. round-trips
 * through the API exactly as stored, with no timezone-dependent drift.
 * OID 1082 = date.
 */
types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: env.databaseUrl });

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

module.exports = pool;
