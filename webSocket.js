import { Server } from 'socket.io';


export const users = {}


export const socketInitialize = (server) => {
   const io = new Server(server, {
      cors: {
         origin: process.env.NODE_ENV === "development" ? "*" : null,
         credentials: true
      }
   })

   io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId; // Assume user ID is passed when connecting
      if (userId) {
          users[userId] = socket.id; // Store socket ID for the user
      }

      socket.on('disconnect', () => {
          delete users[userId]; // Remove the user when they disconnect
      });
   });

   return (io)
}
