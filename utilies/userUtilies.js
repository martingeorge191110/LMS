
/**
 * Class for user utilies Functions
 */

import axios from "axios"

class UserUtilies {

   /* Function to upload photoes on Cloudinary */
   static cloudinaryUpload = async (file) => {
      const base64EncodedFile = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const formData = new FormData();
      formData.append('file', base64EncodedFile);
      formData.append('upload_preset', process.env.CLOUD_PRESET);

      try {
         const uploadFile = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/upload`, formData, {
            headers: {
                  'Content-Type': 'multipart/form-data'
            }
         })

         return (uploadFile.data.secure_url)
      } catch (err) {
         return (null)
      }
   }
}

export default UserUtilies;
