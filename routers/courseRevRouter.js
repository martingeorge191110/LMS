import express from 'express'
import CourseRevController from '../controllers/courseRevController.js';
import verifyToken from '../middlewares/tokenVerification.js';


const CourseRevRouter = express.Router()

CourseRevRouter.use(verifyToken)


CourseRevRouter.route("/course/")
                                 .post(CourseRevController.addOne)
                                 .get(CourseRevController.getAllCourse)
                                 .delete(CourseRevController.deleteOne)
                                 .put(CourseRevController.updateOne)


export default CourseRevRouter;
