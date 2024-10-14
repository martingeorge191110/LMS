import express from "express";
import verifyToken from "../middlewares/tokenVerification.js";
import CertificatesController from "../controllers/certificateController.js";
import multer from "multer";


const CertificateRouter = express.Router()

CertificateRouter.use(verifyToken)

CertificateRouter.route("/")
                           .post(CertificatesController.addOne)
                           .delete(CertificatesController.deleteOne)
                           .put(CertificatesController.updateOne)
                           .get(CertificatesController.retrieveCertificates)

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });
CertificateRouter.route("/avatar").put(upload.fields([{ name: "file" }, { name: "certificateId" }]), CertificatesController.addCertImg)


export default CertificateRouter;
