import { v2 as cloudinary} from "cloudinary"
import multer from 'multer';
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const vars = process.env

cloudinary.config({
   cloud_name: vars.CLOUDINARY_NAME,
   api_key: vars.CLOUDINARY_API_KEY,
   api_secret: vars.CLOUDINARY_API_SECRET,
})

export {cloudinary};

export const uploadUtil = (folder) => {
   return (
      multer({
         storage: multer.diskStorage({
            destination: function (req, file, cb) {
               const uploadPath = path.join(process.cwd(), folder);
               
               if (!fs.existsSync(uploadPath)) {
                  fs.mkdirSync(uploadPath, { recursive: true });
               }
               
               cb(null, uploadPath);
            },
            filename: function (req, file, cb) {
               const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
               cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
            }
         }),
         limits: { fileSize: 50 * 1024 * 1024 }
      })
   )
}
