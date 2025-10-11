#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function ensureCert() {
  const keyPath = path.resolve(__dirname, '../certs/dev/key.pem');
  const crtPath = path.resolve(__dirname, '../certs/dev/cert.pem');

  await fs.ensureDir(path.dirname(keyPath));

  const exists = (await fs.pathExists(keyPath)) && (await fs.pathExists(crtPath));
  if (exists) {
    console.log('Development TLS certificate already present.');
    return;
  }

  const opensslArgs = [
    'req',
    '-x509',
    '-nodes',
    '-days',
    '825',
    '-newkey',
    'rsa:2048',
    '-keyout',
    keyPath,
    '-out',
    crtPath,
    '-subj',
    '/CN=localhost'
  ];

  console.log('Generating development certificate with OpenSSL...');
  const result = spawnSync('openssl', opensslArgs, { stdio: 'inherit' });

  if (result.status === 0) {
    console.log('OpenSSL certificate generation complete.');
    return;
  }

  console.warn('OpenSSL not available, falling back to selfsigned package.');
  const selfsigned = require('selfsigned');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, {
    days: 825,
    keySize: 2048,
    algorithm: 'sha256'
  });

  await fs.writeFile(keyPath, pems.private, { mode: 0o600 });
  await fs.writeFile(crtPath, pems.cert, { mode: 0o600 });
  console.log('Self-signed certificate generated.');
}

ensureCert().catch((err) => {
  console.error('Failed to create development certificate:', err);
  process.exitCode = 1;
});
