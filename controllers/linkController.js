import prismaObj from "../prisma/prisma.js";
import ErrorHandling from "../middlewares/errorHandling.js";


/**
 * Class LinkController
 * Implement api routes related to adding and delte and retrieve links
 */
class LinkController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Response Function */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new LinkController(message, data)
      ))
   }

   /**
    * addOne controller
    * 
    * Description:
    *             [1] --> get id and Link information, also check validation
    *             [2] --> add new one, then response
    */
   static addOne = async (req, res, next) => {
      const body = req.body
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const bodyValidation = GlobalValidator.bodyObjValidation(body)
      if (!bodyValidation.success)
         return (next(ErrorHandling.createError(400, bodyValidation.message)))

      try {
         const link = await prismaObj.link.create({
            data: {
               userId: id,
               ...body
            }
         })

         return (this.response(res, 201, "New Link has been added!", link))
      } catch (err) {
         return (next(ErrorHandling.catchError("adding new link")))
      }
   }

   /**
    * deleteOne controller
    * 
    * Description:
    *             [1] --> get userid and link id, validate
    *             [2] --> execute the delete query then response
    */
   static deleteOne = async (req, res, next) => {
      const {linkId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         await prismaObj.$executeRaw
         `DELETE FROM Link
         WHERE id = ${linkId} AND userId = ${id}`

         return (this.response(res, 200, "Link has been deleted", null))
      } catch (err) {
         return (next(ErrorHandling.catchError("deleting the link")))
      }
   }

   /**
    * updateOne controller
    * 
    * Description:
    *             [1] --> get user id and link id, validate
    *             [2] --> update link detials then response
    */
   static updateOne = async (req, res, next) => {
      const {linkId} = req.query
      const body = req.body
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const bodyValidation = GlobalValidator.bodyObjValidation(body)
      if (!bodyValidation.success)
         return (next(ErrorHandling.createError(400, bodyValidation.message)))

      try {
         const link = await prismaObj.link.update({
            where: {
               id: linkId, userId: id
            },
            data: {
               ...body
            }
         })

         if (!link)
            return (next(ErrorHandling.createError(404, "No link to be updated")))

         return (this.response(res, 200, "Link details has been updated", link))
      } catch (err) {
         return (next(ErrorHandling.catchError("Updating link details")))
      }
   }

   /**
    * retrieveOneAndAll controller
    * 
    * Description:
    *             [1] --> get user id, linkId (if exist) and validate
    *             [2] --> if query (linkId) is not null retrieve specific link
    *             [3] --> if query eq null retrieve all, then response
    */
   static retrieveOneAndAll = async (req, res, next) => {
      const {linkId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         let responseObj;
         if (linkId) {
            responseObj = await prismaObj.$queryRaw
            `SELECT * FROM Link
            WHERE id = ${linkId} AND userId = ${id}`
         } else {
            responseObj = await prismaObj.$queryRaw
            `SELECT * FROM Link
            WHERE userId = ${id}`
         }

         return (this.response(res, 200, "Retrieving operation has been Successed!", responseObj))
      } catch (err) {
         return (next(ErrorHandling.catchError("retrieving links")))
      }
   }
}

export default LinkController;
