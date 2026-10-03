const {execFileSync}=require('node:child_process');
const args=['compose','-f','compose.yaml','-f','compose.recovery.yaml'];
function run(more){return execFileSync('docker',[...args,...more],{encoding:'utf8'}).trim();}
console.log(run(['exec','-T','postgres','psql','-U','infinitycondo','-d','infinitycondo_homolog','-c',"SELECT archived_count, failed_count, last_archived_wal, last_archived_time, last_failed_time FROM pg_stat_archiver;"]));
console.log(run(['exec','-T','recovery-base','sh','-c','ls -lh /recovery/base; du -sh /recovery/wal; df -h /recovery']));
console.log(run(['ps']));
