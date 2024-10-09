import express from "express";
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan";
import cookieParser from "cookie-parser";

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



server.listen(envVariables.PORT || 7000, () => {
   console.log("Server listening to Port", envVariables.PORT || 7000)
})
