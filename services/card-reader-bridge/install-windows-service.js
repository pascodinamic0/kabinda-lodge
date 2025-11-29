/**
 * Windows Service Installer
 * Run with: node install-windows-service.js
 * Requires: npm install -g node-windows
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Card Reader Bridge',
  description: 'USB bridge service for NFC/MIFARE card reader communication',
  script: path.join(__dirname, 'index.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: "PORT",
      value: "3001"
    },
    {
      name: "NODE_ENV",
      value: "production"
    }
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('Card Reader Bridge service installed successfully!');
  svc.start();
});

svc.on('start', function() {
  console.log('Card Reader Bridge service started!');
  console.log('Service is now running on http://localhost:3001');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

// Install the service
console.log('Installing Card Reader Bridge service...');
svc.install();













