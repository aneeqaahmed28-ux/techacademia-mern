import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Services } from "./pages/Services";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Navbar } from "./components/Navbar";
import { Error } from "./pages/Error";
import { Footer } from "./components/Footer/Footer";
import { Logout } from "./pages/Logout";
import { AdminLayout } from "./components/layouts/Admin-Layout";
import { AdminUsers } from "./pages/Admin-Users";
import { AdminContacts } from "./pages/Admin-Contact";
import { AdminUpdate } from "./pages/Admin-Update";
import { AdminAudit } from "./pages/Admin-Audit";



const App = () => {
  return (
    <>
      <BrowserRouter>
      <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
      
          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />
        
          <Route path="/services" element={<Services />} />

          <Route path="/register" element={<Register />} />

          <Route path="/login" element={<Login />} />

          <Route path="/logout" element = {<Logout/>}/>

          <Route path="/admin" element={<AdminLayout/>}>
             <Route path = "users"  element={<AdminUsers/>}/>
             <Route path = "contact"  element={<AdminContacts/>}/>
             <Route path = "audit"  element={<AdminAudit/>}/>
             <Route path = "users/:id/edit"  element={<AdminUpdate/>}/>
          </Route>

          <Route path="*" element={<Error />} />

        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
};
export default App;
