import express from 'express';
import ChatController from '../controllers/chatController.js';
import verifyToken from '../middlewares/tokenVerification.js';
import MessagesRouter from './messagesRouter.js';


const ChatRouter = express.Router()

/* Chat Messages Router */
ChatRouter.use("/message", MessagesRouter)

ChatRouter.use(verifyToken)

/* Chat route:
   Usage: --> creating chat room */
ChatRouter.route("/")
                     .post(ChatController.createRoom)
                     .get(ChatController.displayChat)

ChatRouter.route("/personel/").get(ChatController.searchPersonelRoom)

ChatRouter.route("/remove/")
                           .patch(ChatController.removeUserFromRoom)
                           .put(ChatController.adminRemoveHisSelf)


/* Chat adding route:
   Usage:--> adding new participate in chat room
         --> adding new admin */
ChatRouter.route("/add/")
                        .patch(ChatController.addUserInRoom)
                        .put(ChatController.addAnotherAdmin)

export default ChatRouter;
