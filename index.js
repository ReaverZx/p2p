import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
// We use path "/p2p" (you can change it in client/server)
const PATH = "/p2p";

const wss = new WebSocketServer({
  port: Number(PORT),
  path: PATH,
});

console.log(`P2P Broker server running on port ${PORT} with path ${PATH}`);

const rooms = new Map();

wss.on("connection", (ws, req) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    let msg;
    try {
      msg = JSON.parse(message);
    } catch {
      console.warn("Invalid message:", message);
      return;
    }

    const { key, data } = msg;
    if (!key || !data) {
      console.warn("Missing key or data");
      return;
    }

    if (!rooms.has(key)) {
      rooms.set(key, new Set());
    }
    const clients = rooms.get(key);
    clients.add(ws);

    // Broadcast data to everyone in the same room except sender
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ key, data }));
      }
    });
  });

  ws.on("close", () => {
    rooms.forEach((clients, key) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        if (clients.size === 0) {
          rooms.delete(key);
        }
      }
    });
    console.log("Client disconnected");
  });
});
