require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const publicRoutes = require('./routes/public');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');

// กัน server รันโดยใช้ secret แบบ hardcode ตอน production (ปลอมแปลง session ได้ถ้ารั่ว)
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production. Refusing to start with an insecure default.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// --- Trust Railway's reverse proxy so req.secure / X-Forwarded-Proto
//     are read correctly. MUST be set before the session middleware,
//     or secure cookies will never round-trip back from the browser. ---
app.set('trust proxy', 1);

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Core middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Session store (PostgreSQL-backed, survives restarts/multiple instances) ---
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ป้องกัน process ล่มทั้งตัวเวลา idle connection หลุด (DB restart / network blip)
// ถ้าไม่ดัก error event นี้ Node จะโยน error ขึ้นไปจนตาย process ทันที
pgPool.on('error', (err) => {
  console.error('Unexpected error on idle PG client (session store):', err);
});

app.use(
  session({
    store: new pgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// --- Routes ---
app.use('/', publicRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminRoutes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong. Check server logs.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});