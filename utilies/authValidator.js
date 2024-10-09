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

   /* Check Whether neccessary fields for user Registeration is Valid */
   static registerValid (fn, ln, email, password, country) {
      const fnValid = AuthValidation.nameValidation(fn)
      const lnValid = AuthValidation.nameValidation(ln)
      const emailValid = validator.isEmail(email)
      const strongPass = validator.isStrongPassword(password, {
         minLength: 8, minLowercase: 1, minUppercase: 0, 
         minNumbers: 0, minSymbols: 0
      })
      const countryValid = validator.isEmpty(country)
      if (!fnValid.success)
         return (fnValid)
      else if (!lnValid.success)
         return (lnValid)
      else if (!emailValid)
         return (new AuthValidation(false, "Email is not Valid!"))
      else if (!strongPass)
         return (new AuthValidation(false, "Password is Not strong Enough!"))
      else if (countryValid)
         return (new AuthValidation(false, "Country field should not be Empty!"))

      return (new AuthValidation(true, "Register fields is Valid, you can go to next step!"))
   }
}
