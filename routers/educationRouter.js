import express from 'express';
import EducationController from '../controllers/educationController.js';


const educationRouter = express.Router()


educationRouter.route("/")
                           .get(EducationController.retrieveAll)
                           .delete(EducationController.deleteOne)
                           .put(EducationController.updateOne)
                           .post(EducationController.createOne)


export default educationRouter;
