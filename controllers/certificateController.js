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
      const {id} = req
      const body = req.body

      const bodyValidation = GlobalValidator.bodyObjValidation(body)
      if (!bodyValidation.success)
         return (next(ErrorHandling.createError(400, bodyValidation.message)))

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
      const {id} = req
      const {certificateId} = req.body
      const file = req.files.file[0];

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
}


export default CertificatesController;
