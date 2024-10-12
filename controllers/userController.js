import prismaObj from "../prisma/prisma.js";
import UserValidation from "../utilies/userValidation.js";
import ErrorHandling from "../middlewares/errorHandling.js";
import UserUtilies from "../utilies/userUtilies.js";

/**
 * Class UserController --> for managing user routes (api)
 */
class UserController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Response Function */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new UserController(message, data)
      ))
   }

   /**
    * completePorfile controller
    * 
    * Description:
    *             [1] --> get body information, also token verify infomration
    *             [2] --> check validation of token and body infromation validation
    *             [3] --> update user to complete infomration, then response
    */
   static completePorfile = async (req, res, next) => {
      const body = req.body
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const profileValid = UserValidation.profileValid(body)
      if (!profileValid.success)
         return (next(ErrorHandling.createError(400, profileValid.message)))

      try {
         const user = await prismaObj.user.update({
            where: {id},
            data: {
               isProfileComplete: true,
               isInstructor: body.role === "INSTRUCTOR" ? true : false,
               isOnline: true,
               ...body
            }
         })

         if (!user)
            return (next(ErrorHandling.createError(404, "User is not Found to be Updated!")))

         return (this.response(res, 200, "Porfile Completed!", user))
      } catch (err) {
         return (next(ErrorHandling.catchError("Completing Profile!")))
      }
   }

   /**
    * retrieveProfile Controller
    * 
    * Description:
    *             [1] --> get token verification errors and inf
    *             [2] --> after checking validation, retrieve user and response
    */
   static retrieveProfile = async (req, res, next) => {
      const {id} = req

      try {
         const user = await prismaObj.$queryRaw
         `SELECT *, 
         (SELECT JSON_ARRAY(Link) FROM Link l WHERE l.userId = ${id}) AS links,
         (SELECT JSON_object('id', i.id, 'description', i.description, 'specialize', i.specialize, 'yearsOfExperience', i.yearsOfExperience) FROM Instructor i
         WHERE i.userId = ${id}) AS instructor
         FROM User u
         WHERE u.id = ${id};`

         if (!user)
            return (next(ErrorHandling.createError(400, "User is not Found!")))

         return (this.response(res, 200, "User Retrieved, Seccesfuly!", user))
      } catch (err) {
         return (next(ErrorHandling.catchError("Retrieving user information")))
      }
   }

   /**
    * updateProfile Controller
    * 
    * Description:
    *             [1] --> get file (from body obj), also token verification errors
    *             [2] --> after checking validation, send file to cloudinary
    *             [3] --> check user validation, then response with avatart
    */
   static newAvatar = async (req, res, next) => {
      const file = req.file
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const avatarValid = file && Object.keys(file).length > 0;
      if (!avatarValid)
         return (next(ErrorHandling.createError(400, "File is not included!")))

      try {
         const imgUrl = await UserUtilies.cloudinaryUpload(file)
         if (!imgUrl)
            return (next(ErrorHandling.createError(500, "Something went wrong during Upload the file!")))

         const avatar = await prismaObj.user.update({
            where: {id},
            data: {
               avatar: imgUrl
            },
            select: {
               avatar: true
            }
         })

         if (!avatar)
            return (next(ErrorHandling.createError(404, "User not Authorized for doing thit!")))

         return (this.response(res, 200, "File uploaded, Seccesfuly!", avatar))
      } catch (err) {
         return (next(ErrorHandling.catchError("Updating infomration!")))
      }
   }
}

export default UserController;
