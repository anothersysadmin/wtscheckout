import { db } from '../src/lib/db.js';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = '/data/backups';
  
  try {
    // Backup database
    const dbBackupPath = join(backupDir, `wts-${timestamp}.db`);
    await db.execute('VACUUM INTO ?', [dbBackupPath]);

    // Backup school logos
    const logosBackupPath = join(backupDir, `logos-${timestamp}.tar.gz`);
    await execAsync(`tar -czf ${logosBackupPath} -C /app/public/logos .`);

    // Backup settings
    const settings = await db.execute('SELECT * FROM settings');
    const settingsBackupPath = join(backupDir, `settings-${timestamp}.json`);
    const settingsStream = createWriteStream(settingsBackupPath);
    settingsStream.write(JSON.stringify(settings.rows, null, 2));
    settingsStream.end();

    // Rotate old backups (keep last 7 days)
    const { stdout } = await execAsync(`find ${backupDir} -type f -mtime +7 -delete`);

    console.log('Backup completed successfully');
    return true;
  } catch (error) {
    console.error('Backup failed:', error);
    return false;
  }
}
