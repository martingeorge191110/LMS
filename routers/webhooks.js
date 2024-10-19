import express from 'express'
import CourseController from '../controllers/coursesController.js';


const WebHooksRouter = express.Router()


WebHooksRouter.use(express.raw({ type: 'application/json' }))


/* Handling payment to be enrolled in course */
WebHooksRouter.route("/course/webhook")
                              .post( CourseController.stripeWebHook);


export default WebHooksRouter;
