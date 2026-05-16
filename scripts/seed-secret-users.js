// Secret user seeding tool for all apps
// Usage: `node scripts/seed-secret-users.js <app>`
// Example: node scripts/seed-secret-users.js admin
// This script seeds users with all roles (admin, pro, etc.) for development/testing only.
// DO NOT expose or document this script publicly.

const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

const users = [
  {
    username: 'adminuser',
    email: 'admin@example.com',
    password: 'adminpass',
    roles: ['admin', 'pro', 'user'],
  },
  {
    username: 'prouser',
    email: 'pro@example.com',
    password: 'propass',
    roles: ['pro', 'user'],
  },
  // Add more users/roles as needed
];

const apps = {
  admin: 'http://localhost:3000/api/seed-users',
  core: 'http://localhost:3001/api/seed-users',
  dashboard: 'http://localhost:3002/api/seed-users',
  games: 'http://localhost:3003/api/seed-users',
  kanban: 'http://localhost:3004/api/seed-users',
  prereg: 'http://localhost:3005/api/seed-users',
};

const SEED_SECRET = process.env.SEED_SECRET || 'changeme';

async function seedUsersForApp(app) {
  const url = apps[app];
  if (!url) throw new Error('Unknown app: ' + app);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-seed-secret': SEED_SECRET,
    },
    body: JSON.stringify(users),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Seeding failed for ${app}:`, data);
    process.exit(1);
  }
  console.log(`Secret users seeded for ${app}:`, data.results);
}

async function main() {
  const app = process.argv[2];
  if (!app || !Object.keys(apps).includes(app)) {
    console.error('Usage: node scripts/seed-secret-users.js <app>');
    console.error('Available apps:', Object.keys(apps).join(', '));
    process.exit(1);
  }
  await seedUsersForApp(app);
}

main();
