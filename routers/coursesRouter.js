import express from 'express';
import verifyToken from '../middlewares/tokenVerification.js';
import CourseController from '../controllers/coursesController.js';
import { uploadUtil } from '../middlewares/multer.js';
import multer from 'multer';

const CoursesRouter = express.Router()

CoursesRouter.use(verifyToken)

CoursesRouter.route("/admin/")
                              .post(CourseController.addOne)
                              .put(CourseController.updateOne)
                              .patch(CourseController.addInstructor)


CoursesRouter.route("/admin/video/").put(
   uploadUtil('uploads').single('video')
   , CourseController.uploadIntroVideo)


CoursesRouter.route("/user/")
                              .get(CourseController.searching)
                              .post(CourseController.userPay)


CoursesRouter.route("/payment/success/:courseId/:userId").put(CourseController.successfulyPaid)

export default CoursesRouter;
