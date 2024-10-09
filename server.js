import express from 'express';
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan";
import cookieParser from "cookie-parser";
import ErrorHandling from "./middlewares/errorHandling.js";

dotenv.config()

const envVariables = process.env
const server = express()

server.use(morgan("tiny"))
server.use(cookieParser())
server.use(
   cors({
   //  origin: "http://localhost:3000",
      credentials: true
   })
);
server.use(express.json())
server.use(express.urlencoded({
   'extended': true
}))


/* Auth Router */
// server.use("/auth", )

/* Middle Ware Error handling */
server.use("*", ErrorHandling.responseError)

server.listen(envVariables.PORT || 7000, () => {
   console.log("Server listening to Port", envVariables.PORT || 7000)
})
