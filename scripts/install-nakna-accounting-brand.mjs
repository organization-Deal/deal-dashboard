import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertAccounting } from '../apply-nakna-accounting-brand.mjs';
export const HOOK = 'node apply-nakna-accounting-brand.mjs && node scripts/verify-nakna-accounting-brand.mjs';
export function installHook(root) {
  const index = path.join(root, 'index.html');
  if (!fs.existsSync(index)) throw new Error('ต้องรันใน root ของ deal-dashboard ซึ่งมี index.html');
  assertAccounting(fs.readFileSync(index,'utf8'));
  const p = path.join(root, 'package.json');
  if (!fs.existsSync(p)) throw new Error('ไม่พบ package.json — ห้ามใช้กับ repo อื่น');
  const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
  pkg.scripts ||= {};
  let command = pkg.scripts.deploy || 'npx wrangler deploy';
  // Keep all previous fixes and flags; remove only our own previous hook before adding it again.
  command = command.replace(HOOK + ' && ', '');
  const all = [...command.matchAll(/(?:npx\s+(?:--yes\s+)?|bunx\s+|npm\s+exec\s+)?wrangler\s+deploy\b/g)];
  if (all.length !== 1) throw new Error('deploy script ต้องมี wrangler deploy จุดเดียว — ไม่แก้ command ที่ตีความไม่ได้');
  const i = all[0].index;
  pkg.scripts.deploy = command.slice(0,i) + HOOK + ' && ' + command.slice(i);
  pkg.scripts['nakna:brand'] = 'node apply-nakna-accounting-brand.mjs';
  pkg.scripts['nakna:brand:check'] = 'node scripts/verify-nakna-accounting-brand.mjs';
  // Dependencies, application version, backend names and existing scripts are intentionally retained.
  const after = JSON.stringify(pkg, null, 2) + '\n';
  if (fs.readFileSync(p,'utf8') !== after) fs.writeFileSync(p, after);
  return pkg.scripts.deploy;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    installHook(process.cwd());
    console.log('✓ Nakna Accounting brand hook runs after existing patches, before Wrangler deploy');
  } catch(e) {console.error('✗',e.message);process.exitCode=1;}
}
