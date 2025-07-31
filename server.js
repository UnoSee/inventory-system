// server.js
// This is the backend server for the inventory application.

const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path'); // Import the 'path' module
const db = require('./database.js');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(require('cors')());
app.use(express.json());

// --- Serve Frontend ---
// This tells Express to serve the index.html file and any other static assets.
app.use(express.static(path.join(__dirname, '')));

// --- API Routes ---

// GET /api/inventory
app.get('/api/inventory', async (req, res) => {
    try {
        const options = {
            search: req.query.search,
            condition: req.query.condition,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: parseInt(req.query.page, 10) || 1,
            limit: parseInt(req.query.limit, 10) || 10
        };
        const result = await db.getInventory(options);
        res.json(result);
    } catch (error) {
        console.error('Failed to get inventory:', error);
        res.status(500).json({ error: 'Failed to retrieve inventory data.' });
    }
});

// GET /api/inventory/export
// Generates and sends a styled Excel report of the entire inventory.
app.get('/api/inventory/export', async (req, res) => {
    try {
        const inventory = await db.getAllInventoryForExport();
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory Report');

        // --- Define Columns and Headers ---
        worksheet.columns = [
            { header: 'ID', key: 'id' },
            { header: 'Model / Description', key: 'model' },
            { header: 'Current User', key: 'currentUser' },
            { header: 'Previous User', key: 'previousUser' },
            { header: 'Date of Transfer', key: 'transferDate' },
            { header: 'Condition', key: 'condition' },
            { header: 'Notes', key: 'notes' }
        ];

        // --- Style the Header Row ---
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4F46E5' } // Indigo color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // --- Add Data Rows ---
        inventory.forEach(item => {
            worksheet.addRow(item);
        });

        // --- Conditional Formatting for "Condition" Column ---
        const conditionColumn = worksheet.getColumn('condition');
        conditionColumn.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber === 1) return;
            const value = cell.value;
            let color = 'FFFFFFFF';
            if (value === 'New') color = 'FFC6EFCE';
            else if (value === 'Good') color = 'FF90CAF9';
            else if (value === 'Fair') color = 'FFFFF9C4';
            else if (value === 'Damaged') color = 'FFFFCDD2';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        });

        // --- Autofit Columns ---
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                let columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) maxLength = columnLength;
            });
            column.width = maxLength < 10 ? 10 : maxLength + 4;
        });
        
        // --- Override alignment for the ID column data cells ---
        const idColumn = worksheet.getColumn('id');
        idColumn.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
            if (rowNumber > 1) cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        // --- Send the file to the client ---
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timestamp = `${day}-${month}-${year}_${hours}-${minutes}`;
        const filename = `InventoryReport-${timestamp}.xlsx`;

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Failed to export inventory:', error);
        res.status(500).json({ error: 'Failed to export inventory data.' });
    }
});

// POST /api/inventory
app.post('/api/inventory', async (req, res) => {
    try {
        const newItem = req.body;
        if (!newItem.model || !newItem.currentUser || !newItem.transferDate) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        const result = await db.addInventoryItem(newItem);
        res.status(201).json({ id: result.id, ...newItem });
    } catch (error) {
        console.error('Failed to add inventory item:', error);
        res.status(500).json({ error: 'Failed to add item to inventory.' });
    }
});

// PUT /api/inventory/:id
app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const itemData = req.body;
        await db.updateInventoryItem(id, itemData);
        res.status(200).json({ message: 'Item updated successfully.' });
    } catch (error) {
        console.error('Failed to update inventory item:', error);
        res.status(500).json({ error: 'Failed to update item.' });
    }
});

// DELETE /api/inventory/:id
app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.deleteInventoryItem(id);
        res.status(200).json({ message: 'Item deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete inventory item:', error);
        res.status(500).json({ error: 'Failed to delete item from inventory.' });
    }
});

// --- Server Initialization ---
db.initDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
