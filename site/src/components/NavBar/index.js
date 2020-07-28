import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import Hambuger from "../../assets/icons/Hambuger";
import { useSelector } from "react-redux";
import "./style.scss";

const links = [
  { title: "Login", link: "/signin" },
  { title: "Get Started", link: "/signup", classname: " nav_btn" },
  { title: "Dashboard", link: "/dashboard", classname: " nav_btn" },
];

const NavBar = () => {
  const [checked, setChecked] = useState(false);
  const user = useSelector((state) => state.auth.user);

  console.log(user);

  const navRef = useRef();
  const currentScroll = useRef();

  const close = useCallback(() => {
    setChecked(false);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", close);

    let reqId;

    const scroll =
      window.requestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };

    const loop = () => {
      if (currentScroll.current !== window.scrollY) {
        currentScroll.current = window.scrollY;

        if (currentScroll.current > 50) {
          navRef.current.classList.add("slide-down");
        } else {
          navRef.current.classList.remove("slide-down");
        }
      }

      reqId = scroll(loop);
    };
    loop();
    return () => {
      window.cancelAnimationFrame(reqId);
      window.removeEventListener("scroll", close);
    };
  }, [currentScroll, navRef, close]);

  return (
    <header className="nav-bar" ref={navRef}>
      <nav className="main-nav container flex-row">
        <Link to="/" className="logo">
          <img src={logo} alt="" className="img contain" />
        </Link>
        <div className="nav-collapse flex-row j-end">
          <label className="burger" htmlFor="input-nav">
            <Hambuger width="20px" height="20px" open={checked} />
          </label>

          <input
            type="checkbox"
            id="input-nav"
            value={checked}
            onChange={() => setChecked(!checked)}
          />

          <div className={`contents flex-row j-end${checked ? " open" : ""}`}>
            <div className="l_s">
              {!!user ? (
                <div className="lin_con flex-row">
                  <NavLink
                    to={links[2].link}
                    className={`links${links[2].classname || ""}`}
                    activeClassName="link_active"
                    as="div"
                  >
                    {links[2].title}
                  </NavLink>
                </div>
              ) : (
                <>
                  {links.slice(0, 2).map((link, i) => (
                    <div className="lin_con" key={`sublink_${i}`}>
                      <NavLink
                        to={link.link}
                        className={`links${link.classname || ""}`}
                        activeClassName="link_active"
                        as="div"
                      >
                        {link.title}
                      </NavLink>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
