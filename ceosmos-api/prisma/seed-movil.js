/*
 * Seed de CEOSMOS Móvil Integral.
 *
 * Crea (o actualiza) una cuenta con el correo ya verificado para poder entrar
 * desde la app cuando el envío de correos de verificación (Resend) no está
 * configurado. No contiene credenciales: se leen de variables de entorno.
 *
 *   SEED_EMAIL=correo@dominio SEED_PASSWORD='Clave#Segura1' SEED_USERNAME=nombre \
 *   SEED_ROLE=USER|ADMIN node prisma/seed-movil.js
 *
 * La contraseña debe cumplir la política del API (mayúscula, minúscula, número,
 * símbolo, 8+ caracteres). Usa DATABASE_URL del .env del API.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
const bcrypt = require('bcrypt');

const PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

async function main() {
  const email = (process.env.SEED_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_PASSWORD || '';
  const username = (process.env.SEED_USERNAME || '').trim();
  const role = (process.env.SEED_ROLE || 'USER').toUpperCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('SEED_EMAIL inválido');
  if (!PASSWORD.test(password)) throw new Error('SEED_PASSWORD no cumple la política');
  if (username.length < 3 || username.length > 30) throw new Error('SEED_USERNAME: 3 a 30 caracteres');
  if (!['USER', 'ADMIN'].includes(role)) throw new Error('SEED_ROLE debe ser USER o ADMIN');

  const url = process.env.DATABASE_URL || '';
  let neon = false;
  try { neon = new URL(url).hostname.endsWith('.neon.tech'); } catch { /* URL inválida */ }
  if (neon) neonConfig.webSocketConstructor = ws;
  const prisma = neon
    ? new PrismaClient({ adapter: new PrismaNeon(new Pool({ connectionString: url })) })
    : new PrismaClient(); // PostgreSQL local de desarrollo
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, username, passwordHash, emailVerified: true, role, active: true },
      update: { username, passwordHash, emailVerified: true, role, active: true, failedLoginAttempts: 0, lockedUntil: null },
    });
    await prisma.preferences.upsert({
      where: { userId: user.id },
      create: { userId: user.id, flowTimeDefault: 25 },
      update: {},
    });
    console.log(`Cuenta lista: ${user.email} (${user.role}) id=${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
