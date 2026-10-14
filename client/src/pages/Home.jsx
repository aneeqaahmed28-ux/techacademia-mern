
export const Home = () => {
  return (
    <>
      <main>
        <section className="section-hero">
          <div className="container grid grid-two-cols">
            <div className="hero-content">
              <p>Unlock Your Potential with</p>
              <h1> TechAcademia</h1>
              <p>
              We offer a diverse range of computer science courses designed to help students master the latest technologies and thrive. Our expert instructors  guide you through comprehensive courses from basic to advanced level. Each course is carefully structured with engaging lessons, hands-on projects, and real-world applications to ensure you gain practical experience. 
              </p>
              <div className="btn btn-group">
                <a href="/contact">
                  <button className="btn">connect now</button>
                </a>
                <a href="/services">
                  <button className="btn secondary-btn">learn more</button>
                </a>
              </div>
            </div>

            {/* hero images  */}
            <div className="hero-image">
              <img
                src="/Images/register.png"
                alt="coding together"
                width="400"
                height="500"
              />
            </div>
          </div>
        </section>
      </main>


      <section className="section-analytics">
          <div className="container grid grid-four-cols">
            <div className="div1">
              <h1>1 Million</h1>
              <p>Satisfied Students</p>
            </div>
            <div className="div1">
              <h1>10,000+</h1>
              <p>Securing Jobs</p>
            </div>
            <div className="div1">
              <h1>1 Million</h1>
              <p>Happy Clients</p>
            </div>
            <div className="div1">
              <h1>50+</h1>
              <p>Industry Veterans</p>
            </div>
          </div>
        </section>


        <section className="section-hero">
        <div className="container grid grid-two-cols">
          {/* hero images  */}
          <div className="hero-image1">
            <img
              src="/Images/about.png"
              alt="coding together"
              width="270"
              height="400"
            />
          </div>

          <div className="hero-content">
            <p>We are here to help you</p>
            <h1>Get Started Today</h1>
            <p>
              Ready to take the first step?
             Start this journey of more efficient and engaging learning through video lessons, hands-on projects, and real-world applications to ensure you gain practical experience. Join us today and start your journey to becoming a skilled tech professional!
            </p>
            <div className="btn btn-group">
              <a href="/contact">
                <button className="btn">connect now</button>
              </a>
              <a href="/services">
                <button className="btn secondary-btn">learn more</button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
