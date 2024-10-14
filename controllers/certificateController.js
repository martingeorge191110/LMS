import ErrorHandling from "../middlewares/errorHandling.js";
import prismaObj from "../prisma/prisma.js";
import GlobalValidator from "../utilies/globalValidator.js";
import UserUtilies from "../utilies/userUtilies.js";


class CertificatesController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new CertificatesController(message, data)
      ))
   }

   /**
    * addOne controller for adding new certificate
    *
    * Description:
    *             [1] --> get id and certificate information, also check validation
    *             [2] --> add new one, then response
    */
   static addOne = async (req, res, next) => {
      const body = req.body

      const bodyValidation = GlobalValidator.bodyObjValidation(body)
      if (!bodyValidation.success)
         return (next(ErrorHandling.createError(400, bodyValidation.message)))

      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const certificate = await prismaObj.certificate.create({
            data: {
               userId: id,
               ...body
            }
         })

         return (this.response(res, 201, "New Certificate added to your Profile!", certificate))
      } catch (err) {
         return (next(ErrorHandling.catchError("Adding additional certificate")))
      }
   }

   /**
    * addCertImg Controller - for uploading certificate img
    *
    * Description:
    *             [1] --> get user id, certificate id and file, then check validation
    *             [2] --> upload photo into cloudinary
    *             [3] --> get url and store it in data base, then response
    */
   static addCertImg = async (req, res, next) => {
      const {certificateId} = req.body
      const file = req.files.file[0];
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const imgUrl = await UserUtilies.cloudinaryUpload(file)
         if (!imgUrl)
            return (next(ErrorHandling.createError(500, "Something went wrong during apload into ckoudinary!")))

         const certificate = await prismaObj.$executeRaw
         `UPDATE Certificate
         SET avatar = ${imgUrl}
         WHERE id = ${certificateId} AND userId = ${id};`

         const certificateRes = await prismaObj.$queryRaw
         `SELECT avatar FROM Certificate
         WHERE id = ${certificateId}`

         if (!certificate)
            return (next(ErrorHandling.createError(404, "No Existing Certificate with this id!")))

         return (this.response(res, 200, "Img added for this certificate", certificateRes[0]))
      } catch (err) {
         return (next(ErrorHandling.catchError("add certificate img")))
      }
   }

   /**
    * deleteOne controller
    * 
    * Description:
    *             [1] --> get userid and certificate id and validate
    *             [2] --> execute the delete query then response
    */
   static deleteOne = async (req, res, next) => {
      const {certificateId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const certificate = await prismaObj.$executeRaw
         `DELETE FROM Certificate
         WHERE userId = ${id} AND id = ${certificateId}`

         if (!certificate)
            return (next(ErrorHandling.createError(404, "No certificate to be deleted!")))

         return (this.response(res, 200, "Certificate deleted, Succesfuly!", null))
      } catch (err) {
         return (next(ErrorHandling.catchError("delete  certificate")))
      }
   }

   /**
    * updateOne controller
    * 
    * Description:
    *             [1] --> get user id and certificate id, and validate
    *             [2] --> update certificate then response
    */
   static updateOne = async (req, res, next) => {
      const body = req.body
      const {certificateId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const certificate = await prismaObj.certificate.update({
            where: {
               id: certificateId, userId: id
            },
            data: {
               ...body
            }
         })

         if (!certificate)
            return (next(ErrorHandling.createError(404, "No certificate to be Updated!")))

         return (this.response(res, 200, "Certificate has been updated!", certificate))
      } catch (err) {
         return (next(ErrorHandling.catchError("Update Certificate")))
      }
   }

   /**
    * retrieveCertificates controller
    * 
    * Description:
    *             [1] --> get user id and validate
    *             [2] --> retrieve user certificates, then response
    */
   static retrieveCertificates = async (req, res, next) => {
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const certificates = await prismaObj.$queryRaw
         `SELECT * FROM Certificate
         WHERE userId = ${id}`

         if (!certificates)
            return (ErrorHandling.createError(404, "No Certificates!"))

         return (this.response(res, 200, "Certificates retrieved, Succesfuly", certificates))
      } catch (err) {
         return (next(ErrorHandling.catchError("Retrieve Certificates")))
      }
   }
}


export default CertificatesController;
