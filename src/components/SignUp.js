// Components
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WelcomePhoto from './WelcomePhoto';
import Rules from './Rules';
import ReCAPTCHA from 'react-google-recaptcha';
import PhotoUpload from './PhotoUpload';
import { reCAPTCHASiteKey } from '../api_config';

// Images
import logo from '../images/logo.png';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faAt, faKey, faIdCard, faUpload, faCircleInfo, faChevronDown, faQuestion } from '@fortawesome/free-solid-svg-icons';

let reCAPTCHAResponse = {};

const SignUp = props => {
	const [uploadedLicensePlatePhoto, setUploadedLicensePlatePhoto] = useState();
	const [uploadedAdditionalPhoto, setUploadedAdditionalPhoto] = useState();
	const [registrationError, setRegistrationError] = useState(null);
	const [uploadingLicensePlatePhoto, setUploadingLicensePlatePhoto] = useState(false);
	const [uploadingAdditionalPhoto, setUploadingAdditionalPhoto] = useState(false);
	const [loading, setLoading] = useState(false);

	let navigate = useNavigate();
	const parseJwtPayload = payload => JSON.parse(atob(payload));

	const reCAPTCHARef = useRef();	

	const handleReCAPTCHAVerify = token => {
		fetch("/api/verifyReCAPTCHA", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({token})
		}).then(async res => {
			reCAPTCHAResponse = await res.json();
		});
	};

	const fullNameRef = useRef();
	const emailRef = useRef();
	const passwordRef = useRef();
	const confirmPasswordRef = useRef();
	const licensePlateRef = useRef();
	const vehiclePhotoRef = useRef();
	const vehicleModificationsRef = useRef();
	const securityQuestionRef = useRef();
	const securityAnswerRef = useRef();
	const securityConfirmAnswerRef = useRef();
	const agreeToRulesRef = useRef();

	const handleLicensePlatePhotoUpload = res => {
		setUploadedLicensePlatePhoto(res);
		setUploadingLicensePlatePhoto(true);
	};

	const handleAdditionalPhotoUpload = res => {
		setUploadedAdditionalPhoto(res);
		setUploadingAdditionalPhoto(true);
	};

	const handleUploadError = () => {
		if(!uploadedLicensePlatePhoto.fileId || !uploadedAdditionalPhoto.fileId) {
			setRegistrationError("The file format uploaded is invalid. Please upload a image file and try again.");
		}
	};

	const handleRegistration = async e => {
		e.preventDefault();
		setLoading(true);
		setRegistrationError(null);

		const fullName = fullNameRef.current.value;
		const email = emailRef.current.value.toLowerCase();
		const password = passwordRef.current.value;
		const confirmPassword = confirmPasswordRef.current.value;
		const licensePlate = licensePlateRef.current.value.toLowerCase();
		const vehicleModifications = vehicleModificationsRef.current.value || null;
		const securityQuestion = securityQuestionRef.current.value;
		const securityAnswer = securityAnswerRef.current.value;
		const securityConfirmAnswer = securityConfirmAnswerRef.current.value;
		const agreeToRules = agreeToRulesRef.current.checked;

		await fetch("/api/checkAdditionalLicensePlates", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({licensePlate})
		}).then(async res => {
			const response = await res.json();

			if(response.error) {
				setRegistrationError(response.message);
			} else {
				if(	!fullName ||
					!email ||
					!password ||
					!confirmPassword ||
					!licensePlate ||
					!securityQuestion ||
					!securityAnswer ||
					!securityConfirmAnswer) {

					setRegistrationError("Please fill all the fields and try again.");
				} else if(!fullName.match(/^[A-z '-]+$/) || fullName.length > 26) {
					setRegistrationError("Please enter a valid name and try again.");
				} else if(!email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
					setRegistrationError("Please enter a valid email and try again.");
				} else if(password.length < 6) {
					setRegistrationError("Please enter a password containing at least 6 characters and try again.");
				} else if(password !== confirmPassword) {
					setRegistrationError("Please enter matching passwords and try again.");
				} else if(licensePlate.length < 2 || licensePlate.length > 7) {
					setRegistrationError("Please enter a valid license plate number and try again.");
				} else if(!uploadedLicensePlatePhoto) {
					setRegistrationError("Please upload a photo of your vehicle and try again.");
				} else if(securityAnswer !== securityConfirmAnswer) {
					setRegistrationError("Please enter matching security question answers and try again.");
				} else if(!reCAPTCHAResponse.success) {
					setRegistrationError("Please verify you're not a robot and try again.");
				}  else if(!agreeToRules) {
					setRegistrationError("Please agree to the Granite State Meets Rules and try again.");
				} else {
					const vehiclePhoto = uploadedLicensePlatePhoto.filePath;
					const additionalVehiclePhoto = uploadedAdditionalPhoto ? uploadedAdditionalPhoto.filePath : null;
					const ipAddress = await fetch("https://api.ipify.org/?format=json").then(async res => {
						const response = await res.json();
						setLoading(false);
						return response.ip;
					}).catch(() => {
						setRegistrationError("An unexpected error has occurred. Please try again.");
						setLoading(false);
					});

					await fetch("/api/createUser", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({fullName, email, password, licensePlate, vehiclePhoto, vehicleModifications, securityQuestion, securityAnswer, ipAddress, additionalVehiclePhoto})
					}).then(async res => {

						const user = await res.json();
						if(user.errors && user.parent.constraint === "Users_ipAddress_key") {
							setRegistrationError("Your IP Address is registered to an account. Duplicate accounts are forbidden.");
						} else if(user.errors || user.name === "SequelizeUniqueConstraintError") {
							setRegistrationError("The information entered is associated with a registered account. Please sign in.");
						} else if(user.token) {

							const details = parseJwtPayload(user.token.split(".")[1]);
							props.updateLoginStatus(details);
							navigate("/dashboard");
						}

					}).catch(error => {
						setLoading(false);
						setRegistrationError("An unexpected error has occurred. Please try again.");
					});
				}
			}
		});

		if(registrationError) {			
			reCAPTCHARef.current.props.grecaptcha.reset();
			reCAPTCHAResponse = {};
		}

		setLoading(false);
	};

	return(
		<>
			<div className="flexbox">
				<div className="signUpContainer">
					<div className="signUpForm">
						<div className="logo">
							<img src={logo} alt="Granite State Meets" />
						</div>
						<h4 className="grayHeader">Sign up</h4>
						<h2>Granite State Meets</h2>

						<form onSubmit={handleRegistration}>
							<div className="input">
								<FontAwesomeIcon icon={faUser} color="#d4d4d4" size="lg" />
								<input type="text" placeholder="Full Name" ref={fullNameRef} />
							</div>
							<div className="input">
								<FontAwesomeIcon icon={faAt} color="#d4d4d4" size="lg" />
								<input type="email" placeholder="E-mail" ref={emailRef} />
							</div>
							<div className="input">
								<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
								<input type="password" placeholder="Password" ref={passwordRef} />
							</div>
							<div className="input">
								<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
								<input type="password" placeholder="Confirm Password" ref={confirmPasswordRef} />
							</div>

							<div className="input">
								<FontAwesomeIcon icon={faIdCard} color="#d4d4d4" size="lg" />
								<input type="text" placeholder="Vehicle's License Plate Number" ref={licensePlateRef} />
							</div>

							<PhotoUpload handlePhotoUpload={handleLicensePlatePhotoUpload} handleUploadError={handleUploadError} uploadedPhoto={uploadedLicensePlatePhoto} uploadingPhoto={uploadingLicensePlatePhoto} setUploadingPhoto={setUploadingLicensePlatePhoto} licensePlate={true} />

							<PhotoUpload handlePhotoUpload={handleAdditionalPhotoUpload} handleUploadError={handleUploadError} uploadedPhoto={uploadedAdditionalPhoto} uploadingPhoto={uploadingAdditionalPhoto} setUploadingPhoto={setUploadingAdditionalPhoto} />							

							<div className="textarea">
								<textarea placeholder="List vehicle modifications (if applicable)" ref={vehicleModificationsRef}></textarea>
							</div>

							<div className="select">
								<FontAwesomeIcon icon={faChevronDown} color="#d4d4d4" size="lg" />
								<select defaultValue="0" ref={securityQuestionRef}>
									<option value="0" disabled>Security Question</option>
									<option value="What was the name of your first manager at your first job?">What was the name of your first manager at your first job?</option>
									<option value="What was your favorite subject in high school?">What was your favorite subject in high school?</option>
									<option value="What is your employee ID number?">What is your employee ID number?</option>
									<option value="Where did you go on your favorite vacation as a child?">Where did you go on your favorite vacation as a child?</option>
									<option value="What is the name of the road you grew up on?">What is the name of the road you grew up on?</option>
									<option value="What Is your favorite book?">What Is your favorite book?</option>
									<option value="What is the name of the road you grew up on?">What is the name of the road you grew up on?</option>
									<option value="What is your mother’s maiden name?">What is your mother’s maiden name?</option>
									<option value="What was the name of your first/current/favorite pet?">What was the name of your first/current/favorite pet?</option>
									<option value="What was the first company that you worked for?">What was the first company that you worked for?</option>
									<option value="Where did you meet your spouse?">Where did you meet your spouse?</option>
									<option value="Where did you go to high school/college?">Where did you go to high school/college?</option>
									<option value="What is your favorite food?">What is your favorite food?</option>
									<option value="What city were you born in?">What city were you born in?</option>
								</select>
							</div>
							<p className="info"><FontAwesomeIcon icon={faCircleInfo} color="#8d8d8d" size="sm" /> The security question will be used to recover a forgotten password.</p>

							<div className="input">
								<FontAwesomeIcon icon={faQuestion} color="#d4d4d4" size="lg" />
								<input type="password" placeholder="Answer" ref={securityAnswerRef} />
							</div>

							<div className="input">
								<FontAwesomeIcon icon={faQuestion} color="#d4d4d4" size="lg" />
								<input type="password" placeholder="Confirm Answer" ref={securityConfirmAnswerRef} />
							</div>

							<ReCAPTCHA sitekey={reCAPTCHASiteKey} onChange={handleReCAPTCHAVerify} ref={reCAPTCHARef} />

							{
								registrationError ? <p><strong className="redText">{registrationError}</strong></p> : null
							}

							<div className="input">
								<input type="checkbox" id="agreeToRules" ref={agreeToRulesRef} /><label htmlFor="agreeToRules">I agree to the <span className="rules" onClick={() => props.updateViewingRules(true)}>Granite State Meets Rules</span></label>
							</div>

							<div className="button">
								<button className="redBtn" type="submit" disabled={loading ? true : false}>{loading ? "Loading..." : "Sign up"}</button>
							</div>
							<Link to="/">
								<div className="button grayBtn">Sign In</div>
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

export default SignUp;