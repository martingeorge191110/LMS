import express from 'express';
import verifyToken from '../middlewares/tokenVerification.js';
import MessagesController from '../controllers/messagesController.js';

const MessagesRouter = express.Router()

MessagesRouter.use(verifyToken)


MessagesRouter.route("/")
                        .post(MessagesController.sendMessage)
                        .delete(MessagesController.deleteMessage)

export default MessagesRouter;
