/**
 * Error handling class
 * 
 * this class for creating errors and response with errors for middleware hadnling
 */

class ErrorHandling extends Error {
   constructor(statusCode, message) {
      super (message)
         this.statusCode = statusCode
         this.stack = process.env.NODE_ENV === "development" ? this.stack : null
         this.status = statusCode >= 400 && statusCode <= 500 ? "Failuire" : "Error"
   }

   /* Function to create errors */
   static createError (statusCode, message) {
      return (new ErrorHandling(statusCode, message))
   }

   /* Function to catch errors */
   static catchError = (process) => {
      const message = `Something wnet wrong within ${process} process!`
      return (this.createError(500, message))
   }

   /* Function middleware for respond with errors */
   static responseError = (err, req, res, next) => {
      return (res.status(err.statusCode).json({
         success: false,
         message: err.message,
         status: err.status,
         stack: err.stack
      }))
   }

   
   static tokenErrors = (authError, tokenError, tokenValid) => {
      if (authError)
         return (this.createError(400, "Authorization Must be included in Header"))
      else if (tokenError)
         return (this.createError(400, "Token is not found in Header"))
      else if (tokenValid)
         return (this.createError(400, "Token is not Valid!"))
   }
}

export default ErrorHandling
