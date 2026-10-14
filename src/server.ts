
import "dotenv/config";
import express, { type Request, type Response } from "express";
import morgan from "morgan";
import cors from "cors";



const app=express();
const port=process.env.PORT;

app.use(morgan("combined"))

app.listen(port,()=>{
    console.log(`app is listening at http://localhost:${port}`)
});

app.get("/",(req:Request, res:Response)=>{
    res.send("hello world")
});


