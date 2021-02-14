import React, { useRef, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useInput from 'Hooks/useInput';
import Input from 'components/Input';
import Button from 'components/Button';
import data from 'data/signIn';
import { axiosInstance } from 'helpers';
import { login } from 'g_actions/user';
import user_icon from 'assets/auth/user_icon.png';
import Social from '../SocialSec';
import '../style.scss';

function Login() {
  const submitButton = useRef();
  const [reviel, setReviel] = useState(false);
  const { addToast } = useToasts();
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const [handleSubmit, handleChange, inputTypes, validateSelf] = useInput({
    inputs: data,
    submitButton,
    cb: async (inputs) => {
      const response = await axiosInstance.post('/user/login', {
        ...inputs,
        email: inputs.email.toLowerCase(),
      });
      addToast(`Welcome back ${response.data.user.firstName}`, {
        appearance: 'success',
        autoDismiss: true,
      });

      const redirectUrl = location?.search?.split('redirect=')[1];

      dispatch(login());
      redirectUrl
        ? history.push(redirectUrl)
        : response.data.user.role === 'admin'
        ? history.push('/admin')
        : history.push('/');
    },
    btnText: {
      loading: 'Logging on...',
      reg: 'Login',
    },
  });

  const revielPassword = (ref) => {
    setReviel(!reviel);
  };

  return (
    <div className="auth_section">
      <div className="reg_text flex-col al-start">
        <h2>
          Login{' '}
          <span role="img" aria-label="key emoji">
            🔑
          </span>
        </h2>

        <div className="w-full flex-row j-space">
          <p>Welcome back</p>
          <img src={user_icon} alt="user" />
        </div>
      </div>
      <form className="form">
        {data.map((form, i) => (
          <Input
            key={`login_form_${i}`}
            name={form.name}
            type={form.type}
            placeHolder={form.placeHolder}
            label={form.label}
            value={inputTypes[form.name]}
            errorMsg={form.errorMsg}
            required={form.required}
            reviel={form.type === 'password' ? reviel : false}
            revielPassword={revielPassword}
            handleChange={handleChange}
            validateSelf={validateSelf}
            attr={form.attr}
          />
        ))}

        <div
          className="externs flex-row j-space light"
          style={{ margin: '-8px 0 20px' }}
        >
          <Link to="/auth/forgot">
            <small>Forgot password?</small>
          </Link>
        </div>

        <div className="btn_sec_sm flex-row j-end">
          <Button
            btnRef={submitButton}
            onClick={handleSubmit}
            className="s_btn flex-row"
            text="Login"
          />{' '}
        </div>
      </form>

      <Social />

      <div className="externs flex-row j-space">
        <small>
          Don't have an account?{' '}
          <Link to="/auth/signup">
            <strong className="theme-color">Sign up</strong>
          </Link>
        </small>
      </div>
    </div>
  );
}

export default Login;
