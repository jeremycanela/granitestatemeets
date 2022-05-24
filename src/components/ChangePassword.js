// Dependencies
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

// Components
import WelcomePhoto from './WelcomePhoto';
import Rules from './Rules';

// Images
import logo from '../images/logo.png';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';

const ChangePassword = props => {
	const [passwordError, setPasswordError] = useState();
	const [passwordSuccess, setPasswordSuccess] = useState();

	const parseJwtPayload = payload => JSON.parse(atob(payload));
    const payload = Cookies.get("forgotPasswordHP") ? parseJwtPayload(Cookies.get("forgotPasswordHP").split(".")[1]) : null;
    const details = Cookies.get("forgotPasswordHP") ? payload : null;

	const passwordChangeFormRef = useRef();
	const newPasswordRef = useRef();
	const confirmNewPasswordRef = useRef();

	const navigate = useNavigate();

	const { path } = useParams();

	const handlePasswordChange = e => {
		e.preventDefault();
		setPasswordError(null);
		setPasswordSuccess(null);

		const newPassword = newPasswordRef.current.value;
		const confirmNewPassword = confirmNewPasswordRef.current.value;

		if(!newPassword || !confirmNewPassword) {
			setPasswordError("Please fill in all the fields and try again.");
		} else if(newPassword !== confirmNewPassword) {
			setPasswordError("Please enter matching new passwords and try again.")
		} else {
			fetch("/api/updateForgottenUserPassword", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({userId: details.userId, newPassword})
			}).then(async res => {
				const response = await res.json();

				if(!response.error) {
					passwordChangeFormRef.current.reset();
					setPasswordSuccess("Your password has been updated! Please sign in.");
				} else {
					setPasswordError(response.message);
				}				
			}).catch(() => {
				setPasswordError("An unexpected error has occurred. Please try again.");
			});
		}
	};

	useEffect(() => {
		fetch(`/api/checkForgotPasswordLink/${path}`).then(async res => {
			const response = await res.json();

			if(details.path !== response.path) {
				navigate("/");
			}
		}).catch(() => {
			navigate("/");
		});
	}, []);

	return(
		<>
			<div className="flexbox">
				<div className="signInContainer">
					<div className="signInForm">
						<div className="logo">
							<img src={logo} alt="Granite State Meets" />
						</div>
						<h4 className="grayHeader">Forgot password</h4>
						<h2>Granite State Meets</h2>

						<form onSubmit={handlePasswordChange} ref={passwordChangeFormRef}>
							<div className="input">
								<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
								<input type="password" placeholder="New Password" ref={newPasswordRef} />
							</div>
							<div className="input">
								<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
								<input type="password" placeholder="Confirm New Password" ref={confirmNewPasswordRef} />
							</div>

							{
								passwordError ? <p><strong className="redText">{passwordError}</strong></p> : null
							}

							{
								passwordSuccess ? <p><strong className="greenText">{passwordSuccess}</strong></p> : null
							}
							
							<div className="button">
								<button className="redBtn" type="submit">Submit</button>
							</div>
						</form>

						<h6 className="grayHeader" style={{margin: "10px 0"}}>Sign up to gain access to our future meets!</h6>
						<Link to="/">
							<div className="button grayBtn">Sign In</div>
						</Link>
						<Link to="/signup">
							<div className="button grayBtn">Sign Up</div>
						</Link>
						<div className="button">
							<button className="rules" onClick={() => props.updateViewingRules(true)}>Granite State Meets Rules</button>
						</div>
					</div>
				</div>
				<WelcomePhoto />
			</div>
			<Rules
				viewingRules={props.viewingRules}
	            updateViewingRules={props.updateViewingRules}
	        />
        </>
	);
};

export default ChangePassword;