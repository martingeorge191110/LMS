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
         const admins = await ChatUtilies.checkUserAdmin(prismaObj, chatId)
         if (!admins)
            return (next(ErrorHandling.createError(404, "This chat not found, or something went wrong!")))
         const checkAdmin = admins.admins.some((admin) => {
            return (admin.id === id)
         })
         if (!checkAdmin)
            return (next(ErrorHandling.createError(403, "Just admins Authorized to do this action!")))

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

         chat.userRemoved = chat.participants.filter((user) => {
            return user.id === userId
         })[0]

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

   /**
    * addUserInRoom controller
    * 
    * Description:
    *             [1] --> get chatid and userid, then validate token
    *             [2] --> check user Authorization
    *             [3] --> add user into the chat room, then response
    */
   static addUserInRoom = async (req, res, next) => {
      const {chatId, userId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const userSelect = ChatUtilies.selectItems(['id', 'firstName', 'lastName', 'title', 'isInstructor', 'isAdmin', 'isOnline', 'avatar'])
      if (!userSelect)
         return (next(ErrorHandling.createError(400, 'Selectments is not Array')))

      try {
         const admins = await ChatUtilies.checkUserAdmin(prismaObj, chatId)
         if (!admins)
            return (next(ErrorHandling.createError(404, "This chat not found, or something went wrong!")))
         const checkAdmin = admins.admins.some((admin) => {
            return (admin.id === id)
         })
         if (!checkAdmin)
            return (next(ErrorHandling.createError(403, "Just admins Authorized to do this action!")))

         const chat = await prismaObj.chat.update({
            where: { id: chatId },
            data: {
               participants: {
                  connect: { id: userId }
               }
            }, include: {
               participants: {
                  select: userSelect
               }, admins: {
                  select: userSelect
               }
            }
         })

         chat.newUser = chat.participants.filter((user) => {
            return user.id === userId
         })[0]

         const participants = chat.participants.map((user) => { return (user.id) } )
         const allPart = [...participants, id]
         ChatUtilies.emitMessage(io, allPart, users, "userAdded", chat)

         return (this.response(res, 200, "User has been added!", chat))
      } catch (err) {
         return (next(ErrorHandling.catchError("adding user in chat room")))
      }
   }

   /**
    * displayChat controller
    * 
    * Description:
    *             [1] --> get chatid, userid, then validate
    *             [2] --> prisma query to find the chat room with details, then response
    */
   static displayChat = async (req, res, next) => {
      const {chatId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const userSelect = ChatUtilies.selectItems(['id', 'firstName', 'lastName', 'title', 'isInstructor', 'isAdmin', 'isOnline', 'avatar'])
      if (!userSelect)
         return (next(ErrorHandling.createError(400, 'Selectments is not Array')))

      try {
         const chat = await prismaObj.chat.findUnique({
            where: {
               id: chatId,
               participants: {
                  some: {
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
               },
               messages: true
            }
         })

         if (!chat)
            return (next(ErrorHandling.createError(404, "This chat is not found!")))

         return (this.response(res, 200, "Chat details retrieved!", chat))
      } catch (err) {
         return (next(ErrorHandling.catchError("display chat room")))
      }
   }

   /**
    * addAnotherAdmin controller
    * 
    * Description:
    *             [1] --> get chatid and userid, then validate token
    *             [2] --> check user Authorization for doing this action (add new admin)
    *             [3] --> add the new admin of the chat room, then response
    */
   static addAnotherAdmin = async (req, res, next) => {
      const {chatId, userId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const userSelect = ChatUtilies.selectItems(['id', 'firstName', 'lastName', 'title', 'isInstructor', 'isAdmin', 'isOnline', 'avatar'])
      if (!userSelect)
         return (next(ErrorHandling.createError(400, 'Selectments is not Array')))

      try {
         const admins = await ChatUtilies.checkUserAdmin(prismaObj, chatId)
         if (!admins)
            return (next(ErrorHandling.createError(404, "This chat not found, or something went wrong!")))
         const checkAdmin = admins.admins.some((admin) => {
            return (admin.id === id)
         })
         if (!checkAdmin)
            return (next(ErrorHandling.createError(403, "Just admins Authorized to do this action!")))

         const chat = await prismaObj.chat.update({
            where: { id: chatId },
            data: {
               admins: { connect: { id: userId } }
            },
            include: {
               participants: { select: userSelect },
               admins: { select: userSelect }
            }
         })

         chat.newAdmin = chat.admins.filter((admin) => {
            return (admin.id === userId)
         })[0]

         const participants = chat.participants.map((user) => { return (user.id) })
         const allParts = [...participants, id]
         ChatUtilies.emitMessage(io, allParts, users, "newChatAdmin", chat)

         return (this.response(res, 200, "New Admin!", chat))
      } catch (err) {
         return (next(ErrorHandling.catchError("adding another admin")))
      }
   }

   /**
    * 
    */
   static adminRemoveHisSelf = async (req, res, next) => {
      const {chatId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const userSelect = ChatUtilies.selectItems(['id', 'firstName', 'lastName', 'title', 'isInstructor', 'isAdmin', 'isOnline', 'avatar'])
      if (!userSelect)
         return (next(ErrorHandling.createError(400, 'Selectments is not Array')))

      try {
         const admins = await ChatUtilies.checkUserAdmin(prismaObj, chatId)
         if (!admins)
            return (next(ErrorHandling.createError(404, "This chat not found, or something went wrong!")))
         const checkAdmin = admins.admins.some((admin) => {
            return (admin.id === id)
         })
         if (!checkAdmin)
            return (next(ErrorHandling.createError(403, "Just admins Authorized to do this action!")))
         if (admins.admins.length < 2)
            return (next(ErrorHandling.createError(403, "Un Authorized to do this, You are the only admin in this chat room")))

         const chat = await prismaObj.chat.update({
            where: { id: chatId },
            data: {
               admins: { disconnect: {
                  id: id
               } }
            },
            include: {
               participants: { select: userSelect },
               admins: { select: userSelect }
            }
         })

         chat.prevAdmin = chat.participants.filter((user) => { return (user.id === id) })[0]

         const participants = chat.participants.map((user) => { return (user.id) })
         const allParts = [...participants]
         ChatUtilies.emitMessage(io, allParts, users, "adminRemoveHisSef", chat)

         return (this.response(res, 200, "Admin removed him self!", chat))
      } catch (err) {
         console.log(err)
         return (next(ErrorHandling.catchError("admin removing his slef")))
      }
   }
}

export default ChatController;
