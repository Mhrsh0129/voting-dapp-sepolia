const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Dynamic import for ESM module
let open;
(async () => {
  open = (await import('open')).default;
})();

console.log("=".repeat(60));
console.log("🎯 VOTING DAPP - AUTOMATIC STARTUP");
console.log("=".repeat(60));
console.log("");

// Constants
const DEFAULT_DURATION = 2; // minutes
const MAX_DURATION = 525600; // 1 year in minutes (365 days)

// Function to prompt user for election duration
function promptElectionDuration() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Handle readline errors
    rl.on('error', (err) => {
      console.error('⚠️  Error reading input:', err.message);
      console.log(`✅ Using default duration: ${DEFAULT_DURATION} minutes\n`);
      resolve(DEFAULT_DURATION);
    });
    
    rl.question(`⏱️  Enter election duration in minutes (1-${MAX_DURATION}, default ${DEFAULT_DURATION}): `, (answer) => {
      rl.close();
      
      const duration = answer.trim();
      
      // Empty input - use default
      if (duration === '') {
        console.log(`✅ Using default duration: ${DEFAULT_DURATION} minutes\n`);
        resolve(DEFAULT_DURATION);
        return;
      }
      
      // Validate input format - must be digits only
      if (!/^\d+$/.test(duration)) {
        console.log(`⚠️  Invalid input format (must contain only digits). Using default: ${DEFAULT_DURATION} minutes\n`);
        resolve(DEFAULT_DURATION);
        return;
      }
      
      // Parse to number after regex validation
      const parsed = parseInt(duration, 10);
      
      // Validate range
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DURATION) {
        console.log(`⚠️  Invalid duration (must be between 1 and ${MAX_DURATION} minutes). Using default: ${DEFAULT_DURATION} minutes\n`);
        resolve(DEFAULT_DURATION);
        return;
      }
      
      console.log(`✅ Election duration set to: ${parsed} minutes\n`);
      resolve(parsed);
    });
  });
}

// Function to run a command and wait for it to complete
function runCommand(command, args, cwd = __dirname, env = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Running: ${command} ${args.join(' ')}`);
    console.log("-".repeat(60));
    
    const child = spawn(command, args, {
      cwd: cwd,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Function to open URL in default browser (safe, no command injection)
async function openBrowser(url) {
  try {
    if (!open) {
      // If open is not loaded yet, load it dynamically
      open = (await import('open')).default;
    }
    await open(url);
  } catch (err) {
    console.log(`⚠️  Could not auto-open browser. Please visit: ${url}`);
    console.error('Error details:', err.message);
  }
}

// Function to start the server (doesn't wait)
function startServer() {
  return new Promise((resolve, reject) => {
    console.log("\n▶️  Starting Express Server...");
    console.log("-".repeat(60));
    
    const server = spawn('node', ['index.js'], {
      cwd: __dirname,
      shell: true,
      stdio: 'inherit'
    });
    
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      reject(err);
    });
    
    // Give server a moment to start, then open browser
    setTimeout(async () => {
      console.log("\n✅ Server started successfully!");
      console.log("\n🌐 Local: http://localhost:3000");
      console.log("🌐 Live:  https://vot-eth.vercel.app");
      console.log("\n📝 Press Ctrl+C to stop the server");
      console.log("=".repeat(60));
      
      resolve(server);
    }, 2000);
  });
}

// Function to start the Face Verification Service
function startFaceService() {
  return new Promise((resolve, reject) => {
    console.log("\n▶️  Starting Face Verification Service (Python)...");
    console.log("-".repeat(60));
    
    const faceServiceDir = path.join(__dirname, 'face-service');
    // Use the virtual environment python
    const venvPython = path.join(faceServiceDir, 'venv', 'Scripts', 'python.exe');
    
    // Check if venv exists
    if (!fs.existsSync(venvPython)) {
        console.warn("⚠️  Python virtual environment not found at " + venvPython);
        console.warn("Attempting to run using system 'python'...");
    }
    
    const cmd = fs.existsSync(venvPython) ? venvPython : 'python';
    
    const server = spawn(cmd, ['main.py'], {
      cwd: faceServiceDir,
      shell: true,
      stdio: 'inherit'
    });
    
    server.on('error', (err) => {
      console.error('❌ Face Service error:', err);
      // Don't reject, just warn, so main app still starts
      resolve(null);
    });
    
    // Give it a moment to start
    setTimeout(() => {
        console.log("✅ Face Verification Service started! (http://localhost:8000)");
        resolve(server);
    }, 3000);
  });
}

// Main startup sequence
async function start() {
  try {
    // Step 1: Check if node_modules exists
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      console.log("📦 Installing dependencies...");
      await runCommand('npm', ['install']);
    }
    
    // Step 2: Compile contracts
    console.log("\n🔨 Compiling smart contracts...");
    await runCommand('npx', ['hardhat', 'compile']);
    
    // Step 3: Prompt for election duration
    const duration = await promptElectionDuration();
    
    // Step 4: Deploy contract and update addresses with custom duration
    console.log("\n🚀 Deploying contract and updating addresses...");
    await runCommand('npx', ['hardhat', 'run', 'scripts/deploy-and-update.js', '--network', 'sepolia'], __dirname, { ELECTION_DURATION: duration.toString() });
    
    // Step 5: Start the Face Service (Background)
    await startFaceService();

    // Step 6: Start the Main Server
    await startServer();
    
  } catch (error) {
    console.error('\n❌ Startup failed:', error.message);
    process.exit(1);
  }
}

// Start the application
start();
