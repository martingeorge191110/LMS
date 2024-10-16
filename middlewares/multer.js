import { v2 as cloudinary} from "cloudinary"
import multer from 'multer';
import fs from 'fs'
import path from 'path'


cloudinary.config({
   cloud_name: process.env.CLOUDINARY_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
})

export {cloudinary};

export const uploadUtil = multer({
   storage: multer.diskStorage({
      destination: function (req, file, cb) {
         const uploadPath = path.join(process.cwd(), 'uploads');
         
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
});