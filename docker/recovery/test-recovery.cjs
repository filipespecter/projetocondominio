/* Teste real de PITR no mesmo Docker: a cópia de verificação é temporária,
   sem porta publicada; o banco da aplicação nunca é restaurado. */
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const token = randomUUID().replaceAll('-', '');
const table = `_sic_recovery_${token}`;
const container = `sic-restore-${token}`;
const volume = `sic-restore-${token}`;
const compose = ['compose', '-f', 'compose.yaml', '-f', 'compose.recovery.yaml'];
function docker(args) {
  return execFileSync('docker', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function sql(query) {
  return docker([...compose, 'exec', '-T', 'postgres', 'psql', '-U', 'infinitycondo', '-d', 'infinitycondo_homolog', '-v', 'ON_ERROR_STOP=1', '-Atqc', query]);
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  let tableCreated = false;
  try {
    const base = docker([...compose, 'exec', '-T', 'recovery-base', 'sh', '-c', "find /recovery/base -mindepth 1 -maxdepth 1 -type d ! -name '*.partial' | sort | tail -1"]);
    if (!/^\/recovery\/base\/[0-9TZ]+$/.test(base)) throw new Error('Aguarde o primeiro BASE_BACKUP_VERIFIED antes de testar.');
    const settings = sql("SELECT current_setting('archive_mode') || '|' || current_setting('wal_level');");
    if (settings !== 'on|replica') throw new Error(`Configuração de recuperação inválida: ${settings}`);
    sql(`CREATE TABLE public."${table}" (id integer PRIMARY KEY); INSERT INTO public."${table}" VALUES (1);`);
    tableCreated = true;
    const target = sql("SELECT to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"');");
    if (!/^[0-9T:.\-Z]+$/.test(target)) throw new Error('Horário de teste inválido.');
    await delay(1100);
    sql(`DELETE FROM public."${table}";`);
    sql("SELECT pg_switch_wal();");
    const wal = sql("SELECT pg_walfile_name(pg_current_wal_lsn() - 1);");
    let archived = false;
    for (let i = 0; i < 30; i++) {
      try { docker([...compose, 'exec', '-T', 'postgres', 'test', '-f', `/recovery/wal/${wal}`]); archived = true; break; } catch { await delay(2000); }
    }
    if (!archived) throw new Error('WAL não foi arquivado em 60s. Consulte pg_stat_archiver.');
    docker(['volume', 'create', volume]);
    docker(['run', '--rm', '--network', 'none', '-e', `RECOVERY_TARGET_TIME=${target}`, '-e', `BASE_BACKUP_NAME=${path.posix.basename(base)}`, '-v', 'infinitycondo_recovery_data:/recovery:ro', '-v', `${volume}:/restore`, '-v', `${path.join(root, 'docker/recovery/prepare-restore.sh')}:/opt/prepare.sh:ro`, 'postgres:16-alpine', 'sh', '/opt/prepare.sh']);
    docker(['run', '-d', '--name', container, '--network', 'none', '-v', `${volume}:/var/lib/postgresql/data`, '-v', 'infinitycondo_recovery_data:/recovery:ro', 'postgres:16-alpine']);
    let recovered = false;
    for (let i = 0; i < 60; i++) {
      try {
        const result = docker(['exec', container, 'psql', '-U', 'infinitycondo', '-d', 'infinitycondo_homolog', '-v', 'ON_ERROR_STOP=1', '-Atqc', `SELECT pg_is_wal_replay_paused(); SELECT count(*) FROM public."${table}";`]);
        if (result === 't\n1' || result === 't\r\n1') { recovered = true; break; }
      } catch { /* aguardar início e replay */ }
      await delay(1000);
    }
    if (!recovered) {
      execFileSync('docker', ['logs', '--tail', '80', container], { cwd: root, stdio: 'inherit' });
      throw new Error('A cópia não confirmou a recuperação por horário.');
    }
    if (sql(`SELECT count(*) FROM public."${table}";`) !== '0') throw new Error('Resultado inesperado na base original.');
    console.log('PITR_OK: cópia recuperou o registro anterior à exclusão; base original permanece com 0 registros de teste.');
    console.log('A restauração por horário foi verificada; recuperação seletiva de condomínio exige revisão antes de importar dados.');
  } catch (error) {
    console.error('PITR_FAILED:', error.message);
    if (error.stderr) console.error(String(error.stderr));
    process.exitCode = 1;
  } finally {
    if (tableCreated) { try { sql(`DROP TABLE public."${table}";`); } catch { console.error(`Remova somente a tabela de teste ${table} quando o banco estiver disponível.`); } }
    try { docker(['rm', '-f', container]); } catch {}
    try { docker(['volume', 'rm', volume]); } catch {}
  }
})();
