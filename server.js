import express from 'express';
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan";
import cookieParser from "cookie-parser";
import ErrorHandling from "./middlewares/errorHandling.js";
import AuthRouter from './routers/authRouter.js';
import UserRouter from './routers/userRouter.js';
import bodyParser from 'body-parser';
import CertificateRouter from './routers/certificateRouter.js';
import EducationRouter from './routers/educationRouter.js';
import LinkRouter from './routers/linkRouters.js'
import CoursesRouter from './routers/coursesRouter.js';
import CourseRevRouter from './routers/courseRevRouter.js';
import PostsRouter from './routers/postsRouter.js';
import WebHooksRouter from './routers/webhooks.js';

dotenv.config()

export const envVariables = process.env
const server = express()


server.use(bodyParser.json({ limit: '50mb' }));

server.use(morgan("tiny"))
server.use(cookieParser())
server.use(
   cors(
      {
         origin: envVariables.NODE_ENV === "development" ? "*" : null
         ,credentials: true
      })
);
server.use(express.json({limit: '5gb'}))
server.use(express.urlencoded({
   limit: '5gb',
   'extended': true
}))


/* Auth Router */
server.use("/api/auth", AuthRouter)

/* User Controller */
server.use("/api/user", UserRouter)

/* Certificates Router */
server.use("/api/certificate", CertificateRouter)

/* Education Router */
server.use("/api/education", EducationRouter)

/* Link Router */
server.use("/api/link", LinkRouter)

/* Courses Router */
server.use("/api/course", CoursesRouter)

/* Course Review Router */
server.use("/api/review", CourseRevRouter)

/* Posts Router */
server.use("/api/posts", PostsRouter)

/* Post Comments Router */
server.use("/api/posts", PostsRouter)

/* WebHook Router */
server.use("/api", WebHooksRouter)

/* Middle Ware Error handling */
server.use("*", ErrorHandling.responseError)

server.listen(envVariables.PORT || 7000, () => {
   console.log("Server listening to Port", envVariables.PORT || 7000)
})
