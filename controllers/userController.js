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
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

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

   /**
    * searching Controller
    * 
    * Description:
    *             [1] --> get userId or name (based on searching case), then validate token
    *             [2] --> if user clicked on specific userprofile, searching will be on bu userId
    *             [3] --> if user Searching by name, or no searching details, then response
    */
   static searching = async (req, res, next) => {
      const {userId, name} = req.query
      const {authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         let result;
         if (userId) {
            result = await prismaObj.$queryRaw`
            SELECT u.id, u.firstName, u.lastName, u.isInstructor, u.isAdmin,
            u.title, u.avatar, u.country, u.age, u.birthDate, u.role, u.bio, u.isOnline,
            u.createdAt, u.gender,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('entity', c.entity, 'date', c.date,'major', c.major, 'avatar', c.avatar, 'description', c.description))
               FROM Certificate c
               WHERE c.userId = u.id) AS certificates,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('entity', e.entity, 'degree', e.degree, 'major', e.major, 'description', e.description, 'startDate', e.startDate, 'endDate', e.endDate))
               FROM Education e
               WHERE e.userId = u.id) AS educations,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('website', l.website, 'link', l.link, 'description', l.description))
               FROM Link l
               WHERE l.userId = u.id) AS links
            FROM User u
            WHERE u.id = ${userId}`
         } else if (!userId && name) {
            result = await prismaObj.$queryRaw`
            SELECT u.id, u.firstName, u.lastName, u.isInstructor, u.isAdmin,
            u.title, u.avatar, u.role
            FROM User u
            WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', ${name}, '%')) OR
            LOWER(u.lastName) LIKE LOWER(CONCAT('%', ${name}, '%'))`
         } else if (!userId && !name) {
            result = await prismaObj.$queryRaw`
            SELECT u.id, u.firstName, u.lastName, u.isInstructor, u.isAdmin,
            u.title, u.avatar, u.role
            FROM User u`
         }

         return (this.response(res, 200, result && result.length > 0 ? "User retrieved, Seccesfuly!" : "No users Found!", result))
      } catch (err) {
         console.log(err)
         return (next(ErrorHandling.catchError("searching about users")))
      }
   }
}

export default UserController;
