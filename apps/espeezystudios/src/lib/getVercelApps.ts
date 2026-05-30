import fs from 'fs';
import path from 'path';

// Returns a list of app directories in /apps, skipping non-app folders
export function getVercelApps() {
  const appsDir = path.join(process.cwd(), 'apps');
  const ignore = ['shared', 'base', 'core', 'node_modules', '.next'];
  try {
    return fs.readdirSync(appsDir)
      .filter(name => !ignore.includes(name) && !name.startsWith('.'))
      .map(name => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        url: `https://${name}.vercel.app`,
      }));
  } catch {
    return [];
  }
}
