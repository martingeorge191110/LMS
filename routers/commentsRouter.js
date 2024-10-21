import express from 'express';
import { uploadUtil } from '../middlewares/multer.js';
import CommentsController from '../controllers/commentsController.js';


const CommentsRouter = express.Router()


CommentsRouter.route("/")
                        .post(uploadUtil("postsMedia/comments").fields([
                           {name: "raw", maxCount: 1},
                           {name: "video", maxCount:1},
                           {name: "image", maxCount: 10}
                        ]), CommentsController.addComment)
                        .delete(CommentsController.deleteComment)


/* Add like or remove it, router
   for manipulate likes */
CommentsRouter.route("/like/").patch(CommentsController.manipulateLikes)


export default CommentsRouter;
