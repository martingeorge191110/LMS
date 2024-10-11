

/**
 * Class for user validation
 */
class UserValidation {
   constructor (success, message) {
      this.success = success
      this.message = message
   }

   /* Function that check the validation of body object elementes */
   static profileValid = (body) => {
      const arrayOfBody = Object.entries(body)
      if (arrayOfBody.length < 2)
         return (new UserValidation(false, (`Body object is Empty!`)))

      for (let i = 0; i < arrayOfBody.length; i++) {
         if (!arrayOfBody[i][1] || arrayOfBody[i][1] == "")
            return (new UserValidation(false, `${arrayOfBody[i][0]} is Empty!`))
      }
      return (new UserValidation(true, "Fields are Valid!"))
   }
}


export default UserValidation;
