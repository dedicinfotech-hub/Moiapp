const net = require('net');

const ports = [80, 8080, 8000, 8888, 3000, 3306];
const host = '127.0.0.1';

console.log('Scanning ports on localhost...');
ports.forEach(port => {
    const s = new net.Socket();
    s.setTimeout(1000);
    s.on('connect', () => {
        console.log(`Port ${port} is OPEN`);
        s.destroy();
    });
    s.on('error', (e) => {
        s.destroy();
    });
    s.on('timeout', () => {
        s.destroy();
    });
    s.connect(port, host);
});
