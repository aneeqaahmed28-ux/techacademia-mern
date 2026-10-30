import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../utils/api";

export const AdminUpdate = () => {
  const [data, setData] = useState({
    username: "",
    email: "",
    phone: "",
  });

  const params = useParams();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await api(`/api/admin/users/${params.id}`);
        if (!response.ok) return;
        const body = await response.json();
        if (cancelled) return;
        setData({
          username: body.username || "",
          email: body.email || "",
          phone: body.phone || "",
        });
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleInput = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setData({
      ...data,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api(`/api/admin/users/update/${params.id}`, {
        method: "PATCH",
        json: {
          username: data.username,
          email: data.email,
          phone: data.phone,
        },
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success("Updated successfully");
      } else {
        toast.error(body.extraDetails || body.message || "Not updated");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <section>
        <div className="admin-update-content container">
          <h1 className="main-heading">Admin - User Update</h1>
        </div>
        <section className="section-update">
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username"> User Name </label>
              <input
                type="text"
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
                type="tel"
                name="phone"
                id="phone"
                required
                value={data.phone}
                onChange={handleInput}
              />
            </div>
            <button type="submit">Update</button>
          </form>
          <br />
        </section>
      </section>
    </>
  );
};
