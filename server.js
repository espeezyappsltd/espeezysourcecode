// Custom Next.js server
// Intercepts TRACE/TRACK before Next.js processes them (Next.js throws TypeError for these methods)
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require('http')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    // Block TRACE/TRACK before Next.js tries to construct a Request object (which throws for these methods)
    if (req.method === 'TRACE' || req.method === 'TRACK') {
      res.writeHead(405, {
        Allow: 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
        'Content-Type': 'text/plain',
      })
      res.end('Method Not Allowed')
      return
    }

    try {
      // Use WHATWG URL API to avoid url.parse() deprecation
      const baseUrl = `http://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}`
      const parsed = new URL(req.url, baseUrl)
      await handle(req, res, { pathname: parsed.pathname, query: Object.fromEntries(parsed.searchParams), search: parsed.search })
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`\u25b2 Next.js custom server`)
    console.log(`- Local:   http://localhost:${port}`)
    console.log(`\u2713 Ready`)
  })
})
