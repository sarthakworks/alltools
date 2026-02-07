import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const manifestPath = path.join(distDir, 'cache-manifest.json');

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, baseDir = dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getAllFiles(fullPath, baseDir));
        } else if (stat.isFile()) {
            files.push({
                path: fullPath,
                size: stat.size
            });
        }
    }

    return files;
}

/**
 * Generate cache manifest for offline mode
 */
function generateManifest() {
    if (!fs.existsSync(distDir)) {
        console.error('❌ dist directory not found. Run `npm run build` first.');
        process.exit(1);
    }

    console.log('📦 Generating cache manifest...');

    const allFiles = getAllFiles(distDir);

    // Convert to URLs relative to site root
    const urls = allFiles
        .filter(f => !f.path.includes('cache-manifest.json')) // Exclude self
        .filter(f => !f.path.includes('.DS_Store')) // Exclude system files
        // Convert to URLs with leading slash, exclude compressed variants
        // The server will handle compression based on Accept-Encoding headers
        .filter(f => {
            const url = '/' + path.relative(distDir, f.path).replace(/\\/g, '/');
            // Exclude compressed file variants (.br, .gz, .zst)
            // These are served automatically by the server based on Accept-Encoding
            return !url.endsWith('.br') && !url.endsWith('.gz') && !url.endsWith('.zst');
        })
        .map(f => ({
            url: '/' + path.relative(distDir, f.path).replace(/\\/g, '/'),
            size: f.size
        }));

    // Calculate total size
    const totalSize = urls.reduce((sum, file) => sum + file.size, 0);

    // Create manifest
    const manifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        totalFiles: urls.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        urls: urls.map(f => f.url) // Only include URLs for the manifest
    };

    // Write manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('✅ Cache manifest generated:');
    console.log(`   - Files: ${manifest.totalFiles}`);
    console.log(`   - Total size: ${manifest.totalSizeMB} MB`);
    console.log(`   - Location: ${manifestPath}`);
}

// Run
try {
    generateManifest();
} catch (error) {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
}
