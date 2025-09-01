import mongoose from "mongoose";
export const dbConnection=()=>{
    mongoose.connect(process.env.MONGO_URI,{
        dbName:"HOSPITALMANAGEMENTSYSTEM_DEPLOYED"
    }).then(()=>{
        console.log("Connected to database")
    }).catch(err=>{
        console.log(`Some error occured while connecting to a database:${err}`);
    });
};