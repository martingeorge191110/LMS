import { Server } from 'socket.io';
import prismaObj from './prisma/prisma.js';


export const users = {}
export const chatRooms = {}


export const socketInitialize = (server) => {
   const io = new Server(server, {
      cors: {
         origin: process.env.NODE_ENV === "development" ? "*" : null,
         credentials: true
      }
   })

   io.on('connection', async (socket) => {
      const userId = socket.handshake.query.userId;
      if (userId) {
         users[userId] = socket.id;
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

      socket.on("joinChat", async (chatId) => {
         console.log(`User joined chat ID: ${chatId}`);
         socket.join(chatId);
         if (!chatRooms[chatId]) {
            chatRooms[chatId] = [];
         }
         chatRooms[chatId].push(userId);
         console.log(chatRooms[chatId], "has new joined user", "user is: ", userId)
         // Optionally, emit a message back to the client
         try {
                  const messages = await prismaObj.messages.findMany({
                     where: {
                           chatId: chatId,
                           seenBy: {
                              none: {
                                 userId: userId
                              }
                           },
                     }
                  });
      
                  let counter = 0;
                  for (const message of messages) {
                     await prismaObj.seenBy.create({
                           data: {
                              messageId: message.id,
                              userId: userId
                           }
                     });
                     counter++;
                  }
                  console.log(counter)
                   // Emit back to the chat room that messages have been seen
                  io.to(chatId).emit("seenMessage", `User ${userId} has seen the last ${counter} messages`)
               } catch (err) {
                  console.error("Error processing seenMessage:", err);
               }
      });

      socket.on('disconnect', async () => {
         try {
            const userOffline = await prismaObj.user.update({
               where: { id: userId },
               data: { isOnline: false },
            });
            if (userOffline) {
               console.log(`${userOffline.firstName} is now offline, status ${userOffline.isOnline}`);
            }

            for (let chatId in chatRooms) {
               chatRooms[chatId] = chatRooms[chatId].filter((id) => id !== userId);

               // If the chat room is empty, you might want to delete it from `chatRooms`
               if (chatRooms[chatId].length === 0) {
                  delete chatRooms[chatId];
               }
            }

         } catch (error) {
            console.error("Error setting user offline:", error);
         }
         delete users[userId]; // Remove the user when they disconnect
      });
   });

   return (io)
}
