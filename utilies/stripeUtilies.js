import Stripe from "stripe";

/**
 * Class - For any payment method in the application
 */

class PaymentUtilies {


   /* Function that intiale stripe */
   static stripeInit = () => {
      return (
         new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' })
      )
   }

   /* Function to create stripe payment */
   static stripePay = async (req, price, courseName, courseId, userId) => {
      const stripe = this.stripeInit()

      try {
         const session = await stripe.checkout.sessions.create({
            line_items: [
               {
                  price_data: {
                  currency: 'usd',
                  unit_amount: Number(price) * 100,
                  product_data: {
                     name: courseName,
                     description: 'Payment for Course',
                     
                  },
                  },
                     quantity: 1,
               },
            ],
            metadata: {
               courseId: courseId,
               userId: userId,
               payment: true
            },
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/api/course/payment/success/${courseId}/${userId}`,
            cancel_url: `${req.protocol}://${req.get('host')}/api/course/payment/failure`
         });

         return (session.url)
      } catch (err) {
         console.log(err, "from")
         return (null)
      }
   }

   /* Function to listen for the payment */
   // static 
}

export default PaymentUtilies;
