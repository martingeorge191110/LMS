import ErrorHandling from "../middlewares/errorHandling.js";
import prismaObj from "../prisma/prisma.js";
import GlobalValidator from "../utilies/globalValidator.js";


/**
 * Controller class for manage course review controller
 */
class CourseRevController {
   constructor (message, data) {
      this.success = true
      this.message = message
      this.data = data
   }

   /* Succesfuly response function */
   static response = (res, code, message, data) => {
      return (res.status(code).json(
         new CourseRevController(message, data)
      ))
   }

   /**
    * addOne controller
    * 
    * Description:
    *             [1] --> get course id, user id and body, then validate
    *             [2] --> create review then response
    */
   static addOne = async (req, res, next) => {
      const body = req.body
      const {courseId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      const bodyValidation = GlobalValidator.bodyObjValidation(body)
      if (!bodyValidation.success)
         return (next(ErrorHandling.createError(400, "body is not valid!")))

      try {
         const review = await prismaObj.courseReview.create({
            data: {
               userId: id,
               courseId: courseId,
               ...body
            },
            include: {
               user: {
                  select: {
                     firstName: true,
                     lastName: true,
                     avatar: true,
                     title: true,
                     isInstructor: true,
                     isAdmin: true
                  }
               }
            }
         })

         return (this.response(res, 201, "Review has been submitted!", review))
      } catch (err) {
         console.log(err)
         return (next(ErrorHandling.catchError("adding review")))
      }
   }

   /**
    * getAllCourse Controller
    * 
    * Description:
    *             [1] --> get courseId an validate token
    *             [2] --> get query result then response
    */
   static getAllCourse = async (req, res, next) => {
      const {courseId} = req.query
      const {authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const courseReviews = await prismaObj.$queryRaw`
         SELECT c.id AS reviewId, u.id AS userId, c.comment, c.rating, u.firstName, u.lastName, u.avatar,
         (SELECT JSON_ARRAYAGG( JSON_OBJECT( 'id', us.id, 'firstName', us.firstName, 'lastName', us.lastName, 'isAdmin', us.isAdmin, 'isInstructor', us.isInstructor))
            FROM _likeReview l, User us
            WHERE l.A = c.id AND l.B = us.id ) AS usersLikes
         FROM CourseReview c, User u
         WHERE c.userId = u.id
         AND c.courseId = ${courseId}`

         return (this.response(res, 200, courseReviews.length < 1 ? "No Reviews for this course" : "Succesfuly, all reviews retrieved", courseReviews))
      } catch (err) {
         return (next(ErrorHandling.catchError("Retrieving all reviews for specific course")))
      }
   }

   /**
    * deleteOne controller
    * 
    * Description:
    *             [1] --> get review id and userid, then validate
    *             [2] --> delete the review, then response
    */
   static deleteOne = async (req, res, next) => {
      const {reviewId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const review = await prismaObj.$executeRaw`
         DELETE FROM CourseReview
         WHERE id = ${reviewId} AND userId = ${id}`

         if (!review)
            return (next(ErrorHandling.createError(404, "No Reviews with this id")))

         return (this.response(res, 200, "Review deleted, Succesfuly!", null))
      } catch (err) {
         return (next(ErrorHandling.catchError("deleting review")))
      }
   }

   /**
    * updateOne controller
    * 
    * Description:
    *             [1] --> get review id and user id, body then validate
    *             [2] --> update review then response
    */
   static updateOne = async (req, res, next) => {
      const {reviewId} = req.query
      const body = req.body
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const review = await prismaObj.courseReview.update({
            where: {
               id: reviewId, userId: id
            },
            data: {
               ...body
            }
         })

         if (!review)
            return (next(ErrorHandling.createError(404, "No review using this id found")))

         return (this.response(res, 200, "Review has been updated!", review))
      } catch (err) {
         return (next(ErrorHandling.catchError("updating course review")))
      }
   }

   /**
    * likeOne controller
    * 
    * Description:
    *             [1] --> get review id and userid, then validate
    *             [2] --> create a like and update the values then response
    */
   static likeOne = async (req, res, next) => {
      const {reviewId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const review = await prismaObj.courseReview.update({
            where: {
               id: reviewId
            },
            data: {
               likes: {
                  increment: 1
               },
               usersLikes: {
                  connect: {
                     id: id
                  }
               }
            },
            include: {
               usersLikes: {
                  select: {
                     id: true, firstName: true, lastName: true, isInstructor: true, isAdmin: true, title: true
                  }
               }
            }
         })

         if (!review)
            return (next(ErrorHandling.createError(404, "no reviews with this id!")))

         return (this.response(res, 200, "another like has been added!", review))
      } catch (err) {
         return (next(ErrorHandling.catchError("like existing review")))
      }
   }

   /**
    * deleteLike controller
    * 
    * Description:
    *             [1] --> get review id and user id then validate
    *             [2] --> remove like review query then response
    */
   static deleteLike = async (req, res, next) => {
      const {reviewId} = req.query
      const {id, authError, tokenError, tokenValid} = req

      if (authError || tokenError || tokenValid)
         return (next(ErrorHandling.tokenErrors(authError, tokenError, tokenValid)))

      try {
         const review = await prismaObj.courseReview.update({
            where: {
               id: reviewId, usersLikes: {
                  some: {
                     id: id
                  }
               }
            },
            data: {
               likes: {
                  decrement: 1
               }, usersLikes: {
                  disconnect: {
                     id: id
                  }
               }
            },
            include: {
               usersLikes: {
                  select: {
                     id: true, firstName: true, lastName: true, isInstructor: true, isAdmin: true, title: true
                  }
               }
            }
         })

         if (!review)
            return (next(ErrorHandling.createError(404, "no reviews and likes with this ids!")))

         return (this.response(res, 200, "like has been removed!" , review))
      } catch (err) {
         return (next(ErrorHandling.catchError("deleting review like")))
      }
   }
}

export default CourseRevController;
