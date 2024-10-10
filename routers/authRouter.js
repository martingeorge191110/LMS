import express from "express";
import AuthController from "../controllers/authController.js";


const AuthRouter = express.Router()

/**
 * Register route
 *
 * method: POST
 * json body: firstName, lastName, email, password
 */
AuthRouter.route("/register").post(AuthController.register)

/**
 * login route
 *
 * method: POST
 * json body: email, password
 */
AuthRouter.route("/login").post(AuthController.login)

/**
 * reset password route
 *
 * method:
 * POST: Send Code --> json body: email
 * GET: Get code to compare --> query: (email=value&code=value)
 * PUT: Update the password --> json body: email, password, confirmPass
 */
AuthRouter.route("/reset-passwrod")
                                    .post(AuthController.sendCode)
                                    .get(AuthController.checkCode)
                                    .put(AuthController.resetPass)


export default AuthRouter;
