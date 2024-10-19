import fs from 'fs'
import {cloudinary } from '../middlewares/multer.js'

/**
 * Class utility for posts controller
 */
class PostsUtilies {


   /* Function to know files type */
   static checkTypes = (files) => {
      if (!files)
         return (null)

      const allFilesArr = Object.entries(files)
      if (allFilesArr.length < 1)
         return (null)

      return (allFilesArr)
   }

   /* Upload post media into cloudinary */
   static postMediaCloud = async (filesArray) => {
      if (!filesArray || filesArray.length === 0)
         return (null)

      let newArr = [];
      for (let i = 0; i < filesArray.length; i++) {
         for (let j = 0; j < filesArray[i][1].length; j++) {
            newArr.push({
               type: filesArray[i][0],
               media: filesArray[i][1][j]
            })
         }
      }

      try {
         const urlArray = await Promise.all(
            newArr.map(async ({ type, media }) => {
               try {
                  const data = await fs.promises.readFile(media.path);

                  const result = await new Promise((resolve, reject) => {
                     const stream = cloudinary.uploader.upload_stream(
                        { resource_type: type, folder: 'postsMedia' },
                        (error, result) => {
                           if (error) return reject(error);
                           resolve({url: result.secure_url, type});
                        }
                     );
                     stream.end(data);
                  });

                  await fs.promises.unlink(media.path)
                  return (result);
               } catch (error) {
                  console.log(error)
                  console.log("###########################################")
                  return (null);
               }
            })
         );

         return (urlArray.filter(url => url !== null));
      } catch (err) {
         return (null)
      }
   }
   
   /* Function to get public id from each url*/
   static getPublicId = (url) => {
      const arr = (url.slice(8).split("/"))

      let startFrom;
      for (let i = 0 ; i < arr.length; i++) {
         if (arr[i] === 'upload'){
            startFrom = i + 2
            break
         }
      }
      arr[arr.length - 1] = arr[arr.length - 1].split('.')[0]
   
      return (arr.slice(startFrom).join("/"))
   }
}


export default PostsUtilies;
