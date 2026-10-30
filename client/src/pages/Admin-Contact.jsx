import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../utils/api";

export const AdminContacts = () => {
  const [contactData, setContactData] = useState([]);

  const getContactsData = async () => {
    try {
      const response = await api("/api/admin/contacts");
      if (response.ok) {
        const data = await response.json();
        setContactData(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteContactByID = async (id) => {
    try {
      const response = await api(`/api/admin/contacts/delete/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Contact deleted");
        getContactsData();
      } else {
        toast.error("Couldn't delete");
      }
    } catch (error) {
      console.error(error);
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
              {contactData.map((curElem) => {
                const { username, email, message, _id } = curElem;
                return (
                  <tr key={_id}>
                    <td>{username}</td>
                    <td>{email}</td>
                    <td>{message}</td>
                    <td>
                      <button onClick={() => deleteContactByID(_id)}>Delete</button>
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
