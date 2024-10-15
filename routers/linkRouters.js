import express from 'express';
import verifyToken from "../middlewares/tokenVerification.js";
import LinkController from '../controllers/linkController.js';

const LinkRouter = express.Router()

LinkRouter.use(verifyToken)



LinkRouter.route("/user/")
                           .post(LinkController.addOne)
                           .delete(LinkController.deleteOne)
                           .put(LinkController.updateOne)
                           .get(LinkController.retrieveOneAndAll)


export default LinkRouter;
