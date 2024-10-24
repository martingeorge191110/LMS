import express from 'express';
import verifyToken from '../middlewares/tokenVerification.js';
import MessagesController from '../controllers/messagesController.js';
import { uploadUtil } from '../middlewares/multer.js';

const MessagesRouter = express.Router()

MessagesRouter.use(verifyToken)


MessagesRouter.route("/")
                        .post(uploadUtil('messagesMedia').fields([
                           {name: "raw", maxCount: 3},
                           {name: "video", maxCount:2},
                           {name: "image", maxCount: 10}
                        ]), MessagesController.sendMessage)
                        .delete(MessagesController.deleteMessage)

export default MessagesRouter;
