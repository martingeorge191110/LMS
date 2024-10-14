import express from 'express';
import EducationController from '../controllers/educationController.js';


const EducationRouter = express.Router()


EducationRouter.route("/")
                           .get(EducationController.retrieveAll)
                           .delete(EducationController.deleteOne)
                           .put(EducationController.updateOne)
                           .post(EducationController.createOne)


export default EducationRouter;
