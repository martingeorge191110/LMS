import prismaObj from "../prisma/prisma.js";
import ErrorHandling from "../middlewares/errorHandling.js";
import CoursesUtilies from "../utilies/coursesUtilies.js";




/**
 * Class for Course Controller api routes
 */
class CourseController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Response Function in case of Succesfuly */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new CourseController(message, data)
      ))
   }

   /**
    * addOne course controller (Just Admins)
    * 
    * Description:
    *             [1] --> get admin id, course info and instructors id, then validate
    *             [2] --> make sure this operation just for admins
    *             [3] --> creating the course with instructors id, then response
    */
   static addOne = async (req, res, next) => {
      const body = req.body
      const {instructorsId} = req.query
      const {id, authError, tokenError, tokenValid} = req


      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const bodyValidation = CoursesUtilies.infoFilter(body)
      if (!bodyValidation.success)
         return (next(ErrorHandling.createError(400, bodyValidation.message)))

      try {

         const adminCond = await CoursesUtilies.adminAuthorized(prismaObj, id)

         if (adminCond === false)
            return (next(ErrorHandling.createError(401, "just admins authorized to do this!")))

         const arrayOfIds = instructorsId ? CoursesUtilies.convertToArrayOfIds(instructorsId) : null

         let course
         if (arrayOfIds)
            course = await prismaObj.course.create({
               data: {
                  instructor: {
                     connect: arrayOfIds
                  },
                  ...body
               }
            })
         else 
            course = await prismaObj.course.create({
               data: {
                  ...body
               }
            })


         return (this.response(res, 201, "New Course has been added", course))
      } catch (err) {
         return (next(ErrorHandling.catchError("adding cnew course")))
      }
   }

   /**
    * uploadIntroVideo Controller to upload intro video
    * 
    * Description:
    *             [1] --> get course id from query, user id, and validate
    *             [2] --> check whether user is admin or not
    *             [3] --> uploading video using multer and cloudiinary
    *             [4] --> updating the course, then response
    */
   static uploadIntroVideo = async (req, res, next) => {
      const { courseId } = req.query;
      const { id, authError, tokenError, tokenValid } = req;

      if (authError || tokenError || tokenValid) {
         return next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid));
      }

      try {
         const adminCond = await CoursesUtilies.adminAuthorized(prismaObj, id);
         if (adminCond === false) {
            return next(ErrorHandling.createError(401, "Just admins authorized to do this!"));
         }

         const uploadOnCloud = await CoursesUtilies.uploadIntroVideo(req);
         if (!uploadOnCloud) {
            return next(ErrorHandling.createError(400, "Something went wrong during upload!"));
         }

         const course = await prismaObj.$executeRaw
            `UPDATE Course
            SET videoIntro = ${uploadOnCloud}
            WHERE id = ${courseId}`;

         if (!course) {
            return next(ErrorHandling.createError(404, "No course with this id found!"));
         }

         return (this.response(res, 200, "Updated, Succesfuly", uploadOnCloud))
      } catch (err) {
         return next(ErrorHandling.catchError("Error uploading intro video"));
      }
   }
}

export default CourseController;
