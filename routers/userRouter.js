import express from "express";
import UserController from "../controllers/userController.js";
import verifyToken from "../middlewares/tokenVerification.js";
import multer from "multer";


const UserRouter = express.Router()

/* Verify Token middleware */
UserRouter.use(verifyToken)


UserRouter.route("/profile").put(UserController.completePorfile)

// UserRouter.use(express.static('../public/fileUpload'))

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });
UserRouter.route("/avatar").put(upload.single('file'), UserController.newAvatar)

export default UserRouter;