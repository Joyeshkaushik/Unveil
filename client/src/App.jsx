import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import { Landing } from './pages/Landing';
import { AuthProvider,useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';

import { Detect } from './pages/Detect';
const ProtectedRoute=({children})=>{
  const {user,loading}=useAuth()
   if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: '#080C14'}}>
      <div className="w-8 h-8 border-2 border-accent rounded-full animate-spin border-t-transparent" style={{borderColor: '#00D4FF', borderTopColor: 'transparent'}}></div>
    </div>
  )
  return user ? children : <Navigate to="/login" />
}
function App(){
  return(
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>}/>
        <Route path="/login"  element={<Login/>}/>
         <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
           <Route path="/dashboard" element={<ProtectedRoute><Detect /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}
export default App;