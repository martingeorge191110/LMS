import ErrorHandling from "../middlewares/errorHandling.js";
import prismaObj from "../prisma/prisma.js";
import { io } from "../server.js";
import ChatUtilies from "../utilies/chatUtilies.js";
import PostsUtilies from "../utilies/postUtilies.js";
import { users, chatRooms } from "../webSocket.js";


/**
 * Messages Class Controller for managing chat messages actions
 */
class MessagesController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Response Function */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new MessagesController(message, data)
      ))
   }

   /**
    * sendMessage controller
    * 
    * Description:
    *             [1] --> get chatId (if not null), reciever id in case of chatid is null,
    *                      and message body, this validate
    *             [2] --> in case of there is not chat id, then will create a personel chat category
    *             [3] --> in case of media urls created, get urls and its type in an array
    *             [4] --> send message to the chat room, and also emit socket event, tjhen response
    */
   static sendMessage = async (req, res, next) => {
      const {chatId, recieverId} = req.query
      const {message} = req.body
      const files = req.files
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const userSelect = ChatUtilies.selectItems(['id', 'firstName', 'lastName', 'title', 'isInstructor', 'isAdmin', 'isOnline', 'avatar'])
      if (!userSelect)
         return (next(ErrorHandling.createError(400, 'Selectments is not Array')))

      const filesArray = PostsUtilies.checkTypes(files)
      try {
         let getChatId = chatId
         /* in this case the chat will be personel, any group will send his chatId */
         if (!getChatId) {
            getChatId = await ChatUtilies.createChatRoom(prismaObj, [id, recieverId])
            if (!getChatId)
               return (next(ErrorHandling.createError(500, "something went wrong during creating new chat room!")))
         }

         const prismaQuery = {
            senderId: id,
            chatId: getChatId,
            message: message
         }

         if (filesArray && filesArray.length > 0) {
            const urlsArr = await PostsUtilies.postMediaCloud(filesArray)
            if (!urlsArr || urlsArr.length === 0)
               return (next(ErrorHandling.createError(404, "no urls could be found!")))

            prismaQuery.MessageMedia = {
               createMany: {
                  data: urlsArr.map((ele) => ({mediaUrl: ele.url, type: ele.type === "raw" ? "FILE" : ele.type === "video" ? "VIDEO" : "IMG"}))
               }
            }
         }
         const newMessage = await prismaObj.messages.create({
            data: prismaQuery,
            include: {
               MessageMedia: true,
               seenBy: true,
               chat: {
                  include: {
                     participants: { select: userSelect }
                  }
               }
            }
         })

         const allParts = newMessage.chat.participants.filter((user) => {
            return (user.id !== id)
         }).map((ele) => { return ( ele.id ) })
         ChatUtilies.emitMessage(io, allParts, users, "newMessage", newMessage)

         if (chatRooms[newMessage.chatId]){ 
            const seenPromises = [];

            for (let userInRoom of chatRooms[newMessage.chatId]) {
               seenPromises.push(
                  prismaObj.seenBy.create({
                     data: {
                        messageId: newMessage.id,
                        userId: userInRoom 
                     }
                  })
               );
            }

            try {
               await Promise.all(seenPromises);
               // Emit seenMessage event only once after all have been processed
               ChatUtilies.emitMessage(io, chatRooms[newMessage.chatId], users, "seenMessage", newMessage);
            } catch (error) {
               console.error("Error marking messages as seen:", error);
            }
         }

         return (this.response(res, 201, "Message sent successfully!", newMessage))
      } catch (err) {
         return (next(ErrorHandling.catchError("sending message")))
      }
   }

   /**
    * deleteMessage Controller
    * 
    * Description:
    *             [1] --> get messageId and userid, then validate
    *             [2] --> delete the message, then emit an socket event for users in chat room, then response
    */
   static deleteMessage = async (req, res, next) => {
      const {messageId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      if (!messageId || messageId === '')
         return (next(ErrorHandling.createError(400, "messageId must be included in request query object!")))

      try {
         const message = await prismaObj.messsages.delete({
            where: { id: messageId, senderId: id}
         })

         if (!message)
            return (next(ErrorHandling.createError(404, "Message not found!")))
         if (chatRooms[message.chatId]) {
            ChatUtilies.emitMessage(io, chatRooms[message.chatId], users, "deleteMessage", message)
         }

         return (this.response(res, 200, "message has been deleted", message))
      } catch (err) {
         console.log(err)
         return (next(ErrorHandling.catchError("deleting a message")))
      }
   }

   /**
    * 
    */
   static editMessage = async (req, res, next) => {
      const {messageId} = req.query
      const body = req.body
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      if (!messageId || messageId === '')
         return (next(ErrorHandling.createError(400, "messageId must be included in request query object!")))

      try {

      } catch (err) {
         return (next(ErrorHandling.catchError("edit a message")))
      }
   }
}

export default MessagesController;
