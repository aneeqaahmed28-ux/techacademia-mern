import { useState } from "react";
// import { useAuth } from "../store/auth";
import { toast } from 'react-toastify';


const defaultContactFormData = {
  username: "",
  email: "",
  message: "",
};



export const Contact = () => {
   const [data, setData] = useState(defaultContactFormData);

//  const { user } = useAuth();

//   console.log("frontend user ", user.email);

//   const [userData, setUserData] = useState(true);

//   if (userData && user) {
//     setData({
//       username: user.username,
//       email: user.email,
//       message: "",
//     });
//     setUserData(false);
//   }

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
      const response = await fetch ("http://localhost:5000/api/form/contact",{
        method: "POST",
        headers:{
          "Content-Type":" application/json"
        },
        body: JSON.stringify(data),
      });
      if (response.ok){
        setData(defaultContactFormData);
        const data1 = await response.json();
        console.log(data1);
        toast.success("Message sent succesfully");
      }
      else{
        toast.error("Couldn't send message. Try later!");
      }
      
    } catch (error) {
      console.log("error from contact", error)
      
    }
  };
  return (
    <>
      <section className="section-contact">
        <div className="contact-content container">
         
        </div>

        <div className=" container grid grid-two-cols">
          <div className="contact-img">
            <img
              src="/Images/services.png"
              alt="Contact us anytime to avail our services"
              width="420"
              height="420"
            />
          </div>

          <section className="section-form">
          <h1 className="main-heading">Contact Us</h1>
          <br/>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username"> Username </label>
                <input
                  type="text"
                  name="username"
                  placeholder=" username"
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
                  placeholder=" email"
                  id="email"
                  required
                  value={data.email}
                  onChange={handleInput}
                />
              </div>

              <div>
                <label htmlFor="messsage">Message </label>
                <textarea
                  name="message"
                  id="message"
                  autoComplete="off"
                  value={data.message}
                  onChange={handleInput}
                  required
                  rows="5"
                  cols="40"
                ></textarea>
              </div>
              <br />
              <div>
                <button type="submit">Submit</button>
              </div>
            </form>
          </section>
        </div>

        <section className="mb-3">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13385.59887405002!2d73.64451164311055!3d32.99323567460728!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391f920a4ec8126d%3A0xe79e43c79610ec09!2sSatellite%20Town%20Jhelum%2C%20Jhelum%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1723997236894!5m2!1sen!2s"
          width="100%"
          height="450"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
        </section>

      </section>
    </>
  );
};
