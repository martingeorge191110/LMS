
/**
 * Class Validator - for controllers validation process
 */
class GlobalValidator {
   constructor (success, message) {
      this.success = success
      this.message = message
   }

   /* Function to check body object validation */
   static bodyObjValidation = (body) => {
      if (!body)
         return (new GlobalValidator(false, "Body object is null!"))

      const bodyObject = Object.entries(body)
      if (bodyObject.length < 1)
         return (new GlobalValidator(false, "Body Object deos not contains any key or value!"))

      for (let i of bodyObject)
         if (!i[1] || i[1] === "")
            return (new GlobalValidator(false, `${i[0]} section is Empty!`))
      
      return (new GlobalValidator(true, "Body object is Valid!"))
   }
}

export default GlobalValidator;
