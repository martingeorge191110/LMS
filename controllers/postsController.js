import ErrorHandling from "../middlewares/errorHandling.js";
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
}

export default PostsController;
