import { createContext,useContext,useState,useEffect, Children } from "react";
import api from '../api/axios'
 const AuthContext=createContext()
  export const AuthProvider=({children})=>{
    const [user,setUser]=useState(null);
      const [loading, setLoading] = useState(true)
       useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login=async (email,password)=>{
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data
      //  Store the JWT token, NOT the email
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return res.data
  }
   const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password })
    const { token, user } = res.data

    // ✅ Store the JWT token, NOT the email
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return res.data
  }
   const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }
  return (
    <AuthContext.Provider value={{user,login,signup,logout,loading}}>
    {children}
    </AuthContext.Provider>
    
  )

  }
  export const useAuth=()=>useContext(AuthContext);