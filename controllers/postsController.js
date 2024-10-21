import ErrorHandling from "../middlewares/errorHandling.js";
import { cloudinary } from "../middlewares/multer.js";
import prismaObj from "../prisma/prisma.js";
import PostsUtilies from "../utilies/postUtilies.js";


/**
 * Posts controller class for managing posts
 */
class PostsController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Response Function */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new PostsController(message, data)
      ))
   }

   /**
    * addOne controller
    * 
    * Description:
    *             [1] --> get user id and body and files, then validate
    */
   static addOne = async (req, res, next) => {
      const body = req.body
      const files = req.files
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const filesArray = PostsUtilies.checkTypes(files)
      try {
         let post;
         if (!filesArray || filesArray.length === 0) {
            post = await prismaObj.post.create({
               data: {
                  userId: id,
                  content: body.content
               }
            })
         } else {
            const urlsArr = await PostsUtilies.postMediaCloud(filesArray)
            if (!urlsArr || urlsArr.length === 0)
               return (next(ErrorHandling.createError(404, "No urls could be found!")))

            post = await prismaObj.post.create({
               data: {
                  userId: id,
                  content: body.content,
                  media: {
                     createMany: {
                        data: urlsArr.map((element) => ({mediaUrl: element.url, type: element.type === "raw" ? "FILE" : element.type === "video" ? "VIDEO" : "IMG"}))
                     }
                  }
               },
               include: {
                  media: true
               }
            })
         }

         if (!post)
            return (next(ErrorHandling.createError(400, "Cannot create new post")))

         return (this.response(res, 200, "successfuly posted!", post))
      } catch (err) {
         return (next(ErrorHandling.catchError("adding new post")))
      }
   }
   
   /**
    * deletePost Controller
    * 
    * Description:
    *             [1] --> get post id and userid, then validate token
    *             [2] --> Chek whether the post exist or not, then delete it
    *             [3] --> delete post media and also comments media if exists, then response
    */
   static deletePost = async (req, res, next) => {
      const {postId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const post = await prismaObj.post.delete({
            where: {
               id: postId,
               userId: id
            },
            include: {
               media: true,
               comments: {
                  select: {
                     media: true
                  }
               }
            }
         })

         if (!post)
            return (next(ErrorHandling.createError(404, "This post not found!")))

         const cloudStat = await PostsUtilies.deleteMedia(post.media)
         if (cloudStat < 0)
            post.cloudStatPostMedia = -1
         else
            post.cloudStatPostMedia = 1

         for (let comment of post.comments) {
            const cloudStat = await PostsUtilies.deleteMedia(comment.media)
            if (cloudStat < 0)
               post.cloudStatCommMedia = -1
            else
               post.cloudStatCommMedia = 1
         }

         return (this.response(res, 200, "Post has been Deleted!", null))
      } catch (err) {
         console.log(err)
         return (next(ErrorHandling.catchError("deleting the post")))
      }
   }

   /**
    * editPost Controller
    * 
    * Description:
    *             [1] --> get userid and validate
    *             [2] --> get post id to updated the post, also any deleted media ids, and also new media
    *             [3] --> create conditions whether there is new media or delted media
    *             [4] --> connect with cloudinay then response
    */
   static editPost = async (req, res, next) => {
      const {postId, delMediaIds} = req.query
      const {content} = req.body
      const files = req.files
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const filesArray =  PostsUtilies.checkTypes(files)

      const data = {
         content
      }

      if (delMediaIds && delMediaIds.split(",").length > 0)
         data.media = {
            deleteMany: {
               id: { in: delMediaIds.split(",") }
            }
         }
      try {
         const urlsArr = await PostsUtilies.postMediaCloud(filesArray)

         if (urlsArr && urlsArr.length > 0)
            data.media = {
               ...data.media,
               createMany: {
                  data: urlsArr.map((element) => ({
                     mediaUrl: element.url,
                     type: element.type === "raw" ? "FILE" : element.type === "video" ? "VIDEO" : "IMG"
                  }))
               }
            }

         const postMediaDel = delMediaIds && delMediaIds.split(",").length > 0 ?
         await prismaObj.postMedia.findMany({
            where: {
               id: {
                  in: delMediaIds.split(",")
               }
            }, select: {
               mediaUrl: true,
               type: true
            }
         }) : []

         const post = await prismaObj.post.update({
            where: {
               id: postId,
               userId: id
            }, include: {
               media: true
            }, data: data
         })

         const cloudStat = await PostsUtilies.deleteMedia(postMediaDel)
         if (cloudStat < 0)
            post.cloudStat = -1
         else
            post.cloudStat = 1

         if (!post)
            return (next(ErrorHandling.createError(404, "no post with this id found")))

         return (this.response(res, 200, "Post has been updated!", post))
      } catch (err) {
         return (next(ErrorHandling.catchError("editting post")))
      }
   }

   /**
    * getUserPosts controller
    * 
    * Description:
    *             [1] --> get userid, then validate token
    *             [2] --> find user based on the condition based on which id, then response
    */
   static getUserPosts = async (req, res, next) => {
      const {userId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         let result
         if (userId)
            result = await prismaObj.post.findMany(PostsUtilies.prismaFindPosts(userId))
         else
            result = await prismaObj.post.findMany(PostsUtilies.prismaFindPosts(id))

         return (this.response(res, 200, "User posts retrieved, successfuly!", result))
      } catch (err) {
         return (next(ErrorHandling.catchError("retrieve user posts")))
      }
   }
}

export default PostsController;
