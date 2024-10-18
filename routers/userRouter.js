import express from "express";
import UserController from "../controllers/userController.js";
import verifyToken from "../middlewares/tokenVerification.js";
import multer from "multer";


const UserRouter = express.Router()

/* Verify Token middleware */
UserRouter.use(verifyToken)


UserRouter.route("/profile")
                           .put(UserController.completePorfile)
                           .get(UserController.retrieveProfile)



const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });
UserRouter.route("/avatar").put(upload.single('file'), UserController.newAvatar)


/* Searching route
   userid or searching with name, or searching for all*/
UserRouter.route("/search/").get(UserController.searching)

export default UserRouter;
