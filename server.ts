import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    return parseInt(process.argv[portArgIndex + 1], 10);
  }
  return Number(process.env.PORT) || 3000;
}

const PORT = getPort();
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data folder exists
const DATA_DIR = path.join(__dirname, 'server_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'somiti_db.json');
const SEED_PATH = path.join(DATA_DIR, 'initial_seed.json');

function getSeedData() {
  try {
    if (fs.existsSync(SEED_PATH)) {
      return JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading initial seed file:', err);
  }
  return {
    members: [],
    transactions: [],
    loans: [],
    projects: [],
    projectExpenses: [],
    tasks: [],
    cashbook: [],
    lastUpdated: new Date().toISOString(),
  };
}

// Track connected SSE clients for instant live push synchronization
const sseClients = new Set<express.Response>();

function broadcastUpdate(changeType: string, updatedBy: string, data: any) {
  if (sseClients.size === 0) return;
  const payload = JSON.stringify({
    version: data.version,
    lastUpdated: data.lastUpdated,
    changeType,
    updatedBy,
    data,
  });
  const message = `event: somiti_update\ndata: ${payload}\n\n`;

  for (const client of Array.from(sseClients)) {
    try {
      client.write(message);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.members)) {
        if (typeof data.version !== 'number') {
          data.version = 1;
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading database file, using seed fallback:', err);
  }
  const seed = getSeedData();
  saveDatabase(seed, 'init_seed', 'system');
  return seed;
}

function saveDatabase(data: any, changeType: string = 'general_update', updatedBy: string = 'system'): boolean {
  try {
    const nextVersion = (typeof data.version === 'number' ? data.version : 0) + 1;
    data.version = nextVersion;
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    // Instantly notify all connected browser clients across the internet
    broadcastUpdate(changeType, updatedBy, data);
    return true;
  } catch (err) {
    console.error('Error saving database file:', err);
    return false;
  }
}

// Body parsing with generous limit for member photos
app.use(express.json({ limit: '25mb' }));

// Health Checks (Cloud Run, Docker, and frontend probes)
app.get(['/health', '/_healthz', '/api/health'], (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET current database version & lastUpdated (Lightweight polling endpoint)
app.get('/api/version', (req, res) => {
  try {
    const db = loadDatabase();
    res.json({
      version: db.version || 1,
      lastUpdated: db.lastUpdated || new Date().toISOString(),
      memberCount: db.members?.length || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read version', details: err?.message });
  }
});

// POST /api/auth/login - Centralized robust authentication for any device (brand new or existing)
app.post('/api/auth/login', (req, res) => {
  try {
    const { idOrPhone, password } = req.body;
    if (!idOrPhone || !password) {
      return res.status(400).json({ success: false, error: 'User ID and password are required' });
    }

    const raw = String(idOrPhone).trim().toLowerCase();
    const cleanPhone = raw.replace(/[^0-9]/g, '');
    const cleanPass = String(password).trim();

    const db = loadDatabase();
    const found = db.members.find((m: any) => {
      const memNo = (m.memberNo || '').toLowerCase();
      const matchExactId = memNo === raw;
      const matchPrefixId = memNo === `fio-${raw}`;
      const matchPhone = cleanPhone.length >= 5 && (m.phone || '').replace(/[^0-9]/g, '').includes(cleanPhone);
      const matchNameBn = m.nameBn && m.nameBn.trim().toLowerCase() === raw;
      const matchNameEn = m.nameEn && m.nameEn.trim().toLowerCase() === raw;
      return matchExactId || matchPrefixId || matchPhone || matchNameBn || matchNameEn;
    });

    if (!found) {
      return res.status(401).json({
        success: false,
        error: 'সদস্য আইডি বা মোবাইল নম্বর পাওয়া যায়নি (Member ID or Phone not found)',
      });
    }

    const userPassword = found.password;
    if (!userPassword || cleanPass !== String(userPassword).trim()) {
      return res.status(401).json({
        success: false,
        error: 'পাসওয়ার্ড সঠিক নয় (Incorrect password)',
      });
    }

    // Return the verified member and the complete current database so new devices load everything at once
    res.json({
      success: true,
      member: found,
      data: db,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Server authentication error', details: err?.message });
  }
});

// POST /api/members/:id/credentials - Admin management of member User ID & Password
app.post('/api/members/:id/credentials', (req, res) => {
  try {
    const memberId = req.params.id;
    const { memberNo, password, updatedBy } = req.body;

    const currentDb = loadDatabase();
    const targetIndex = currentDb.members.findIndex(
      (m: any) => m.id === memberId || m.memberNo === memberId
    );

    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const targetMember = currentDb.members[targetIndex];

    if (memberNo && typeof memberNo === 'string' && memberNo.trim()) {
      const cleanMemberNo = memberNo.trim().toUpperCase();
      // Check uniqueness among other members
      const duplicate = currentDb.members.find(
        (m: any, idx: number) => idx !== targetIndex && (m.memberNo || '').toUpperCase() === cleanMemberNo
      );
      if (duplicate) {
        return res.status(400).json({ error: `User ID '${cleanMemberNo}' is already taken by another member` });
      }
      targetMember.memberNo = cleanMemberNo;
    }

    if (password && typeof password === 'string' && password.trim()) {
      if (password.trim().length < 3) {
        return res.status(400).json({ error: 'Password must be at least 3 characters' });
      }
      targetMember.password = password.trim();
    }

    currentDb.members[targetIndex] = targetMember;

    const saved = saveDatabase(
      currentDb,
      'member_credentials_updated',
      updatedBy || 'admin'
    );

    if (saved) {
      res.json({
        success: true,
        message: 'Member credentials updated successfully in central database',
        member: targetMember,
        version: currentDb.version,
        lastUpdated: currentDb.lastUpdated,
      });
    } else {
      res.status(500).json({ error: 'Failed to save member credentials' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update member credentials', details: err?.message });
  }
});

// GET Real-time Server-Sent Events (SSE) Stream
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const db = loadDatabase();
  // Send initial connection event with current state metadata
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      version: db.version || 1,
      lastUpdated: db.lastUpdated || new Date().toISOString(),
    })}\n\n`
  );

  sseClients.add(res);

  // Periodic heartbeat comment every 20 seconds to prevent connection timeout
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    sseClients.delete(res);
  });
});

// POST Atomic Member Profile Update (Photo, DOB, nominee, address, phone, password)
app.post('/api/members/:id/profile', (req, res) => {
  try {
    const memberId = req.params.id;
    const {
      phone,
      photoUrl,
      dateOfBirth,
      nomineeName,
      nomineeRelation,
      nomineePhone,
      nomineeNid,
      nomineeSharePercent,
      address,
      presentAddress,
      permanentAddress,
      fatherName,
      motherName,
      bloodGroup,
      password,
      updatedBy,
    } = req.body;

    const currentDb = loadDatabase();
    const targetIndex = currentDb.members.findIndex(
      (m: any) => m.id === memberId || m.memberNo === memberId
    );

    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const targetMember = currentDb.members[targetIndex];
    if (phone !== undefined) targetMember.phone = String(phone).trim();
    if (photoUrl !== undefined) targetMember.photoUrl = photoUrl;
    if (dateOfBirth !== undefined) targetMember.dateOfBirth = dateOfBirth;
    if (nomineeName !== undefined) targetMember.nomineeName = nomineeName;
    if (nomineeRelation !== undefined) targetMember.nomineeRelation = nomineeRelation;
    if (nomineePhone !== undefined) targetMember.nomineePhone = nomineePhone;
    if (nomineeNid !== undefined) targetMember.nomineeNid = nomineeNid;
    if (nomineeSharePercent !== undefined) targetMember.nomineeSharePercent = Number(nomineeSharePercent);
    if (address !== undefined) targetMember.address = address;
    if (presentAddress !== undefined) targetMember.presentAddress = presentAddress;
    if (permanentAddress !== undefined) targetMember.permanentAddress = permanentAddress;
    if (fatherName !== undefined) targetMember.fatherName = fatherName;
    if (motherName !== undefined) targetMember.motherName = motherName;
    if (bloodGroup !== undefined) targetMember.bloodGroup = bloodGroup;
    if (password && typeof password === 'string' && password.trim().length >= 3) {
      targetMember.password = password.trim();
    }

    currentDb.members[targetIndex] = targetMember;

    const saved = saveDatabase(
      currentDb,
      'member_profile_updated',
      updatedBy || targetMember.nameEn || memberId
    );

    if (saved) {
      res.json({
        success: true,
        message: 'Member profile updated and broadcasted online',
        member: targetMember,
        version: currentDb.version,
        lastUpdated: currentDb.lastUpdated,
      });
    } else {
      res.status(500).json({ error: 'Failed to save member profile' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update member profile', details: err?.message });
  }
});

// POST Atomic Member Password Update
app.post('/api/members/:id/password', (req, res) => {
  try {
    const memberId = req.params.id;
    const { password, updatedBy } = req.body;

    if (!password || typeof password !== 'string' || password.trim().length < 3) {
      return res.status(400).json({ error: 'Password must be at least 3 characters' });
    }

    const currentDb = loadDatabase();
    const targetIndex = currentDb.members.findIndex(
      (m: any) => m.id === memberId || m.memberNo === memberId
    );

    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    currentDb.members[targetIndex].password = password.trim();

    const saved = saveDatabase(
      currentDb,
      'member_password_updated',
      updatedBy || currentDb.members[targetIndex].nameEn || memberId
    );

    if (saved) {
      res.json({
        success: true,
        message: 'Password updated and broadcasted online',
        version: currentDb.version,
        lastUpdated: currentDb.lastUpdated,
      });
    } else {
      res.status(500).json({ error: 'Failed to save password' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password', details: err?.message });
  }
});

// GET all somiti data
app.get('/api/data', (req, res) => {
  try {
    const db = loadDatabase();
    res.json(db);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read data from server', details: err?.message });
  }
});

// POST all somiti data (Auto-save for admin + member edits)
app.post('/api/data', (req, res) => {
  try {
    const {
      members,
      transactions,
      loans,
      projects,
      projectExpenses,
      tasks,
      cashbook,
      updatedBy,
    } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Invalid members data format: members array cannot be empty' });
    }

    const currentDb = loadDatabase();

    // Safely merge members: never allow stale client passwords to overwrite newer server credentials
    const mergedMembers = currentDb.members.map((curr: any) => {
      const incoming = Array.isArray(members) ? members.find((m: any) => m.id === curr.id) : null;
      if (!incoming) return curr;
      return {
        ...curr,
        ...incoming,
        // Keep server password unless incoming password is explicitly provided and valid
        password: (incoming.password && typeof incoming.password === 'string' && incoming.password.trim())
          ? incoming.password.trim()
          : curr.password,
        memberNo: (incoming.memberNo && typeof incoming.memberNo === 'string' && incoming.memberNo.trim())
          ? incoming.memberNo.trim().toUpperCase()
          : curr.memberNo,
      };
    });

    // Append any newly added members from client
    if (Array.isArray(members)) {
      for (const m of members) {
        if (!mergedMembers.some((curr: any) => curr.id === m.id)) {
          mergedMembers.push(m);
        }
      }
    }

    const updatedDb = {
      ...currentDb,
      members: mergedMembers,
      transactions: Array.isArray(transactions) ? transactions : currentDb.transactions,
      loans: Array.isArray(loans) ? loans : currentDb.loans,
      projects: Array.isArray(projects) ? projects : currentDb.projects,
      projectExpenses: Array.isArray(projectExpenses) ? projectExpenses : currentDb.projectExpenses,
      tasks: Array.isArray(tasks) ? tasks : currentDb.tasks,
      cashbook: Array.isArray(cashbook) ? cashbook : currentDb.cashbook,
      updatedBy: updatedBy || 'auto_sync',
    };

    const saved = saveDatabase(updatedDb, 'full_data_updated', updatedBy || 'admin');
    if (saved) {
      res.json({
        success: true,
        message: 'Data successfully auto-saved to server and broadcasted online',
        version: updatedDb.version,
        lastUpdated: updatedDb.lastUpdated,
      });
    } else {
      res.status(500).json({ error: 'Failed to write data to server disk' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Server error saving data', details: err?.message });
  }
});

// PUT /api/projects/:id - Update investment project details (Name, Contact, Address, etc.)
app.put('/api/projects/:id', (req, res) => {
  try {
    const projectId = req.params.id;
    const projectUpdates = req.body;

    const currentDb = loadDatabase();
    const targetIndex = currentDb.projects.findIndex((p: any) => p.id === projectId);

    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Investment project not found' });
    }

    currentDb.projects[targetIndex] = {
      ...currentDb.projects[targetIndex],
      ...projectUpdates,
      id: projectId,
    };

    const saved = saveDatabase(currentDb, 'project_updated', projectUpdates.updatedBy || 'admin');
    if (saved) {
      res.json({
        success: true,
        message: 'Investment details updated successfully in central database',
        project: currentDb.projects[targetIndex],
        version: currentDb.version,
        lastUpdated: currentDb.lastUpdated,
      });
    } else {
      res.status(500).json({ error: 'Failed to save project updates' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update project', details: err?.message });
  }
});

// Reset database
app.post('/api/data/reset', (req, res) => {
  try {
    const seed = getSeedData();
    saveDatabase(seed);
    res.json({ success: true, message: 'Database reset to initial seed data', data: seed });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database', details: err?.message });
  }
});

// Ensure backups folder exists
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Trigger daily backup snapshot
app.post('/api/backup/trigger', (req, res) => {
  try {
    const db = loadDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `somiti_snapshot_${timestamp}.json`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

    const snapshot = {
      backupTimestamp: new Date().toISOString(),
      version: '1.0',
      totalMembers: db.members?.length || 0,
      totalTransactions: db.transactions?.length || 0,
      data: db,
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Automated daily database backup snapshot generated successfully',
      backupFile: backupFileName,
      timestamp: snapshot.backupTimestamp,
      notification: {
        title: 'Daily Backup Completed Successfully',
        recipients: 'All Administrators (Lead Executive, President, Secretary, Cashier)',
        summary: `Backup snapshot saved with ${snapshot.totalMembers} members and ${snapshot.totalTransactions} transactions.`
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate backup snapshot', details: err?.message });
  }
});

// List recent backups
app.get('/api/backups', (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ backups: [] });
    }
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          sizeBytes: stats.size,
          createdAt: stats.birthtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ backups: files });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list backups', details: err?.message });
  }
});

// Start Server & mount Vite in dev or static in prod
async function startServer() {
  const server = http.createServer(app);

  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!doctype html><html><head><meta http-equiv="refresh" content="3"><title>Building App...</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Somiti Portal is starting...</h2><p>Please wait a moment while the application is prepared.</p></body></html>');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Somiti Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
