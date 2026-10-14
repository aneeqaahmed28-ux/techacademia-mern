import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
   const [token, setToken] = useState(localStorage.getItem("token"));
 const [user, setUser] = useState("");
 const [services, setServices]= useState([]);
const authorizationToken = `Bearer ${token}`;

  //function to stored the token in local storage
  const storeTokenInLS = (serverToken) => {
    setToken(serverToken);
    return localStorage.setItem("token", serverToken);
  };

  let isLoggedIn = !!token;
  //console.log(token);
  //console.log("isLoggedin ", isLoggedIn);

  //   to check whether is loggedIn or not
  const LogoutUser = () => {
    setToken("");
    return localStorage.removeItem("token");
  };



 //Authentication - getting currently loggin user data.
 const userAuthentication = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/user", {
      method: "GET",
      headers: {
        Authorization: authorizationToken ,
      },
    });

    if (response.ok) {
      const data = await response.json();

      // to get the user data 
      setUser(data.userData);
    } else {
      console.error("Error fetching user data");
    }
  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  userAuthentication();
}, []);

const getServices = async () =>{
  try {
    const response= await fetch("http://localhost:5000/api/data/services",{
      method: "GET",
    });

    if (response.ok){
      const data = await response.json();
     // console.log(data.msg);
      setServices(data.msg);
    }
    
  } catch (error) {
    console.log(`error getting services from db ${error}`);
  }
}

useEffect(()=>{
  getServices();
},[]);

return (
    <AuthContext.Provider value={{ isLoggedIn, storeTokenInLS, LogoutUser, services, authorizationToken}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const authContextValue = useContext(AuthContext);
  if (!authContextValue) {
    throw new Error("useAuth used outside of the Provider");
  }
  return authContextValue;
};
