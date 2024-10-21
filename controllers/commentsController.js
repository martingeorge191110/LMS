import ErrorHandling from "../middlewares/errorHandling.js";
import prismaObj from "../prisma/prisma.js";
import PostsUtilies from "../utilies/postUtilies.js";



/**
 * comment class controller for managing post comments
 */
class CommentsController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Response Function */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new CommentsController(message, data)
      ))
   }

   /**
    * addComment controller
    * 
    * Description:
    *             [1] --> get all data, then validate
    *             [2] --> create the ne data object based on conditions of
    *                      user pushed media or not
    *             [3] --> add the comment, then response
    */
   static addComment = async (req, res, next) => {
      const {postId} = req.query
      const {content} = req.body
      const files = req.files
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))
      if (!postId || postId === '')
         return (next(ErrorHandling.createError(400, 'postId must be integerated in request query1')))
      if (!content || content === '')
         return (next(ErrorHandling.createError(400, 'content must to not be empty!')))

      const dataObject = {}

      try {
         const filesArr = PostsUtilies.checkTypes(files)
         const mediaArray = await PostsUtilies.postMediaCloud(filesArr)

         if (mediaArray && mediaArray.length > 0)
            dataObject.media = {
               createMany: {
                  data: mediaArray.map((media) => ({mediaUrl: media.url, type: media.type === "raw" ? "FILE" : media.type === "video" ? "VIDEO" : "IMG"}))
               }
            }

         const comment = await prismaObj.postComment.create({
            data: {
               userId: id,
               postId: postId,
               content: content,
               ...dataObject
            }
         })

         if (!comment)
            return (next(ErrorHandling.createError(404, "No Comments")))

         return (this.response(res, 201, "Comment has been created!", comment))
      } catch (err) {
         console.log(err)
         return (next(ErrorHandling.catchError("add comment")))
      }
   }

   /**
    * manipulateLikes controller
    * 
    * Description:
    *             [1] --> get comment id, operation and userid, then validate
    *             [2] --> create object and add likes or remove based on the operation
    *             [3] --> response with the comment
    */
   static manipulateLikes = async (req, res, next) => {
      const {commentId, operation} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      if (!commentId || commentId === '')
         return (next(ErrorHandling.createError(400, "Post id must be included!")))

      const dataObj = {}
      if (operation === "add") {
         dataObj.likes = { increment: 1 }
         dataObj.usersLiks = {
            connect: { id: id }
         }
      } else {
         dataObj.likes = { decrement: 1 }
         dataObj.usersLiks = {
            disconnect: { id: id }
         }
      }

      try {
         const comment = await prismaObj.postComment.update({
            where: { id: commentId },
            data: dataObj
         })

         if (!comment)
            return (next(ErrorHandling.createError(404, "No comment found")))

         return (this.response(res, 200, "successfuly", comment))
      } catch (err) {
         return (ErrorHandling.catchError(`${operation} Like`))
      }
   }

   /**
    * deleteComment controller
    * 
    * Description:
    *             [1] --> get commentId and userid, then validate
    *             [2] --> delete comment from the DB
    *             [3] --> delete media from cloudinary then response
    */
   static deleteComment = async (req, res, next) => {
      const {commentId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const comment = await prismaObj.postComment.delete({
            where: {id: commentId,
               OR: [
                  {userId: id},
                  { post: { userId: id } }
               ]
            },
            include: {
               media: true
            }
         })

         const deleteMedia = await PostsUtilies.deleteMedia(comment.media)
         if (deleteMedia === -1)
            return (next(ErrorHandling.catchError("deleting media from cloudinary after deleting the comment")))

         return (this.response(res, 200, "comment has been deleted", comment))
      } catch (err) {
         return (next(ErrorHandling.catchError("deleting comment or there is no comment with this id")))
      }
   }
}

export default CommentsController;
