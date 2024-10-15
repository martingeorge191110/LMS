import prismaObj from "../prisma/prisma.js";
import ErrorHandling from '../middlewares/errorHandling.js'



/**
 * Class: educationController
 */
class EducationController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new EducationController(message, data)
      ))
   }

   /**
    * retrieveAll controller
    * 
    * Description:
    *             [1] --> get user id, and validate
    *             [2] --> gett all educations, then response
    */
   static retrieveAll = async (req, res, next) => {
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const education = await prismaObj.$queryRaw
         `SELECT * FROM Education
         WHERE userId = ${id}`

         if (!education)
            return (next(ErrorHandling.createError(404, "No Education Yet")))

         return (this.response(res, 200, "Educations has been Retrieved!", education))
      } catch (err) {
         return (next(ErrorHandling.catchError("retrieve educations")))
      }
   }

   /**
    * deleteOne controller
    * 
    * Description:
    *             [1] --> get userid and education id and validate
    *             [2] --> execute the delete query then response
    */
   static deleteOne = async (req, res, next) => {
      const {id, authError, tokenError, tokenValid} = req
      const {educationId} = req.query

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const education = await prismaObj.$executeRaw
         `DELETE FROM Education
         WHERE userId = ${id} AND id = ${educationId}`

         if (!education)
            return (next(ErrorHandling.createError(404, "No education to be deleted!")))

         return (this.response(res, 200, "Education has been deleted!", null))
      } catch (err) {
         return (next(ErrorHandling.catchError("delete one education")))
      }
   }

   /**
    * updateOne controller
    * 
    * Description:
    *             [1] --> get user id and education id, and validate
    *             [2] --> update certificate then response
    */
   static updateOne = async (req, res, next) => {
      const {id, authError, tokenError, tokenValid} = req
      const body = req.body
      const {educationId} = req.query

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const education = await prismaObj.education.update({
            where: {
               id: educationId, userId: id
            },
            data: {
               ...body
            }
         })

         if (!education)
            return (next(ErrorHandling.createError(404, "No education to be upddated!")))

         return (this.response(res, 200, "Education has been updated!", education))
      } catch (err) {
         return (next(ErrorHandling.catchError("update education")))
      }
   }

   /**
    * createOne controller
    * 
    * Description:
    *             [1] --> get id and education information, also check validation
    *             [2] --> add new one, then response
    */
   static createOne = async (req, res, next) => {
      const body = req.body
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const bodyValidation = GlobalValidator.bodyObjValidation(body)
      if (!bodyValidation.success)
         return (next(ErrorHandling.createError(400, bodyValidation.message)))

      try {
         const education = await prismaObj.education.create({
            data: {
               userId: id,
               ...body
            }
         })

         return (this.response(res, 201, "New education has been added!", education))
      } catch (err) {
         return (next(ErrorHandling.catchError("adding one education")))
      }
   }
}

export default EducationController;
