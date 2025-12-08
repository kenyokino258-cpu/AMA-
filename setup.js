
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', `
=========================================
   Nizam HR System - Installation Wizard
=========================================
`);

const steps = [
    { name: 'Installing Dependencies (Backend)', cmd: 'npm install' },
    { name: 'Installing Dependencies (Frontend)', cmd: 'npm install --include=dev' }, // Ensure dev deps for build
    { name: 'Building Frontend Interface', cmd: 'npm run build' },
];

try {
    // 1. Check Node Version
    const nodeVersion = process.version;
    console.log(`ℹ️  Node.js Version: ${nodeVersion}`);
    if (parseInt(nodeVersion.slice(1).split('.')[0]) < 16) {
        console.error('❌ Node.js 16+ is required.');
        process.exit(1);
    }

    // 2. Create Data Directories
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

    // 3. Execute Steps
    for (const step of steps) {
        console.log(`\n⏳ ${step.name}...`);
        try {
            execSync(step.cmd, { stdio: 'inherit' });
            console.log(`✅ ${step.name} Completed.`);
        } catch (error) {
            console.error(`❌ Failed: ${step.name}`);
            console.error(error.message);
            process.exit(1);
        }
    }

    console.log('\x1b[32m%s\x1b[0m', `
=========================================
   Installation Completed Successfully!
=========================================
`);
    console.log('To start the server manually:');
    console.log('   npm start');
    console.log('\nTo start as a background service (Production):');
    console.log('   npm install -g pm2');
    console.log('   pm2 start ecosystem.config.cjs');
    console.log('   pm2 save');
    console.log('   pm2 startup');
    console.log('\nOpen your browser at: http://localhost:5000');

} catch (err) {
    console.error('An unexpected error occurred:', err);
}
