import ErrorHandling from "../middlewares/errorHandling.js";
import prismaObj from "../prisma/prisma.js";
import { io } from "../server.js";
import ChatUtilies from "../utilies/chatUtilies.js";
import { users } from "../webSocket.js";


/**
 * Chat class controller for managing chat rooms
 */
class ChatController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Response Function */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new ChatController(message, data)
      ))
   }

   /**
    * createRoom controller
    * 
    * Description:
    *             [1] --> get chat room details and user id then validate
    *             [2] --> check users existing then validate missing user
    *             [3] --> create chat room with all participants, then response
    */
   static createRoom = async (req, res, next) => {
      const {category, name, bio, participants} = req.body
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      if (!Array.isArray(participants))
         return (next(ErrorHandling.createError(400, "Server must recieve array of userIds")))

      try {
         const findUsers = await prismaObj.user.findMany({
            where: {
               id: {
                  in: participants
               }
            },
            select: { id: true }
         })

         const missingUsers = findUsers.filter((user) => {
            return (!participants.includes(user.id))
         })
         if (missingUsers.length > 0)
            return (next(ErrorHandling.createError(404, `Following users id [${missingUsers.join(", ")}] are not exist in DataBase`)))

         const userSelect = ChatUtilies.selectItems(['id', 'firstName', 'lastName', 'title', 'isInstructor', 'isAdmin', 'isOnline', 'avatar'])
         if (!userSelect)
            return (next(ErrorHandling.createError(400, 'Selectments is not Array')))

         const chat = await prismaObj.chat.create({
            data: {
               chatCategory: category.toUpperCase(),
               name: name,
               bio: bio,
               participants: {
                  connect:  [...participants, id].map(id => ({ id }))
               },
               admins: {
                  connect: {
                     id: id
                  }
               }
            },
            include: {
               participants: {
                  select: userSelect
               },
               admins: {
                  select: userSelect
               }
            }
         })

         const allParts = [...participants, id]
         ChatUtilies.emitMessage(io, allParts, users, "newChat", chat)

         return (this.response(res, 201, "Chat Room has been created!", chat))
      } catch (err) {
         return (next(ErrorHandling.catchError("creating new chat room")))
      }
   }

   /**
    * removeUserFromRoom Controller
    * 
    * Description:
    *             [1] --> get chatid and userid, then validate token
    *             [2] --> check user Authorization
    *             [3] --> remove user from chat room, then response
    */
   static removeUserFromRoom = async (req, res, next) => {
      const {chatId, userId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const userSelect = ChatUtilies.selectItems(['id', 'firstName', 'lastName', 'title', 'isInstructor', 'isAdmin', 'isOnline', 'avatar'])
      if (!userSelect)
         return (next(ErrorHandling.createError(400, 'Selectments is not Array')))

      try {
         const isAdmin = await prismaObj.chat.findUnique({
            where: {
               id: chatId,
               admins: {
                  some: {
                     id: id
                  }
               }
            }
         })

         if (!isAdmin)
            return (next(ErrorHandling.createError(404, "You are not authorized to do remove any one, you are not chat admin")))

         const chat = await prismaObj.chat.update({
            where: {
               id: chatId,
               participants: {
                  some: {
                     id: userId
                  }
               }
            }, data: {
               participants: {
                  disconnect: {
                     id: userId
                  }
               }
            },
            include: {
               participants: {
                  select: userSelect
               },
               admins: {
                  select: userSelect
               }
            }
         })
         
         const participants = chat.participants.map((user) => {
            return (user.id)
         })

         const allParts = [...participants, id, userId]
         ChatUtilies.emitMessage(io, allParts, users, "removeUser", chat)

         return (this.response(res, 200, "user has been removed!", chat))
      } catch (err) {
         return (next(ErrorHandling.catchError("removing user from chat room")))
      }
   }
}

export default ChatController;
