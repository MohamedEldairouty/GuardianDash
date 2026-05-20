/**
 * GuardianDash UART → WebSocket bridge.
 *
 * Reads lines from the STM32 over USB-serial and re-broadcasts them
 * to any connected mobile app via socket.io.
 *
 * Firmware must print lines in this format (one per measurement):
 *
 *   G:1.23,X:0.05,Y:-0.01,Z:1.00\r\n
 *
 * Anything we can't parse is ignored.
 */
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { Server } = require('socket.io');
const http = require('http');

// --- Config (override via env) ---
const PORT_PATH = process.env.GD_SERIAL_PORT || 'COM3';   // Windows COM port or /dev/ttyUSB0
const BAUD       = parseInt(process.env.GD_BAUD || '115200', 10);
const WS_PORT    = parseInt(process.env.GD_WS_PORT || '4001', 10);

// --- WebSocket server ---
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, name: 'GuardianDash Bridge', port: PORT_PATH }));
});

const io = new Server(httpServer, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  console.log(`[ws] client connected (${io.engine.clientsCount} total)`);
  socket.emit('hello', { device: 'Vehicle_BlackBox', port: PORT_PATH });
  socket.on('disconnect', () => console.log(`[ws] client disconnected`));
});

httpServer.listen(WS_PORT, () => {
  console.log(`[ws] listening on http://0.0.0.0:${WS_PORT}`);
});

// --- Serial parser ---
function parseLine(line) {
  // Tolerant of extra whitespace and partial frames.
  const out = {};
  for (const part of line.split(',')) {
    const m = part.trim().match(/^([A-Za-z]+)\s*[:=]\s*(-?\d+(\.\d+)?)/);
    if (!m) continue;
    out[m[1].toLowerCase()] = parseFloat(m[2]);
  }
  if (out.g === undefined) return null;
  return {
    timestamp: Date.now(),
    gForce: out.g,
    accel: {
      x: out.x ?? 0,
      y: out.y ?? 0,
      z: out.z ?? 1,
    },
  };
}

function openSerial() {
  console.log(`[serial] opening ${PORT_PATH} @ ${BAUD}…`);
  const port = new SerialPort({ path: PORT_PATH, baudRate: BAUD });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.on('open', () => console.log(`[serial] connected`));
  port.on('error', (err) => {
    console.error(`[serial] error: ${err.message}`);
    console.error(`  hint — run "npm run list" to see available ports.`);
    setTimeout(openSerial, 3000);
  });
  port.on('close', () => {
    console.warn(`[serial] closed — retrying in 3s…`);
    setTimeout(openSerial, 3000);
  });

  parser.on('data', (raw) => {
    const line = raw.toString().trim();
    if (!line) return;
    const frame = parseLine(line);
    if (!frame) return;
    io.emit('telemetry', frame);
  });
}

openSerial();
