import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4002;
const DB_FILE = path.join(__dirname, 'db.json');

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
}

const server = http.createServer((req, res) => {
    const { method, url } = req;

    if (method === 'GET' && (url === '/' || url === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
        return;
    }

    if (url.startsWith('/api/users')) {
        const id = url.split('/')[3];
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

        if (method === 'GET') {
            if (id) {
                const user = data.users.find(u => u.id === id);
                if (user) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(user));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not Found' }));
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data.users));
            }
        } else if (method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const newUser = JSON.parse(body);
                newUser.id = Date.now().toString();
                data.users.push(newUser);
                fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newUser));
            });
        } else if (method === 'DELETE' && id) {
            const index = data.users.findIndex(u => u.id === id);
            if (index !== -1) {
                const deleted = data.users.splice(index, 1);
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
    console.log(`User Management Server running at http://localhost:${PORT}`);
});
