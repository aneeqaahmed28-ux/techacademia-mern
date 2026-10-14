import { useEffect, useState } from "react";
import { useAuth } from "../store/auth";
import { toast } from "react-toastify";

export const AdminContacts = () => {
  const [contactData, setContactData] = useState([]);
  const { authorizationToken } = useAuth();

  const getContactsData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/contacts", {
        methods: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });
      if (response.ok) {
        const data = await response.json();
        //console.log(users);
        console.log(data);
        setContactData(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteContactByID = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/contacts/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      const data = await response.json();
      console.log("user's data:", data);

      if (response.ok) {
        toast.success("updated successful");
        getContactsData();
      } else {
        toast.error("Couldn't update ");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getContactsData();
  }, []);

  return (
    <>
      <section className="admin-contacts-section">
        <div className="container">
          <h1>Admin - Contact Data</h1>
        </div>
        <div className="container admin-contacts">
          {/* {contactData.map((curElem,index)=>{
                        const {username, email, message, _id} = curElem;
                    return (
                        <div key = {index}>
                           <p> {username} </p>
                           <p> {email}</p>
                           <p> {message}</p>
                           <button className="btn"  onClick= {()=>deleteContactByID(_id)}>Delete </button>
                        </div>
                    ); 
                    })} */}

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>
              {contactData.map((curElem, index) => {
                const { username, email, message, _id } = curElem;
                return (
                  <tr key={index}>
                    <td>{username}</td>
                    <td>{email}</td>
                    <td>{message}</td>

                    <td>
                      <button onClick={() => deleteContactByID(_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
