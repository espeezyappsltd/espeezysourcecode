import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4003;
const DB_FILE = path.join(__dirname, 'db.json');

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ events: [] }, null, 2));
}

const server = http.createServer((req, res) => {
    const { method, url } = req;

    if (method === 'GET' && (url === '/' || url === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
        return;
    }

    if (url.startsWith('/api/events')) {
        const id = url.split('/')[3];
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

        if (method === 'GET') {
            if (id) {
                const event = data.events.find(e => e.id === id);
                if (event) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(event));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not Found' }));
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data.events));
            }
        } else if (method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const newEvent = JSON.parse(body);
                newEvent.id = Date.now().toString();
                newEvent.timestamp = new Date().toISOString();
                data.events.push(newEvent);
                fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newEvent));
            });
        } else if (method === 'DELETE' && id) {
            const index = data.events.findIndex(e => e.id === id);
            if (index !== -1) {
                const deleted = data.events.splice(index, 1);
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
    console.log(`Analytics Server running at http://localhost:${PORT}`);
});
