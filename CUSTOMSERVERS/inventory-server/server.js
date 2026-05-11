import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4001;
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ items: [] }, null, 2));
}

const server = http.createServer((req, res) => {
    const { method, url } = req;

    // Static HTML
    if (method === 'GET' && (url === '/' || url === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
        return;
    }

    // CRUD APIs
    if (url.startsWith('/api/items')) {
        const id = url.split('/')[3];
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

        if (method === 'GET') {
            if (id) {
                const item = data.items.find(i => i.id === id);
                if (item) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(item));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not Found' }));
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data.items));
            }
        } else if (method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const newItem = JSON.parse(body);
                newItem.id = Date.now().toString();
                data.items.push(newItem);
                fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newItem));
            });
        } else if (method === 'PUT' && id) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const index = data.items.findIndex(i => i.id === id);
                if (index !== -1) {
                    data.items[index] = { ...data.items[index], ...JSON.parse(body), id };
                    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data.items[index]));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not Found' }));
                }
            });
        } else if (method === 'DELETE' && id) {
            const index = data.items.findIndex(i => i.id === id);
            if (index !== -1) {
                const deleted = data.items.splice(index, 1);
                fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(deleted[0]));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        }
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`Inventory Server running at http://localhost:${PORT}`);
});
