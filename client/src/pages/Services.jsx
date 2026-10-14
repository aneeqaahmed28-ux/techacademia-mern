import { useAuth } from "../store/auth";
export const Services = () => {
  const { services } = useAuth();
  return (
    <section className="section-services">
      <div className="container">
        <h1 className="main-heading">Services</h1>
      </div>
      <div className="container grid grid-three-cols">
        {services.map((curElement, index) => {
          const { name, category, duration, level, instructor } = curElement;

          return (
            <div className="card" key={index}>
              <div className="card-image">
                <img
                  src="/Images/services.png"
                  alt="Serices being provided to people"
                  width="300"
                  height=" 300"
                />
              </div>
              <div className="card-details">
                <h2>{name} </h2>
                <h2>(For {category} )</h2>
                <div className="grid grid-two-cols">
                  <p>{duration}</p>
                  <p>({level})</p>
                </div>
                <p> Taught by Mr./Ms. :{instructor}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
