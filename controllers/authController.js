import { compareSync, hashSync } from "bcrypt";
import validator from 'validator'
import ErrorHandling from "../middlewares/errorHandling.js";
import prismaObj from "../prisma/prisma.js";
import AuthValidation from "../utilies/authValidator.js";
import AuthUtilies from "../utilies/authUtilies.js";


/**
 * Class for authintication api controllers
 */
class AuthController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new AuthController(message, data)
      ))
   }
   /**
     * Static Function Controller for registeration process
     *
     * Description:
     *          [1] --> get user infoprmation and check inf validation
     *          [2] --> check at first existing of user information to avoid conflict ind data base
     *          [3] --> creating new user in data base using hashed password and creating token
     *          [4] --> response with message, response data and also create new cookie with token
     */
   static register = async (req, res, next) => {
      const {firstName, lastName, email, password} = req.body

      const fieldsValidation = AuthValidation.registerValid(
         firstName, lastName, email, password
      )
      if (!fieldsValidation.success)
         return (next(ErrorHandling.createError(400,fieldsValidation.message)))

      try {
         const findUser = await prismaObj.user.findUnique({
            where: {email}
         })

         if (findUser)
            return (next(ErrorHandling.createError(409, "Email Address Already Exists!")))

         const hashedPass = hashSync(password, 10)

         const newUser = await prismaObj.user.create({
            data: {
               firstName, lastName, email, password: hashedPass
            }
         })

         const token = AuthUtilies.createToken(newUser.id)

         AuthUtilies.setNewCookie(res, token)

         return (this.response(res, 201, "Succesfuly, Register!", newUser))
      } catch (err) {
         return (next(ErrorHandling.catchError("register")))
      }
   }

   /**
    * Static Function Controller for login process
    * 
    * Description: 
    *             [1] --> Get user infomration and check fields Validation
    *             [2] --> Find user and check whether user exist or not, if exist check password
    *             [3] --> create token and also set new cookies
    *             [4] --> response infomration based on user is instructor or not
    */
   static login = async (req, res, next) => {
      const {email, password} = req.body

      const fieldsValidation = AuthValidation.loginValid(email, password)
      if (!fieldsValidation.success)
         return (next(ErrorHandling.createError(400, fieldsValidation.message)))

      try {
         const user = await prismaObj.user.findUnique({
            where: {email}
         })

         if (!user)
            return (next(ErrorHandling.createError(404, "Email Address is not exist, Please Go to Registeration Process!")))

         const cmpPass = compareSync(password, user.password)
         if (!cmpPass)
            return (next(ErrorHandling.createError(409, "Wrong Password, try again or press Forget Password!")))

         const token = AuthUtilies.createToken(user.id)
         AuthUtilies.setNewCookie(res, token)

         if (user.isInstructor) {
            const userInstructor = await prismaObj.user.findUnique({
               where: {email},
               include: {
                  instructor: true
               }
            })

            return (this.response(res, 200, `Welcome instructor ${userInstructor.firstName}`, userInstructor))
         }

         return (this.response(res, 200, `Welcome ${user.firstName}`, user))
      } catch (err) {
         return (next(ErrorHandling.catchError("login")))
      }
   }

   /**
    * Static Function Controller for forgeting passwrod process
    * 
    * Description:
    *             [1] --> Get user email and check fields Validation, then create code
    *             [2] --> Update user gen code and exp date, after checking user email existing
    *             [3] --> sned mail with generated code
    *             [4] --> response infomration based on user is instructor or not
    */
   static sendCode = async (req, res, next) => {
      const {email} = req.body

      const isEmail = validator.isEmail(email)
      if (!isEmail)
         return (next(ErrorHandling.createError(400, "Email address is not Valid!")))

      const code = Number(String(Math.random()).slice(3,9))
      const expDate = new Date(Date.now() + 5 * 60 * 1000);
      try {
         const user = await prismaObj.user.update({
            where: {email},
            data: {
               genCode: code,
               expCode: expDate
            }
         })

         if (!user)
            return (next(ErrorHandling.createError(404, "User not found to Send gen code, please go to register process!")))

         const sendMailCheck = await AuthUtilies.sendCodeMail(user.email, code, expDate)

         if (!sendMailCheck)
            return (next(ErrorHandling.createError(409, "Click on send Code again, to send to your mail!")))

         return (this.response(res, 200, "Succesfuly, code sent!", {email: email}))
      } catch (err) {
         return (next(ErrorHandling.catchError("sending generated code")))
      }
   }

   /**
    * Static Function Controller for Comparign code and epx date
    * 
    * Description:
    *             [1] --> get user email, code then check fields validation
    *             [2] --> check whether user exists or not
    *             [3] --> compare current date and user expdate, also compare code, then response
    */
   static checkCode = async (req, res, next) => {
      const {email, code} = req.query

      const isEmail = validator.isEmail(email)
      if (!isEmail)
         return (next(ErrorHandling.createError(400, "Email address is not Valid!")))

      const currentDate = new Date(Date.now() + 1 * 60 * 1000)
      try {
         const user = await prismaObj.user.findUnique({
            where: {email}
         })

         const cmpDate = user.expCode > currentDate ? true : false
         if (!cmpDate)
            return (next(ErrorHandling.createError(409, "Code expired, Please request a new code!")))

         const cmpCode = user.genCode === Number(code) ? true : false
         if (!cmpCode)
            return (next(ErrorHandling.createError(400, "Generated code is wrond!")))

         return (this.response(res, 200, "Succesfuly!", {email: email}))
      } catch (err) {
         return (next(ErrorHandling.catchError("Checking code!")))
      }
   }

   /**
    * Comparign code and epx date Reset new password
    * 
    * Description:
    *             [1] --> get user email, password and confirmPass, code then check fields validation
    *             [2] --> Create new hashed password, and also update user
    *             [3] --> Response based on user exist or not
    */
   static resetPass = async (req, res, next) => {
      const {email, password, confirmPass} = req.body

      const resetPassValid = AuthValidation.resetPassValid(email, password, confirmPass)
      if (!resetPassValid.success)
         return (next(ErrorHandling.createError(400, resetPassValid.message)))

      const newPassword = hashSync(password, 10)
      try {
         const updateUser = await prismaObj.user.update({
            where: {email},
            data: {
               password: newPassword
            }
         })

         if (!updateUser)
            return (next(ErrorHandling.createError(404, "User not found!")))

         return (this.response(res, 200, "Password has been Updated, Succesfuly!"))
      } catch (err) {
         return (next(ErrorHandling.catchError("reset password")))
      }
   }

}


export default AuthController;
