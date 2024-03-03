import { Express, urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = Express();
app.use(cors({
    origin:process.env.CORS_ORIGIN
}))
app.use(Express.json({
    limit:"16kb"
}))
app.use(Express.urlencoded({
    extended:true,
    limit:"16kb"
}))
app.use(cookieParser());
app.use(Express.static("public"));

export {app};