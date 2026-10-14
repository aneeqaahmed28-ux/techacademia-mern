import { NavLink } from "react-router-dom";
//import { useAuth } from "../store/auth";

export const About = () => {
 // const {user}= useAuth();
  return (
    <>
      <main>
        <section className="section-about">
          <div className="container grid grid-two-cols">
            <div className="hero-content">
        <p>Hello there, welcome to TechAcademia</p>
              <h1>Why Choose Us? </h1>
               <br/>
                <p>
                  We offer a <b>comprehensive and engaging learning</b> experience that is tailored to meet the demands of the ever-evolving tech industry. 
                </p>
                <br/><br/>
                <p>
                From foundational topics like programming and algorithms to advanced subjects such as artificial intelligence, we provide a clear path to <b>mastering in-demand skills</b> that bring real-world knowledge and cutting-edge practices to the table. 
                </p>
                <br/><br/>
                <p>
                Emphasize <b>hands-on learning</b> through interactive coding exercises, real-world projects, and assessments. Flexible time durations, allowing you to learn at your own pace while balancing other commitments.
                </p>
                <br/><br/>
                <p>
                We offer <b>competitive pricing</b> without compromising
                on the quality of our services.
                </p>
                <br/><br/>
              <p>
              With a growing community of <b>satisfied students</b>, many have successfully transitioned into tech careers.
               </p>
              <div className="btn btn-group">
                <NavLink to="/contact">
                  <button className="btn"> Connect Now</button>
                </NavLink>
                <button className="btn secondary-btn">learn more</button>
              </div>
            </div>
            <div className="hero-image">
              <img
                src="/Images/about.png"
                alt="coding buddies "
                width="400"
                height="500"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};