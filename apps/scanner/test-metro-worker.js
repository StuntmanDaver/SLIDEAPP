#!/usr/bin/env node
/**
 * Test that replicates exactly what metro-file-map does
 * to diagnose the ETIMEDOUT error
 */

const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');

console.log('🔬 Metro File-Map Worker Test\n');
console.log('Environment:');
console.log(`  CI: ${process.env.CI}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  CWD: ${process.cwd()}\n`);

// Test 1: Direct readFileSync (this is what's failing in metro)
console.log('Test 1: Direct readFileSync on multiple files...');
const testFiles = [
  'package.json',
  'app/_layout.tsx',
  'app/index.tsx',
  'metro.config.js',
  'babel.config.js'
];

for (const file of testFiles) {
  const fullPath = path.join(process.cwd(), file);
  const start = Date.now();
  try {
    const stat = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const duration = Date.now() - start;
    console.log(`  ✅ ${file}: ${duration}ms (${content.length} bytes)`);
  } catch (err) {
    console.log(`  ❌ ${file}: ${err.code} - ${err.message}`);
  }
}

// Test 2: Read through pnpm symlinks
console.log('\nTest 2: Read through pnpm symlinks...');
const pnpmModules = [
  'metro-file-map/src/worker.js',
  'metro/src/index.js',
  'expo/build/Expo.js',
  'react-native/index.js'
];

for (const mod of pnpmModules) {
  const start = Date.now();
  try {
    const resolved = require.resolve(mod, { paths: [process.cwd()] });
    const content = fs.readFileSync(resolved, 'utf8');
    const duration = Date.now() - start;
    console.log(`  ✅ ${mod}: ${duration}ms`);
  } catch (err) {
    console.log(`  ❌ ${mod}: ${err.code || err.message}`);
  }
}

// Test 3: Spawn worker threads (like jest-worker does)
console.log('\nTest 3: Worker thread file reads...');

const workerCode = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');

try {
  const content = fs.readFileSync(workerData.file, 'utf8');
  parentPort.postMessage({ success: true, length: content.length });
} catch (err) {
  parentPort.postMessage({ success: false, error: err.message, code: err.code });
}
`;

async function testWorker(file) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'TIMEOUT after 5s' });
    }, 5000);

    try {
      const worker = new Worker(workerCode, {
        eval: true,
        workerData: { file }
      });
      
      worker.on('message', (msg) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(msg);
      });
      
      worker.on('error', (err) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve({ success: false, error: err.message });
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve({ success: false, error: err.message });
    }
  });
}

async function runWorkerTests() {
  const files = [
    path.join(process.cwd(), 'package.json'),
    path.join(process.cwd(), 'app/_layout.tsx'),
    require.resolve('metro-file-map/src/worker.js', { paths: [process.cwd()] })
  ];

  for (const file of files) {
    const start = Date.now();
    const result = await testWorker(file);
    const duration = Date.now() - start;
    const shortPath = file.replace(process.cwd(), '.');
    if (result.success) {
      console.log(`  ✅ Worker read ${shortPath}: ${duration}ms`);
    } else {
      console.log(`  ❌ Worker failed ${shortPath}: ${result.error} (${duration}ms)`);
    }
  }
}

// Test 4: Bulk file scanning (like metro-file-map does)
console.log('\nTest 4: Bulk directory scan...');
async function bulkScan() {
  const rootDir = path.join(process.cwd(), '../../node_modules/.pnpm');
  const start = Date.now();
  let fileCount = 0;
  let errorCount = 0;
  let timeoutCount = 0;

  function scanDir(dir, depth = 0) {
    if (depth > 4 || fileCount > 500) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (fileCount > 500) break;
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDir(fullPath, depth + 1);
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
          fileCount++;
          try {
            // Simulate what metro does - read file content
            const readStart = Date.now();
            fs.readFileSync(fullPath, 'utf8');
            const readDuration = Date.now() - readStart;
            if (readDuration > 1000) {
              timeoutCount++;
              console.log(`  ⚠️ Slow read (${readDuration}ms): ${fullPath.substring(rootDir.length)}`);
            }
          } catch (e) {
            errorCount++;
            if (e.code === 'ETIMEDOUT') {
              console.log(`  ❌ ETIMEDOUT: ${fullPath.substring(rootDir.length)}`);
            }
          }
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }

  scanDir(rootDir);
  const duration = Date.now() - start;
  
  console.log(`  Scanned ${fileCount} files in ${duration}ms`);
  console.log(`  Errors: ${errorCount}, Timeouts: ${timeoutCount}`);
  
  if (errorCount === 0 && timeoutCount === 0) {
    console.log('  ✅ Bulk scan passed');
  } else {
    console.log('  ❌ Bulk scan had issues');
  }
}

// Test 5: Check for specific metro-file-map issue
console.log('\nTest 5: Metro file-map getContent simulation...');
function testGetContent() {
  // This is the exact function that fails in metro-file-map
  const getContent = (filePath) => {
    return fs.readFileSync(filePath, 'utf8');
  };

  const testFile = path.join(process.cwd(), 'package.json');
  
  // Run it many times to check for intermittent failures
  let failures = 0;
  const iterations = 1000;
  const start = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    try {
      getContent(testFile);
    } catch (e) {
      failures++;
      console.log(`  ❌ Failure ${i}: ${e.code} - ${e.message}`);
    }
  }
  
  const duration = Date.now() - start;
  console.log(`  Ran ${iterations} iterations in ${duration}ms`);
  console.log(`  Failures: ${failures}`);
  
  if (failures === 0) {
    console.log('  ✅ getContent simulation passed');
  }
}

// Run all async tests
async function main() {
  await runWorkerTests();
  await bulkScan();
  testGetContent();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Recommendations:');
  
  if (process.env.CI === '1' || process.env.CI === 'true') {
    console.log('  1. Unset CI environment variable:');
    console.log('     export CI=false');
    console.log('     Or run: CI=false npx expo start');
  }
  
  console.log('\n');
}

main().catch(console.error);
