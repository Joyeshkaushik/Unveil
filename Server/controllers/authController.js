const supabase =require('../Config/supabaseClient');
const signup=async(req,res)=>{
    const {email,password}=req.body;
    try{
        const {data,error}=await supabase.auth.signUp({email,password});
        if(error) return res.status(400).json({error:error.message});
        res.status(201).json({message:'User created',data});

        
    }
    catch(err){
        res.status(500).json({error:"Server error"});
    }
};

const login=async(req,res)=>{
    const {email,password}=req.body;
    try{
        const {data,error}=await supabase.auth.signInWithPassword({email,password});
        if(error) return  res.status(400).json({error:error.message});
        res.status(200).json({message:'Login Succesful',data});

    }
    catch(err){
        res.status(500).json({error:'Server error'});
    }
}
module.exports={signup,login};