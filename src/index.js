// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.on("Error",(err)=>{
        console.log(`Err :${err}`);
        throw err;
    });
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is listening at ${process.env.PORT||8000}`);
    })
})
.catch((error)=>{
    console.log(`MongoDB conection  is failed    :\n ${error}`);
})




/*
import express from "express";
const app = express();

 
(async ()=>{
    try {
       await mongoose.connect(`${process.env.PORT}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("ERR :",error);
        throw error
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App is listing on ${process.env.PORT}`);
       })
    } catch (error) {
        console.error("Error",error);
        throw error
    }
})()
*/