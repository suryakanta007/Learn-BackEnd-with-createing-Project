import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB  = async()=>{
    try{
       const conectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    //    console.log(conectionInstance);
        console.log(`\n MongoDB conceted !! Be HOST :${conectionInstance.connection.host}`)
    }catch(error){
        console.log(`MongoDB conection error: ${Error}`);
        process.exit(1);
    }
}
export default connectDB;