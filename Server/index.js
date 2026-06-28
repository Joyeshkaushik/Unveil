const express=require("express");
const cors=require("cors");
require('dotenv').config;
const app=express();
app.use(cors());
app.use(express.json());
app.get("/health",(req,res)=>{
     res.json({ status: 'Server is running' });
})
const PORT=5000||process.env.PORT;
app.listen(PORT,()=>console.log(`Server is running at Port :${PORT}`));