require('esbuild').build({
    // the entry point file described above
    entryPoints: ['src/app/page.tsx'],
    platform: 'browser',
    format: 'iife',
    bundle: true,
    define: {
        "process.env.NODE_ENV": "'production'",
    },
    target: ['chrome60', 'firefox60', 'safari11', 'edge20'],
    minify: true,
    sourcemap: 'inline',

    // the build folder location described above
    outfile: 'public/bundle.js',
}).catch(() => process.exit(1))
