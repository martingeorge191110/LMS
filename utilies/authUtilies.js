import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'


class AuthUtilies {

   /* Function to create new Token */
   static createToken = (id) => {
      const token = jwt.sign({
         id: id
      }, process.env.JWT_KEY, {
         expiresIn: process.env.JWT_EXP
      })

      return (token)
   }

   /* Function to set new Cookie */
   static setNewCookie = (res, token) => {
      const age = 1000 * 60 * 60 * 24 * 3;

      res.cookie("token", token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            maxAge: age
      })
   }

   /* Function to send mail to user (reseting password process) */
   static sendCodeMail = async (email, code, expDate) => {
      const transporter = nodemailer.createTransport({
         service: "gmail",
         auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
         }
      })

      const mail = {
         from: process.env.GMAIL_USER,
         to: email,
         subject: 'Password Reset Request',
         html: `
            <h1>Password Reset</h1>
            <p>Generated Code</p>
            <h2>${code}</h2>
            <h3>expire date${expDate}</h3>
         `,
      }

      try {
         await transporter.sendMail(mail)

         return (true)
      } catch (err) {
         return (false)
      }
   }
}

export default AuthUtilies;
