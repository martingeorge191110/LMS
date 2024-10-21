import express from 'express'
import verifyToken from '../middlewares/tokenVerification.js';
import PostsController from '../controllers/postsController.js';
import { uploadUtil } from '../middlewares/multer.js';

const PostsRouter = express.Router()

PostsRouter.use(verifyToken)


/* Posts routes
   Usage:--> adding new post
         --> delete existing post
         --> edit post
         --> get specific user posts */
PostsRouter.route("/")
                     .post(uploadUtil('postsMedia').fields([
                        {name: "raw", maxCount: 3},
                        {name: "video", maxCount:2},
                        {name: "image", maxCount: 10}
                     ]), PostsController.addOne)
                     .delete(PostsController.deletePost)
                     .put(uploadUtil('postsMedia').fields([
                        {name: "raw", maxCount: 3},
                        {name: "video", maxCount:2},
                        {name: "image", maxCount: 10}
                     ]), PostsController.editPost)
                     .get(PostsController.getUserPosts)

/* Actios Like route
   usage: add or remove likes on post*/
PostsRouter.route("/like/")
                           .patch(PostsController.manipulateLikes)


export default PostsRouter;
