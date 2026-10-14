import { NavLink } from "react-router-dom"

export const Error = () =>{
    return (

        <>
        <section id="error-page">
        <div className="container grid grid-two-cols">
            <div className="content">
                <h2 className="header">404</h2>
                <h3>Page not found</h3>
                <p>Oops! Somthing went wrong.</p>
                <div className="btns">
                    <NavLink to="/"> Redirect to home page</NavLink>
                    <br/>
                    <NavLink to="/contact"> Report problem</NavLink>
                </div>
            </div>
            <img src="" alt="" />
            </div>
        </section>
        
        </>
    )
}