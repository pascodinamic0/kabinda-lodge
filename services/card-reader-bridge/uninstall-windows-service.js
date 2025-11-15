/**
 * Windows Service Uninstaller
 * Run with: node uninstall-windows-service.js
 * Requires: npm install -g node-windows
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Card Reader Bridge',
  script: path.join(__dirname, 'index.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('Card Reader Bridge service uninstalled successfully!');
});

// Uninstall the service
console.log('Uninstalling Card Reader Bridge service...');
svc.uninstall();

