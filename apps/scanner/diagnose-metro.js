#!/usr/bin/env node
/**
 * Metro Diagnostic Script
 * Tests file system access, symlinks, and Metro file-map functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(msg, type = 'info') {
  const prefix = {
    pass: '✅',
    fail: '❌',
    warn: '⚠️',
    info: 'ℹ️'
  };
  console.log(`${prefix[type] || '  '} ${msg}`);
}

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      results.passed.push(name);
      log(`${name}`, 'pass');
    } else if (result === false) {
      results.failed.push(name);
      log(`${name}`, 'fail');
    } else {
      results.warnings.push({ name, msg: result });
      log(`${name}: ${result}`, 'warn');
    }
  } catch (err) {
    results.failed.push(name);
    log(`${name}: ${err.message}`, 'fail');
  }
}

console.log('\n🔍 Metro Diagnostic Report\n');
console.log('='.repeat(50));

// Test 1: Check current directory
test('Current directory exists', () => {
  return fs.existsSync(process.cwd());
});

// Test 2: Check node_modules
test('node_modules directory exists', () => {
  return fs.existsSync(path.join(process.cwd(), 'node_modules'));
});

// Test 3: Check pnpm structure
test('pnpm .pnpm directory exists', () => {
  const pnpmPath = path.join(process.cwd(), '../../node_modules/.pnpm');
  return fs.existsSync(pnpmPath);
});

// Test 4: Test symlink resolution
test('Symlinks resolve correctly', () => {
  const testLink = path.join(process.cwd(), 'node_modules/expo');
  if (!fs.existsSync(testLink)) return 'expo not found in node_modules';
  const realPath = fs.realpathSync(testLink);
  return fs.existsSync(realPath);
});

// Test 5: Test file read timing
test('File read performance (<100ms)', () => {
  const testFile = path.join(process.cwd(), 'package.json');
  const start = Date.now();
  fs.readFileSync(testFile, 'utf8');
  const duration = Date.now() - start;
  if (duration > 100) return `Slow: ${duration}ms`;
  return true;
});

// Test 6: Test reading through pnpm symlinks
test('Read through pnpm symlinks', () => {
  const metroPath = path.join(process.cwd(), '../../node_modules/.pnpm');
  if (!fs.existsSync(metroPath)) return 'pnpm path not found';
  
  const start = Date.now();
  const dirs = fs.readdirSync(metroPath).slice(0, 5);
  const duration = Date.now() - start;
  
  if (duration > 1000) return `Very slow: ${duration}ms`;
  if (duration > 100) return `Slow: ${duration}ms`;
  return true;
});

// Test 7: Check for metro-file-map
test('metro-file-map package exists', () => {
  try {
    const metroFileMapPath = require.resolve('metro-file-map', { paths: [process.cwd()] });
    return fs.existsSync(metroFileMapPath);
  } catch {
    return false;
  }
});

// Test 8: Test concurrent file reads (simulate Metro behavior)
test('Concurrent file reads (10 files)', async () => {
  const testDir = path.join(process.cwd(), 'app');
  if (!fs.existsSync(testDir)) return 'app directory not found';
  
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts')).slice(0, 10);
  
  const start = Date.now();
  const promises = files.map(f => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      try {
        fs.readFileSync(path.join(testDir, f), 'utf8');
        clearTimeout(timeout);
        resolve();
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
  
  try {
    await Promise.all(promises);
    const duration = Date.now() - start;
    if (duration > 1000) return `Slow: ${duration}ms`;
    return true;
  } catch (err) {
    return err.message;
  }
});

// Test 9: Check file descriptor limits
test('File descriptor limits', () => {
  try {
    const result = execSync('ulimit -n', { encoding: 'utf8' }).trim();
    const limit = parseInt(result);
    if (limit < 10000) return `Low limit: ${limit} (recommend 10000+)`;
    return true;
  } catch {
    return 'Could not check ulimit';
  }
});

// Test 10: Check watchman
test('Watchman available', () => {
  try {
    execSync('watchman version', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return 'Watchman not installed';
  }
});

// Test 11: Check for path issues (spaces)
test('No spaces in project path', () => {
  const cwd = process.cwd();
  if (cwd.includes(' ')) return `Path has spaces: ${cwd}`;
  return true;
});

// Test 12: Test metro-file-map worker simulation
test('Simulate metro-file-map file read', () => {
  const testFile = path.join(process.cwd(), 'app/_layout.tsx');
  if (!fs.existsSync(testFile)) return 'Test file not found';
  
  // Simulate what metro-file-map does
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    fs.readFileSync(testFile, 'utf8');
  }
  const duration = Date.now() - start;
  
  if (duration > 1000) return `Very slow: ${duration}ms for 100 reads`;
  if (duration > 100) return `Slow: ${duration}ms for 100 reads`;
  return true;
});

// Test 13: Check metro config
test('Metro config exists', () => {
  return fs.existsSync(path.join(process.cwd(), 'metro.config.js'));
});

// Test 14: Test large directory scan
test('Scan node_modules (first 1000 entries)', () => {
  const nmPath = path.join(process.cwd(), '../../node_modules/.pnpm');
  if (!fs.existsSync(nmPath)) return 'pnpm dir not found';
  
  const start = Date.now();
  let count = 0;
  
  function scan(dir, depth = 0) {
    if (depth > 3 || count > 1000) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        count++;
        if (count > 1000) return;
        if (entry.isDirectory()) {
          scan(path.join(dir, entry.name), depth + 1);
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }
  
  scan(nmPath);
  const duration = Date.now() - start;
  
  if (duration > 5000) return `Very slow: ${duration}ms`;
  if (duration > 1000) return `Slow: ${duration}ms`;
  return true;
});

// Test 15: Check for broken symlinks
test('No broken symlinks in app/', () => {
  const appDir = path.join(process.cwd(), 'app');
  if (!fs.existsSync(appDir)) return 'app/ not found';
  
  const entries = fs.readdirSync(appDir);
  for (const entry of entries) {
    const fullPath = path.join(appDir, entry);
    try {
      fs.realpathSync(fullPath);
    } catch {
      return `Broken symlink: ${entry}`;
    }
  }
  return true;
});

// Test 16: Check CI environment variable
test('CI environment variable', () => {
  const ci = process.env.CI;
  if (ci === '1' || ci === 'true') return `CI=${ci} (may cause issues)`;
  return true;
});

// Test 17: Check NODE_OPTIONS
test('NODE_OPTIONS not interfering', () => {
  const opts = process.env.NODE_OPTIONS;
  if (opts && opts.length > 0) return `NODE_OPTIONS="${opts}"`;
  return true;
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:');
console.log(`   ✅ Passed: ${results.passed.length}`);
console.log(`   ❌ Failed: ${results.failed.length}`);
console.log(`   ⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed tests:');
  results.failed.forEach(f => console.log(`   - ${f}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  results.warnings.forEach(w => console.log(`   - ${w.name}: ${w.msg}`));
}

console.log('\n');
