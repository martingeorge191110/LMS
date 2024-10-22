import { Server } from 'socket.io';
import prismaObj from './prisma/prisma.js';


export const users = {}


export const socketInitialize = (server) => {
   const io = new Server(server, {
      cors: {
         origin: process.env.NODE_ENV === "development" ? "*" : null,
         credentials: true
      }
   })

   io.on('connection', async (socket) => {
      const userId = socket.handshake.query.userId; // Assume user ID is passed when connecting
      if (userId) {
         users[userId] = socket.id; // Store socket ID for the user
      }
      try {
         const user = await prismaObj.user.update({
            where: { id: userId },
            data: { isOnline: true },
         });
         if (user) {
            console.log(`${user.firstName} is now online, status ${user.isOnline}`);
         }
      } catch (error) {
         console.error("Error setting user online:", error);
      }
      socket.on('disconnect', async () => {
         try {
            const userOffline = await prismaObj.user.update({
               where: { id: userId },
               data: { isOnline: false },
            });
            if (userOffline) {
               console.log(`${userOffline.firstName} is now offline, status ${userOffline.isOnline}`);
            }
         } catch (error) {
            console.error("Error setting user offline:", error);
         }
         delete users[userId]; // Remove the user when they disconnect
      });
   });

   return (io)
}
