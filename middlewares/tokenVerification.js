import jwt from 'jsonwebtoken';


const verifyToken = (req, res, next) => {
   const { authorization } = req.headers
   req.authError = false
   req.tokenError = false
   req.tokenValid = false

   if (!authorization) {
      req.authError = true
      return (next())
   }

   const token = authorization.split(" ")[1]
   if (!token) {
      req.tokenError = true
      return (next())
   }

   jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
      if (err) {
         req.tokenValid = true
         return (next())
      }
      req.id = payload.id
      next()
   })
}

export default verifyToken;
