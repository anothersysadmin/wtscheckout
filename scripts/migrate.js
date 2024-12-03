import { db, initializeDatabase } from '../src/lib/db.js';
import { getSchools } from '../src/lib/utils.js';

async function migrateData() {
  console.log('Starting data migration...');

  try {
    // Initialize database schema
    await initializeDatabase();

    // Migrate schools
    const schools = getSchools();
    for (const school of schools) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO schools (id, name, allowNewDevices, logoUrl, address, contact, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [
          school.id,
          school.name,
          school.allowNewDevices ? 1 : 0,
          school.logoUrl || null,
          school.address || null,
          school.contact || null,
        ],
      });
    }

    // Migrate devices from localStorage if they exist
    const storedDevices = localStorage.getItem('devices');
    if (storedDevices) {
      const devices = JSON.parse(storedDevices);
      for (const device of devices) {
        await db.execute({
          sql: `INSERT OR REPLACE INTO devices (
                  id, assetTag, serial, model, status, schoolId, 
                  assignedTo, assignedTimestamp, assignedReason,
                  createdAt, updatedAt
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          args: [
            device.id,
            device.assetTag,
            device.serial || null,
            device.model,
            device.status,
            device.schoolId,
            device.assignedTo?.name || null,
            device.assignedTo?.timestamp || null,
            device.assignedTo?.reason || null,
          ],
        });
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
