// Components
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WelcomePhoto from './WelcomePhoto';
import Rules from './Rules';

// Images
import logo from '../images/logo.png';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAt, faKey } from '@fortawesome/free-solid-svg-icons';

const SignIn = props => {
	const [signInError, setSignInError] = useState();

	let navigate = useNavigate();

	const emailOrLicensePlateRef = useRef();
	const passwordRef = useRef();
	const rememberMeRef = useRef();

	const parseJwtPayload = payload => JSON.parse(atob(payload));

	const handleSignIn = async e => {
		e.preventDefault();
		setSignInError(null);

		const emailOrLicensePlate = emailOrLicensePlateRef.current.value.toLowerCase();
		const password = passwordRef.current.value;
		const rememberMe = rememberMeRef.current.checked;

		if(!emailOrLicensePlate || !password) {
			setSignInError("Please fill in all the fields and try again.")
		} else {
			fetch("/api/authenticateUser", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({emailOrLicensePlate, password, rememberMe})
			}).then(async res => {
				const response = await res.json();
				
				if(response.error) {
					setSignInError(response.message);
				} else if(response.token) {
					const details = parseJwtPayload(response.token.split(".")[1]);
                    props.updateLoginStatus(details);
                    navigate("/dashboard");
				}
			}).catch(error => {
				console.error(error);
			});

		}
	};

	return(
		<>
			<div className="flexbox">
				<div className="signInContainer">
					<div className="signInForm">
						<div className="logo">
							<img src={logo} alt="Granite State Meets" />
						</div>
						<h4 className="grayHeader">Sign in</h4>
						<h2>Granite State Meets</h2>

						<form onSubmit={handleSignIn}>
							<div className="input">
								<FontAwesomeIcon icon={faAt} color="#d4d4d4" size="lg" />
								<input type="text" placeholder="E-mail or License Plate Number" ref={emailOrLicensePlateRef} />
							</div>
							<div className="input">
								<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
								<input type="password" placeholder="Password" ref={passwordRef} />
							</div>
							{
								signInError ? <p><strong className="redText">{signInError}</strong></p> : null
							}
							<Link to="/forgotPassword" className="forgotPassword">Forgot password?</Link>
							<div className="input" style={{marginTop: "15px"}}>
								<input type="checkbox" id="rememberMe" ref={rememberMeRef} /><label htmlFor="rememberMe">Remember me</label>
							</div>
							<div className="button">
								<button className="redBtn">Sign In</button>
							</div>
							<h6 className="grayHeader" style={{margin: "10px 0"}}>Sign up to gain access to our future meets!</h6>
							<Link to="/signup">
								<div className="button grayBtn">Sign Up</div>
							</Link>
						</form>
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

export default SignIn;