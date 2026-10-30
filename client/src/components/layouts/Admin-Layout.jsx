import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../store/auth";

export const AdminLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="container">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <header>
        <div className="container">
          <nav>
            <ul>
              <li>
                <NavLink to="/admin/users">Users </NavLink>
              </li>
              <li>
                <NavLink to="/admin/contact">Contacts</NavLink>
              </li>
              <li>
                <NavLink to="/admin/audit">Audit</NavLink>
              </li>
              <li>
                <NavLink to="/services">Services </NavLink>
              </li>
              <li>
                <NavLink to="/">Home </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  );
};