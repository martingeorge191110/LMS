import express from 'express';
import verifyToken from '../middlewares/tokenVerification.js';
import CourseController from '../controllers/coursesController.js';
import { uploadUtil } from '../middlewares/multer.js';
import multer from 'multer';

const CoursesRouter = express.Router()

CoursesRouter.use(verifyToken)

CoursesRouter.route("/admin/").post(CourseController.addOne)


CoursesRouter.route("/admin/video/").put(
   uploadUtil.single('video')
   , CourseController.uploadIntroVideo)



export default CoursesRouter;
