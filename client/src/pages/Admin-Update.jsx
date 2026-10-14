import { useEffect, useState } from "react";
import { useAuth } from "../store/auth";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";


export const AdminUpdate = () => {
  
  const [data, setData] = useState({
    username: "",
    email: "",
    phone: "",
  });

  const params = useParams();
  console.log("single user params:", params);
  const { authorizationToken } = useAuth();

  const getSingleUserData = async () => {

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${params.id}`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      const data = await response.json();
      console.log(`user single data: ${data}`);
      setData(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSingleUserData();
  }, []);

   const handleInput = (e) => {
   let name = e.target.name;
   let value = e.target.value;
    setData({
     ...data,
     [name]: value,
    });
   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/update/${params.id}`,
        {
          method: "PATCH",
          headers: {
          "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify(data),
        });

        console.log("from admin-update", response);

      if(response.ok) {
        toast.success("Updated successfully");
      } else {
        toast.error("Not updated ");
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <section>
        <div className="admin-update-content container">
          <h1 className="main-heading">Admin - User Update</h1>
        </div>
          <section className="section-update">
            
            <form onSubmit ={handleSubmit}>
              <div>
                <label htmlFor="username"> User Name </label>
                <input
                  type="username"
                  name="username"
                  id="username"
                  required
                  value={data.username}
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
                  value={data.email}
                  onChange={handleInput}
                />
              </div>

              <div>
                <label htmlFor="phone"> Phone </label>
                <input
                  type="phone"
                  name="phone"
                  id="phone"
                  required
                  value={data.phone}
                  onChange={handleInput}
                />
              </div>
            <button type="submit ">Update </button>
            </form>
            <br />

          </section>
        
      </section>
    </>
  );
};
