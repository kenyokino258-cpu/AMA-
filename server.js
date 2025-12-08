
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// تهيئة التطبيق
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// --- Database Setup (SQLite Enterprise Mode) ---
// التأكد من وجود مجلد البيانات
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'nizam.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to the SQLite database (nizam.db).');
        // تفعيل وضع WAL (Write-Ahead Logging) لأداء عالي وتعدد المستخدمين
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA synchronous = NORMAL;'); // توازن بين الأمان والسرعة
        initTables();
    }
});

// Helper to wrap SQLite in Promises
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// إنشاء الجداول (Create Tables)
async function initTables() {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            employeeCode TEXT UNIQUE,
            name TEXT,
            nationalId TEXT,
            jobTitle TEXT,
            department TEXT,
            joinDate TEXT,
            salary REAL,
            status TEXT,
            contractType TEXT,
            shiftId TEXT,
            data TEXT
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            employeeId TEXT,
            date TEXT,
            checkIn TEXT,
            checkOut TEXT,
            status TEXT,
            source TEXT
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            fullName TEXT,
            role TEXT,
            password TEXT,
            active INTEGER,
            permissions TEXT,
            linkedEmployeeId TEXT
        )`);

        console.log('✅ Database tables initialized.');
        
        const admin = await dbGet("SELECT * FROM users WHERE username = ?", ['admin']);
        if (!admin) {
            await dbRun(`INSERT INTO users (id, username, fullName, role, password, active, permissions) 
                         VALUES ('U1', 'admin', 'مدير النظام', 'مدير النظام', '123456', 1, '["ALL"]')`);
            console.log('👤 Default admin user created (admin / 123456).');
        }

    } catch (err) {
        console.error('❌ Error initializing tables:', err);
    }
}

// --- API Endpoints ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Nizam HR Server Online', mode: 'WAL' });
});

app.get('/api/employees', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM employees");
        const employees = rows.map(row => ({
            ...row,
            ...JSON.parse(row.data || '{}')
        }));
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
    const emp = req.body;
    const extraData = JSON.stringify({
        avatar: emp.avatar,
        isDriver: emp.isDriver,
        driverLicenseNumber: emp.driverLicenseNumber,
        endOfServiceDate: emp.endOfServiceDate,
        shiftName: emp.shiftName
    });

    try {
        await dbRun(`INSERT OR REPLACE INTO employees 
            (id, employeeCode, name, nationalId, jobTitle, department, joinDate, salary, status, contractType, shiftId, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [emp.id, emp.employeeCode, emp.name, emp.nationalId, emp.jobTitle, emp.department, emp.joinDate, emp.salary, emp.status, emp.contractType, emp.shiftId, extraData]
        );
        res.json({ success: true, id: emp.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await dbRun("DELETE FROM employees WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance', async (req, res) => {
    const { date } = req.query;
    try {
        let sql = "SELECT a.*, e.name as employeeName, e.employeeCode FROM attendance a LEFT JOIN employees e ON a.employeeId = e.id";
        let params = [];
        if (date) {
            sql += " WHERE a.date = ?";
            params.push(date);
        }
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance/batch', async (req, res) => {
    const records = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: "Expected array" });

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare(`INSERT OR REPLACE INTO attendance (id, employeeId, date, checkIn, checkOut, status, source) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        records.forEach(r => {
            stmt.run(r.id, r.employeeId, r.date, r.checkIn, r.checkOut, r.status, r.source);
        });
        stmt.finalize();
        db.run("COMMIT");
        res.json({ success: true, count: records.length });
    });
});

app.post('/api/attendance/sync', async (req, res) => {
    const { ip, port, date } = req.body;
    // Simulation Logic for ZK Teco
    // In a real production app, you would use 'node-zklib' here to connect to the physical device
    const newRecords = [
        { id: `ZK-${Date.now()}`, employeeId: 'E001', date: date || new Date().toISOString().split('T')[0], checkIn: '08:05', checkOut: '16:00', status: 'present', source: 'Fingerprint' }
    ];
    try {
        for (const r of newRecords) {
            await dbRun(`INSERT OR REPLACE INTO attendance (id, employeeId, date, checkIn, checkOut, status, source) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [r.id, r.employeeId, r.date, r.checkIn, r.checkOut, r.status, r.source]);
        }
        res.json({ success: true, data: newRecords });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Serve Static Frontend (Production Ready) ---
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    // Serve static files with cache control
    app.use(express.static(distPath, {
        maxAge: '1y',
        etag: false
    }));

    // Handle React Routing (SPA), return index.html for all unknown routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.log('⚠️  Frontend build not found in /dist. Running in API-only mode.');
}

// Helper to get IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// تشغيل السيرفر
app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log(`
    ================================================
    🚀 Nizam HR Enterprise Server Running
    ================================================
    🌍 Local Access: http://localhost:${PORT}
    🌍 Network Access: http://${ip}:${PORT}
    💾 Database: SQLite (WAL Mode) @ /data/nizam.db
    ================================================
    `);
});
