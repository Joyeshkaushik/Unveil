
require('dotenv').config;
const express=require("express");
const authRoutes=require('./routes/authRoutes');
const detectRoutes=require('./routes/detectRoutes');
const cors=require("cors");

const app=express();
app.use(cors());
app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/api/detect',detectRoutes);
app.use('/api/auth',authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Unveil API is running 🚀' })
})

const PORT=5000||process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})

const supabase = require('./config/supabase')

// Add this temporarily after app is created
supabase.from('profiles').select('count').then(({data, error}) => {
  if (error) console.log('❌ Supabase error:', error.message)
  else console.log('✅ Supabase connected!')
})