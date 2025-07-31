// database.js
// This module handles all interactions with the SQLite database using the pure JavaScript sql.js library.

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// --- Database Path Configuration ---
// **FIX:** When packaged, save the database next to the executable, not inside it.
// process.pkg is a special variable that exists when the app is packaged.
const dbDirectory = process.pkg ? path.dirname(process.execPath) : __dirname;
const dbFilePath = path.join(dbDirectory, 'inventory.db');
console.log(`Database will be stored at: ${dbFilePath}`);


let db;

// --- Helper Functions ---

/**
 * Writes the in-memory database to the file on disk.
 * This must be called after any changes (INSERT, UPDATE, DELETE).
 */
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
}

/**
 * Converts the result of an sql.js query into a more standard array of objects.
 * @param {Array} result - The result from db.exec().
 * @returns {Array<Object>}
 */
function resultToObjectArray(result) {
    if (!result || result.length === 0) {
        return [];
    }
    const columns = result[0].columns;
    const values = result[0].values;
    return values.map(row => {
        const obj = {};
        columns.forEach((col, index) => {
            obj[col] = row[index];
        });
        return obj;
    });
}


// --- Main Database Functions ---

async function initDb() {
    const SQL = await initSqlJs({
        // Required to load the wasm file from the snapshot filesystem in the pkg executable
        locateFile: file => path.join(__dirname, file)
    });

    try {
        const fileBuffer = fs.readFileSync(dbFilePath);
        db = new SQL.Database(fileBuffer);
        console.log('Loaded existing database file.');
    } catch (error) {
        // If the file doesn't exist, create a new database
        db = new SQL.Database();
        console.log('Created new in-memory database.');
    }

    // Create the table if it doesn't exist.
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY,
            model TEXT NOT NULL,
            previousUser TEXT,
            currentUser TEXT NOT NULL,
            transferDate TEXT NOT NULL,
            condition TEXT,
            notes TEXT
        );
    `;
    db.run(createTableQuery);

    // This is a simple migration to add the 'notes' column if the table already exists without it.
    try {
        db.run('ALTER TABLE inventory ADD COLUMN notes TEXT');
        console.log('Added "notes" column to the inventory table.');
    } catch (e) {
        // This will fail if the column already exists, which is expected.
    }
    
    saveDatabase(); // Save the initial schema if it was just created
    console.log('Database initialized successfully.');
}

async function getInventory(options = {}) {
    const { search, condition, startDate, endDate, page = 1, limit = 10 } = options;

    let whereClauses = [];
    let params = {};

    const isNumericIdSearch = /^\d+$/.test(search);

    if (isNumericIdSearch) {
        whereClauses.push('id = :search');
        params[':search'] = parseInt(search, 10);
    } else {
        if (search) {
            whereClauses.push('(model LIKE :search_term OR currentUser LIKE :search_term OR notes LIKE :search_term)');
            params[':search_term'] = `%${search}%`;
        }
        if (condition) {
            whereClauses.push('condition = :condition');
            params[':condition'] = condition;
        }
        if (startDate && endDate) {
            whereClauses.push('transferDate BETWEEN :startDate AND :endDate');
            params[':startDate'] = startDate;
            params[':endDate'] = endDate;
        }
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as count FROM inventory ${whereString}`;
    const totalResult = db.exec(countQuery, params);
    const totalItems = resultToObjectArray(totalResult)[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const offset = (page - 1) * limit;
    const dataQuery = `SELECT * FROM inventory ${whereString} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    const dataResult = db.exec(dataQuery, params);
    const data = resultToObjectArray(dataResult);

    return { data, totalPages };
}

async function getAllInventoryForExport() {
    const result = db.exec('SELECT * FROM inventory ORDER BY id DESC');
    return resultToObjectArray(result);
}

async function addInventoryItem(item) {
    const { model, previousUser, currentUser, transferDate, condition, notes } = item;
    db.run(
        'INSERT INTO inventory (model, previousUser, currentUser, transferDate, condition, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [model, previousUser, currentUser, transferDate, condition, notes]
    );
    saveDatabase();
    const result = db.exec("SELECT last_insert_rowid()");
    return { id: result[0].values[0][0] };
}

async function updateInventoryItem(id, item) {
    const { model, previousUser, currentUser, transferDate, condition, notes } = item;
    db.run(
        'UPDATE inventory SET model = ?, previousUser = ?, currentUser = ?, transferDate = ?, condition = ?, notes = ? WHERE id = ?',
        [model, previousUser, currentUser, transferDate, condition, notes, id]
    );
    saveDatabase();
}

async function deleteInventoryItem(id) {
    db.run('DELETE FROM inventory WHERE id = ?', [id]);
    saveDatabase();
}

module.exports = {
    initDb,
    getInventory,
    getAllInventoryForExport,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
};
