// Components
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import WelcomePhoto from './WelcomePhoto';
import Rules from './Rules';

// Images
import logo from '../images/logo.png';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAt, faQuestion } from '@fortawesome/free-solid-svg-icons';

const ForgotPassword = props => {
	const [email, setEmail] = useState();
	const [securityQuestion, setSecurityQuestion] = useState();
	const [formError, setFormError] = useState(null);

	const securityAnswerRef = useRef();

	const navigate = useNavigate();

	const handleFormSubmit = e => {
		e.preventDefault();
		setFormError(null);

		if(email && !securityQuestion) {
			fetch(`/api/checkUserEmail/${email.toLowerCase()}`).then(async response => {
				const user = await response.json();

				if(user.securityQuestion) {
					setSecurityQuestion(user.securityQuestion);
				} else if(user.error) {
					setFormError(user.message);
				} else {
					setFormError("A security question is not set up for this account. Please contact us via Facebook.")
				}
			});
		} else if(email && securityQuestion) {
			const securityAnswer = securityAnswerRef.current.value;

			fetch(`/api/checkSecurityAnswer`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({email: email.toLowerCase(), securityAnswer})
			}).then(async res => {
				const response = await res.json();

				if(response.error) {
					setFormError(response.message);
				} else if(response.token) {
					navigate(`/forgotPassword/${response.path}`);
				}
			});
		} else if(!email && !securityQuestion) {
			setFormError("Please enter an email and try again.");
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
						<h4 className="grayHeader">Forgot password</h4>
						<h2>Granite State Meets</h2>

						<form onSubmit={handleFormSubmit}>
							{
								!securityQuestion ?
									<div className="input">
										<FontAwesomeIcon icon={faAt} color="#d4d4d4" size="lg" />
										<input type="email" placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
									</div>
								:
									<>
										<label htmlFor="securityAnswer">{securityQuestion}</label>
										<div className="input">
											<FontAwesomeIcon icon={faQuestion} color="#d4d4d4" size="lg" />
											<input type="password" placeholder="Answer" id="securityAnswer" ref={securityAnswerRef} />
										</div>
									</>
							}

							{
								formError ? <p><strong className="redText">{formError}</strong></p> : null
							}
							
							<div className="button">
								<button className="redBtn">Submit</button>
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

export default ForgotPassword;