import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({children}){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=> {
        api.get('/auth/profile/me/')
         .then(result=> setUser(result.data))
         .catch(()=> setUser(null))
         .finally(()=> setLoading(false))

    }, [])

    async function logout() {
        await api.post('/auth/logout/')
        setUser(null)
    }
    
    return (
        <AuthContext value={{user, loading, logout, setUser}}>
            {children}
        </AuthContext>
    )
}

export function useAuth(){
    return useContext(AuthContext);
}