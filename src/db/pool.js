const { Pool } = require('pg');

/**
 * Parses a PostgreSQL connection URL robustly using string manipulation
 * instead of Node's URL class, to handle special characters in passwords.
 */
function parseDatabaseUrl(url) {
  // Normalize postgres:// to postgresql://
  const str = url.replace(/^postgres:\/\//, '').replace(/^postgresql:\/\//, '');

  // Split credentials from host at the LAST @ (passwords can contain @)
  const lastAt = str.lastIndexOf('@');
  if (lastAt === -1) throw new Error('DATABASE_URL: missing @ separator');

  const credentials = str.slice(0, lastAt);
  const hostPart = str.slice(lastAt + 1);

  // Parse user:password
  const colonIdx = credentials.indexOf(':');
  const user = credentials.slice(0, colonIdx);
  const password = credentials.slice(colonIdx + 1);

  // Parse host:port/database?params
  const slashIdx = hostPart.indexOf('/');
  const hostPort = hostPart.slice(0, slashIdx);
  const dbStr = hostPart.slice(slashIdx + 1).split('?')[0];

  const colonInHost = hostPort.lastIndexOf(':');
  const host = hostPort.slice(0, colonInHost || hostPort.length);
  const port = parseInt(hostPort.slice(colonInHost + 1) || '5432');

  return { user, password, host, port, database: dbStr };
}

const connectionString = process.env.DATABASE_URL;
let poolConfig = { connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000, max: 10 };

if (connectionString) {
  try {
    const parsed = parseDatabaseUrl(connectionString);
    poolConfig = {
      ...poolConfig,
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      user: parsed.user,
      password: parsed.password,
      ssl: { rejectUnauthorized: false },
    };
    console.log(`🔌 DB: ${parsed.host}:${parsed.port}/${parsed.database} (user: ${parsed.user})`);
  } catch (err) {
    console.error('❌ Erro ao parsear DATABASE_URL:', err.message);
  }
} else {
  console.warn('⚠️  DATABASE_URL não configurado!');
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Pool PostgreSQL erro:', err.message);
});

module.exports = pool;
