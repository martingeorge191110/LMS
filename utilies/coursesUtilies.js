import { cloudinary} from "../middlewares/multer.js"
import fs from 'fs'

/**
 * Class utilies and also validation for courses controller
 */
class CoursesUtilies {
   constructor (success, message) {
      this.success = success
      this.message = message
   }

   /**
    * Function that validate body for adding new course
    */
   static infoFilter = (body) => {
      const bodyArray = Object.entries(body)
      if (bodyArray.length < 14)
         return (new CoursesUtilies(false, "Not all sections completed!"))

      for (let i = 0; i < bodyArray.length; i++) {
         if (!bodyArray[i][1] || bodyArray[i][1] === "")
            return (new CoursesUtilies(false, `Section ${bodyArray[i][0]} is Empty`))
      }
      return (new CoursesUtilies(true, "Every thing is valid!"))
   }

   /**
    * Function to make just admin authorized
    */
   static adminAuthorized = async (prismaObject, id) => {
      try {
         const admin = await prismaObject.$queryRaw
         `SELECT isAdmin FROM User
         WHERE id = ${id}`

         const adminCondition = admin[0].isAdmin
         if (adminCondition === 1)
            return (true)
         else
            return (false)
      } catch (err) {
         return (false)
      }
   }

   /**
    * Function to adding intro video about the course
    * into cloudinary
    */
   static uploadIntroVideo = async (req) => {
      if (!req.file) 
         return (null);

      try {
         const data = await fs.promises.readFile(req.file.path);

         const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
               { resource_type: 'video' , folder: 'courses'}, 
               (error, result) => {
                  if (error) {
                     return reject(error);
                  }
                  resolve(result.secure_url);
               }
            );
            stream.end(data);
         }).then(
            resValue => resValue
         ).catch (
            err => null
         )

         await fs.promises.unlink(req.file.path)
         return (result); 
      } catch (err) {
         return (null)
      }
   }

   /**
    * Function that convert query of instructors ids to array of id, to add them
    */
   static convertToArrayOfIds = (queryIds) => {
      const resultId = queryIds.split(",")

      const newArr = resultId.map((ele) => {
         return ({
            userId: ele
         })
      })

      return (newArr)
   }
}

export default CoursesUtilies;
