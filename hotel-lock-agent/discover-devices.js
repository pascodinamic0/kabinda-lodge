const HID = require('node-hid');

console.log('Scanning for HID devices...');
const devices = HID.devices();

console.log('\nFound ' + devices.length + ' devices:');
console.log('----------------------------------------');

devices.forEach((device) => {
    console.log(`Product:      ${device.product}`);
    console.log(`Manufacturer: ${device.manufacturer}`);
    console.log(`Vendor ID:    ${device.vendorId} (0x${device.vendorId.toString(16)})`);
    console.log(`Product ID:   ${device.productId} (0x${device.productId.toString(16)})`);
    console.log(`Interface:    ${device.interface}`);
    console.log(`Path:         ${device.path}`);
    console.log('----------------------------------------');
});
