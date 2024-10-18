import express from 'express'
import verifyToken from '../middlewares/tokenVerification.js';
import PostsController from '../controllers/postsController.js';
import { uploadUtil } from '../middlewares/multer.js';

const PostsRouter = express.Router()

PostsRouter.use(verifyToken)



PostsRouter.route("/")
                     .post(uploadUtil('postsMedia').fields([
                        {name: "raw", maxCount: 3},
                        {name: "video", maxCount:2},
                        {name: "image", maxCount: 10}
                     ]), PostsController.addOne)


export default PostsRouter;
