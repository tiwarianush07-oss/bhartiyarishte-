import net from 'net';

const client = new net.Socket();

client.connect(9222, '127.0.0.1', () => {
    console.log('Connected to 127.0.0.1:9222');
    client.write("GET /json HTTP/1.1\r\nHost: localhost:9222\r\nConnection: close\r\n\r\n");
});

client.on('data', (data) => {
    console.log('Received raw response:');
    console.log(data.toString('utf8'));
});

client.on('close', () => {
    console.log('Connection closed');
});

client.on('error', (err) => {
    console.error('Socket error:', err.message);
});
