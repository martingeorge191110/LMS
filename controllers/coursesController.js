import prismaObj from "../prisma/prisma.js";
import ErrorHandling from "../middlewares/errorHandling.js";
import CoursesUtilies from "../utilies/coursesUtilies.js";
import PaymentUtilies from "../utilies/stripeUtilies.js";
import dotenv from 'dotenv'

dotenv.config()


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
    * 
    */
   static updateOne = async (req, res, next) => {
      const body = req.body
      const {courseId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      if (!courseId || courseId === '')
         return (next(ErrorHandling.createError(400, "Did not recieved any course id!")))

      try {
         const adminCond = await CoursesUtilies.adminAuthorized(prismaObj, id)
         if (!adminCond)
            return (next(ErrorHandling.createError(401, "Unauthorized to do this Action!")))

         const course = await prismaObj.course.update({
            where: {
               id: courseId
            },
            data: {
               ...body
            }
         })

         if (!course)
            return (next(ErrorHandling.createError(404, "Course not found")))

         return (this.response(res, 200, "Updated, Succesfuly!", course))
      } catch (err) {
         return (next(ErrorHandling.catchError("updating existing course")))
      }
   }

   /**
    * 
    */
   static addInstructor = async (req, res, next) => {
      const {courseId, instructorId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      if (!courseId || !instructorId)
         return (next(ErrorHandling.createError(400, "Course id query and also instructorId query fields must be filled")))

      try {
         const adminCond = await CoursesUtilies.adminAuthorized(prismaObj, id)
         if (!adminCond)
            return (next(ErrorHandling.createError(403, "Unauthorized to do this Action!")))

         const course = await prismaObj.course.update({
            where: {
               id: courseId
            },
            data: {
               instructor: {
                  connect: {
                     userId: instructorId
                  }
               }
            },
            include: {
               instructor: true
            }
         })

         if (!course)
            return (next(ErrorHandling.createError(404, "This user is not instructor!")))

         return (this.response(res, 200, "Instructor has been added successfully!", course))
      } catch (err) {
         return (next(ErrorHandling.catchError("Adding new instructor to existing course")))
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

   /**
    * searching controller
    * 
    * Description:
    *             [1] --> get user id, searching query (if exist) and validate
    *             [2] --> if query is not null retrieve courses meet requirements
    *             [3] --> if query eq null retrieve all, then response
    */
   static searching = async (req, res, next) => {
      const search = req.query
      const { id, authError, tokenError, tokenValid } = req;

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)));

      try {
         let courses;
         if (!search)
            courses = await prismaObj.$queryRaw`SELECT * FROM Course`
         else
            courses = await prismaObj.course.findMany({
                  where: search
               })

         if (!courses)
            return (next(ErrorHandling.createError(404, "No Courses with needed requirements!")))

         return (this.response(res, 200, "Courses retrieved ,Succesfuly!", courses))
      } catch (err) {
         return (next(ErrorHandling.catchError("retrieve courses")))
      }
   }

   /**
    * userPay Controller for starting payment session
    * 
    * Descriptipn:
    *             [1] --> get course id, userid then validate
    *             [2] --> get the course with all strudents enrolled in
    *             [3] --> Check whether the student already enrolled in this course or not,
    *                     then response with stripe session url
    */
   static userPay = async (req, res, next) => {
      const {courseId} = req.query
      const { id, authError, tokenError, tokenValid } = req;

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)));

      try {
         const findCourse = await prismaObj.course.findUnique({
            where: {id: courseId},
            include: {
               students: true
            }
         })

         findCourse.students.forEach((student) => {
            if (student.id === id)
               return (next(ErrorHandling.createError(400, "Already Enrolled")))
         })
         if (!findCourse)
            return (next(ErrorHandling.createError(404, "This Course is not available!")))

         const sessionUrl = await PaymentUtilies.stripePay(req, findCourse.price, findCourse.name, findCourse.id, id)
         if (!sessionUrl)
            return (next(ErrorHandling.createError(500, "Something went wrong during sending payment url!")))

         return (this.response(res, 200, "Url!", sessionUrl))
      } catch (err) {
         return (next(ErrorHandling.catchError("Enrolling in course")))
      }
   }

   /**
    * successfulyPaid controller to save user in enrolled table
    * 
    * Description:
    *             [1] --> get userid and courseid from url params
    *             [2] --> update the enrolled table then response with the html file
    */
   static stripeWebHook = async (req, res, next) => {
      const stripe = PaymentUtilies.stripeInit();
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const sig = req.headers['stripe-signature'];

      let event;
      try {
         event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
         console.error('Webhook signature verification failed:', err.message);
         return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }

      if (event.type === 'checkout.session.completed') {
         const session = event.data.object;
         await this.processSuccessfulPayment(session);
      } else {
         console.warn(`Unhandled event type ${event.type}`);
      }

      return res.status(200).json({ received: true });
   }

   static async processSuccessfulPayment(session) {
      const courseId = session.metadata.courseId;
      const userId = session.metadata.userId;

      try {
         await prismaObj.course.update({
            where: { id: courseId },
            data: {
               students: {
                  connect: { id: userId }
               }
            }
         });
         console.log(`Successfully enrolled user ${userId} in course ${courseId}.`);
      } catch (error) {
         console.error(`Failed to enroll user ${userId} in course ${courseId}:`, error);
      }
   }
   
}

export default CourseController;
