// Builds the one-time SQL Editor script for an EMPTY Supabase project.
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'supabase', 'migrations');
const target = join(root, 'supabase', 'generated', 'setup.sql');
const migrations = readdirSync(source).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
const sql = migrations.map((file) => `-- Migration: ${file}\n${readFileSync(join(source, file), 'utf8')}`).join('\n\n');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, '-- Generated from migrations. Run once on the confirmed EMPTY project.\n-- Bootstrap the super admin separately after the first verified sign-in.\nbegin;\n\n' + sql + '\n\ncommit;\n');
console.log(`Wrote ${target} (${migrations.length} migrations).`);

const localEnv = join(root, '.env.local');
if (existsSync(localEnv)) process.loadEnvFile(localEnv);
const owner = process.env.EGABAY_BOOTSTRAP_ADMIN_EMAIL;
if (owner) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner)) throw new Error('Set a valid EGABAY_BOOTSTRAP_ADMIN_EMAIL.');
  const template = readFileSync(join(root, 'supabase', 'admin', 'bootstrap_super_admin.sql'), 'utf8');
  writeFileSync(join(dirname(target), 'bootstrap_super_admin.sql'), template.replaceAll('__BOOTSTRAP_ADMIN_EMAIL__', owner.replaceAll("'", "''")));
  console.log('Wrote local owner bootstrap SQL. Run it after the first verified sign-in.');
}
