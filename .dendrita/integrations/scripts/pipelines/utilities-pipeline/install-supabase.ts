#!/usr/bin/env ts-node
/**
 * Script temporal para instalar @supabase/supabase-js manualmente
 * Usa esto si npm no funciona en tu sistema
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const packageName = '@supabase/supabase-js';
const version = '2.39.0';

console.log(`Installing ${packageName}@${version}...`);

// Crear directorio si no existe
const packageDir = path.join(process.cwd(), 'node_modules', '@supabase', 'supabase-js');
const packageDirParent = path.join(process.cwd(), 'node_modules', '@supabase');

if (!fs.existsSync(packageDirParent)) {
  fs.mkdirSync(packageDirParent, { recursive: true });
}

// Descargar package.json desde npm registry
const url = `https://registry.npmjs.org/${packageName}/${version}`;

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk: Buffer) => {
    data += chunk.toString();
  });
  
  res.on('end', () => {
    try {
      const packageInfo = JSON.parse(data) as { dist: { tarball: string } };
      const distUrl = packageInfo.dist.tarball;
      
      console.log(`Downloading from ${distUrl}...`);
      
      // Descargar tarball
      https.get(distUrl, (res) => {
        const tarFile = path.join(process.cwd(), 'temp-supabase.tar.gz');
        const file = fs.createWriteStream(tarFile);
        
        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('Download complete. Please extract manually:');
          console.log(`  tar -xzf ${tarFile} -C ${packageDirParent}`);
          console.log(`  Then move contents to ${packageDir}`);
          console.log(`  Finally: rm ${tarFile}`);
        });
      });
    } catch (error) {
      console.error('Error parsing package info:', error);
      console.log('\nPlease install manually:');
      console.log('1. Go to https://www.npmjs.com/package/@supabase/supabase-js');
      console.log('2. Download the package');
      console.log(`3. Extract to ${packageDir}`);
    }
  });
}).on('error', (error: Error) => {
  console.error('Error downloading package info:', error);
  console.log('\nPlease install manually using npm in another terminal:');
  console.log('  npm install @supabase/supabase-js@^2.39.0');
});

