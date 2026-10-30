import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  const getAllUserData = async () => {
    try {
      const response = await api("/api/admin/users");
      if (!response.ok) {
        setUsers([]);
        return;
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await api(`/api/admin/users/delete/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        getAllUserData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAllUserData();
  }, []);

  return (
    <>
      <section className="admin-users-section">
        <div className="container">
          <h1>Admin User Data</h1>
        </div>
        <div className="container admin-users">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone #</th>
                <th>Update</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>
              {users.map((curUser) => {
                return (
                  <tr key={curUser._id}>
                    <td>{curUser.username}</td>
                    <td>{curUser.email}</td>
                    <td>{curUser.phone}</td>
                    <td>
                      <Link to={`/admin/users/${curUser._id}/edit`}>
                        <button>Edit</button>
                      </Link>
                    </td>
                    <td>
                      <button onClick={() => deleteUser(curUser._id)}>Delete</button>
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
