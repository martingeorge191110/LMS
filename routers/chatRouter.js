import express from 'express';
import ChatController from '../controllers/chatController.js';
import verifyToken from '../middlewares/tokenVerification.js';



const ChatRouter = express.Router()

ChatRouter.use(verifyToken)

/* Chat route:
   Usage: --> creating chat room */
ChatRouter.route("/")
                     .post(ChatController.createRoom)


ChatRouter.route("/remove")
                           .patch(ChatController.removeUserFromRoom)

export default ChatRouter;
