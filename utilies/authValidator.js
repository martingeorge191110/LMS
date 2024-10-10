import validator from 'validator'

/**
 * Class for validating user information for auth controller
 */

class AuthValidation {
   constructor (success, message) {
      this.success = success
      this.message = message
   }

   /* Function to make sure about name validation
   (fn, ln deosnot include spaces and not null) */
   static nameValidation (name) {
      if (!name || name === "") {
         return (new AuthValidation(false, "Please Enter your name!"))
      }
      for (let i = 0; i < name.length; i++) {
         if (name[i] == ' ') {
            return (new AuthValidation(false, "Please Remove Spaces From your name!"))
         }
      }

      return (new AuthValidation(true, "No Messages"))
   }

   /* Check about whether user password is strong or not */
   static isStrongPassword = (password) => {
      const strongPass = validator.isStrongPassword(password, {
         minLength: 8, minLowercase: 1, minUppercase: 0, 
         minNumbers: 0, minSymbols: 0
      })

      return (strongPass)
   }
   /* Check Whether neccessary fields for user Registeration is Valid */
   static registerValid = (fn, ln, email, password) => {
      const fnValid = AuthValidation.nameValidation(fn)
      const lnValid = AuthValidation.nameValidation(ln)
      const emailValid = validator.isEmail(email)
      const strongPass = this.isStrongPassword(password)

      if (!fnValid.success)
         return (fnValid)
      else if (!lnValid.success)
         return (lnValid)
      else if (!emailValid)
         return (new AuthValidation(false, "Email is not Valid!"))
      else if (!strongPass)
         return (new AuthValidation(false, "Password is Not strong Enough!"))

      return (new AuthValidation(true, "Register fields is Valid, you can go to the next step!"))
   }

   /* Check Whether neccessary fields for user Login is Valid */
   static loginValid = (email, password) => {
      const emailValid = validator.isEmail(email)
      const password = validator.isEmpty(password)
      if (!emailValid)
         return (new AuthValidation(false, "Email is not Valid!"))
      else if (password)
         return (new AuthValidation(false, "Password Field is Empty, please enter your Password!"))

      return (new AuthValidation(true, "Login fields is Valid, you can go to the next step!"))
   }

   /* Check Whether neccessary fields for user resetPass is Valid */
   static resetPassValid = (email, password, confirmPass) => {
      const isEmail = validator.isEmail(email)
      const isStrongPassword = this.isStrongPassword(password)
      const isPassEqConPass = password === confirmPass ? true : false

      if (!isEmail)
         return (new AuthValidation(false, "Email is not Valid!"))
      else if (!isStrongPassword)
         return (new AuthValidation(false, "Password Field is not storng!"))
      else if (!isPassEqConPass)
         return (new AuthValidation(false, "Confirm password field is not Equall password!"))

      return (new AuthValidation(true, "Every thing is Valid, got to login process using new Password!"))
   }
}


export default AuthValidation;
