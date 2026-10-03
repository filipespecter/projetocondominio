const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'sic-wal-'));
try {
 fs.mkdirSync(path.join(folder, 'wal'));
 const script = fs.readFileSync(path.join(__dirname, 'archive-wal.sh'), 'utf8').replaceAll('/recovery/wal', path.join(folder, 'wal'));
 const scriptFile = path.join(folder, 'archive.sh'); fs.writeFileSync(scriptFile, script);
 const sourceFile = path.join(folder, 'source'); fs.writeFileSync(sourceFile, 'WAL-TEST-ORIGINAL');
 execFileSync('sh', [scriptFile, sourceFile, '000000010000000000000001']);
 execFileSync('sh', [scriptFile, sourceFile, '000000010000000000000001']);
 fs.writeFileSync(sourceFile, 'WAL-DIFFERENT');
 assert.notEqual(spawnSync('sh', [scriptFile, sourceFile, '000000010000000000000001']).status, 0);
 assert.equal(fs.readFileSync(path.join(folder, 'wal/000000010000000000000001'), 'utf8'), 'WAL-TEST-ORIGINAL');
 assert.notEqual(spawnSync('sh', [scriptFile, sourceFile, '../invalid']).status, 0);
 for(const file of ['archive-wal.sh','base-backup.sh','encrypted-copy.sh','prepare-restore.sh']) execFileSync('sh',['-n',path.join(__dirname,file)]);
 console.log('WAL_OK: arquivo copiado, repetição idêntica aceita, sobrescrita divergente e path traversal bloqueados.');
} finally { fs.rmSync(folder, {recursive:true,force:true}); }
