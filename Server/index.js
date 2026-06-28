
require('dotenv').config;
const express=require("express");
const authRoutes=require('./routes/authRoutes');
const cors=require("cors");

const app=express();
app.use(cors());
app.use(express.json());
app.use('/api/auth',authRoutes);

app.get("/health",(req,res)=>{
     res.json({ status: 'Server is running' });
})
const PORT=5000||process.env.PORT;
app.listen(PORT,()=>console.log(`Server is running at Port :${PORT}`));