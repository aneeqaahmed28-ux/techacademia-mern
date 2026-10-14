import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import {toast } from "react-toastify";

export const Register = () => {
  const [user, setUser] = useState({
    username: " ",
    email: "",
    phone: "",
    password: "",
  });

 
  const navigate = useNavigate();
  const {storeTokenInLS}= useAuth();
  const handleInput = (e) => {
    console.log(e);
    let name= e.target.name;
    let value= e.target.value;
    setUser({
        ...user,
        [name]:value,
    })
  };

  const handleSubmit= async (e)=>{
    e.preventDefault();
    console.log(user);
    try{
    const response = await fetch("http://localhost:5000/api/auth/register",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    const res_data= await response.json();
  //console.log("response from server", res_data);
if(response.ok){
  toast.success("registration successful");
  
  storeTokenInLS(res_data.token);
  setUser({username: " ",
    email: " ",
    phone: " ",
    password: " ",
  })
navigate("/");
} else{
  toast.error(res_data.extraDetails?res_data.extraDetails: res_data.message);
}

    console.log(response);
}
    catch(error){
        console.log("registration error:", error);
    }
  };

  return (
    <>
      <section>
        <main>
          <div className="section-registration">
            <div className="container grid grid-two-cols">
              <div className="registration-image">
                <img
                  src="/Images/register.png"
                  alt="women making registration"
                  width="500"
                  height="300"
                />
              </div>
              <div className="registration-form">
                <h1 className="main-heading mb-3">Registration Form</h1>
                <br />
                <form onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="username"> Username </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      required
                      value={user.username}
                      onChange={handleInput}
                    />
                  </div>

                  <div>
                    <label htmlFor="email"> Email </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={user.email}
                      onChange={handleInput}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone"> Phone </label>
                    <input
                      type="number"
                      name="phone"
                      id="phone"
                      min = "0"
                      required
                      value={user.phone}
                      onChange={handleInput}
                    />
                  </div>

                  <div>
                    <label htmlFor="password"> Password </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      required
                      value={user.password}
                      onChange={handleInput}
                    />
                  </div>
                  <br />
                  <button type="submit" className="btn btn-submit">
                    Register Now
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </section>
    </>
  );
};
