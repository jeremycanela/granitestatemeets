// Components
import { useContext, useState, useRef, useEffect } from 'react';
import Cover from './Cover';
import { UserContext } from './Context';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAt, faKey, faCarRear } from '@fortawesome/free-solid-svg-icons';

// Images
import logo from '../images/logo.png';

const AccountSettings = props => {
	const user = useContext(UserContext);
	const [email, setEmail] = useState(user.details.email);
	const [emailError, setEmailError] = useState();
	const [emailSuccess, setEmailSuccess] = useState();

	const [passwordError, setPasswordError] = useState();
	const [passwordSuccess, setPasswordSuccess] = useState();

	const [licensePlates, setLicensePlates] = useState();
	const [additionalLicensePlateError, setAdditionalLicensePlateError] = useState();
	const [additionalLicensePlateSuccess, setAdditionalLicensePlateSuccess] = useState();

	const passwordChangeFormRef = useRef();
	const currentPasswordRef = useRef();
	const newPasswordRef = useRef();
	const confirmNewPasswordRef = useRef();

	const additionalLicensePlateRef = useRef();
	const additionalLicensePlateFormRef = useRef();

	const handleEmailChange = e => {
		e.preventDefault();
		setEmailError(null);
		setEmailSuccess(null);

		if(!email || !email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
			setEmailError("Please enter a valid email and try again.");
		} else {
			fetch("/api/updateUserEmail", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({email: email.toLowerCase()})
			}).then(async response => {
				const updatedUser = await response.json();

				if(!updatedUser.error && updatedUser.email) {
					setEmailSuccess("Your email has been updated!");
					props.updateLoginStatus(updatedUser);
				} else {
					setEmailError(updatedUser.message);
				}
			}).catch(() => {
				setEmailError("An unexpected error has occurred. Please try again.")
			});
		}
	};

	const handlePasswordChange = e => {
		e.preventDefault();
		setPasswordError(null);
		setPasswordSuccess(null);

		const currentPassword = currentPasswordRef.current.value;
		const newPassword = newPasswordRef.current.value;
		const confirmNewPassword = confirmNewPasswordRef.current.value;

		if(!currentPassword || !newPassword || !confirmNewPassword) {
			setPasswordError("Please fill in all the fields and try again.");
		} else if(newPassword !== confirmNewPassword) {
			setPasswordError("Please enter matching new passwords and try again.")
		} else {
			fetch("/api/updateLoggedUserPassword", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({currentPassword, newPassword})
			}).then(async res => {
				const response = await res.json();
				if(!response.error) {
					passwordChangeFormRef.current.reset();
					setPasswordSuccess("Your password has been updated!");
				} else {
					setPasswordError(response.message);
				}				
			}).catch(() => {
				setPasswordError("An unexpected error has occurred. Please try again.");
			});
		}
	};

	const generateUserLicensePlates = async () => {
		return await fetch("/api/getUserLicensePlates").then(async response => {
			const licensePlates = await response.json();
			const licensePlatesHTML = [];

			licensePlates.forEach(licensePlate => {
				licensePlatesHTML.push(
					<div className="section" key={licensePlate}>
						<div className="container flexbox">
							<div className="title"><FontAwesomeIcon icon={faCarRear} /><span>License Plate</span></div>
							<p>{licensePlate}</p>
						</div>
					</div>
				);
			});

			setLicensePlates(licensePlatesHTML);
		}).catch(error => console.error(error));
	};

	const handleAdditionalLicensePlate = e => {
		e.preventDefault();
		setAdditionalLicensePlateError(null);
		setAdditionalLicensePlateSuccess(null);
		const additionalLicensePlate = additionalLicensePlateRef.current.value;

		if(!additionalLicensePlate || additionalLicensePlate.length < 2 || additionalLicensePlate.length > 7) {
			setAdditionalLicensePlateError("Please enter a valid license plate number.");
		} else {
			fetch("/api/checkLicensePlate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({additionalLicensePlate})
			}).then(async res => {
				const response = await res.json();

				if(response.error) {
					setAdditionalLicensePlateError(response.message);
				} else {
					fetch("/api/addLicensePlate", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({additionalLicensePlate})
					}).then(async res => {
						const response = await res.json();

						if(response.errors || response.name === "SequelizeUniqueConstraintError") {
							setAdditionalLicensePlateError("The license plate entered is already in use.");
						} else {
							additionalLicensePlateFormRef.current.reset();
							generateUserLicensePlates();
							setAdditionalLicensePlateSuccess("License plate added!");
						}
					}).catch(() => {
						setAdditionalLicensePlateError("An unexpected error has occurred. Please try again.");
					});
				}
			});			
		}
	};

	useEffect(() => {
		generateUserLicensePlates();
	}, []);

	return(
		<>
			<Cover page="Account Settings" updateLoginStatus={props.updateLoginStatus} />
			<div id="content">
				<div className="logo">
					<img src={logo} alt="Granite State Meets Logo" />
				</div>

					<div className="section">
						<div className="container">
							<form onSubmit={handleEmailChange}>
								<label htmlFor="email" className="grayHeader">Email</label>
								<div className="input">
									<FontAwesomeIcon icon={faAt} color="#d4d4d4" size="lg" />
									<input type="email" id="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
								</div>

								{
									emailError && <p style={{fontSize: "1rem", marginBottom: "15px"}}><strong className="redText">{emailError}</strong></p>
								}
								{
									emailSuccess && <p style={{fontSize: "1rem", marginBottom: "15px"}}><strong className="greenText">{emailSuccess}</strong></p>
								}

								<div className="button">
									<button type="submit" className="redBtn">Save</button>
								</div>
							</form>
						</div>
					</div>
					<div className="section">
						<div className="container">
							<form onSubmit={handlePasswordChange} ref={passwordChangeFormRef}>
								<label htmlFor="currentPassword" className="grayHeader">Password</label>
								<div className="input">
									<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
									<input type="password" id="currentPassword" placeholder="Current Password" ref={currentPasswordRef} />
								</div>
								<div className="input">
									<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
									<input type="password" placeholder="New Password" ref={newPasswordRef} />
								</div>
								<div className="input">
									<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
									<input type="password" placeholder="Confirm New Password" ref={confirmNewPasswordRef} />
								</div>

								{
									passwordError && <p style={{fontSize: "1rem", marginBottom: "15px"}}><strong className="redText">{passwordError}</strong></p>
								}
								{
									passwordSuccess && <p style={{fontSize: "1rem", marginBottom: "15px"}}><strong className="greenText">{passwordSuccess}</strong></p>
								}

								<div className="button">
									<button type="submit" className="redBtn">Save</button>
								</div>
							</form>
						</div>
					</div>

					{ user.details.verified && 
						<>
						<div className="section">
							<div className="container">
								<form onSubmit={handleAdditionalLicensePlate} ref={additionalLicensePlateFormRef}>
									<label htmlFor="additionalLicensePlate" className="grayHeader">Add Vehicle</label>
									<div className="input">
										<FontAwesomeIcon icon={faKey} color="#d4d4d4" size="lg" />
										<input type="text" id="additionalLicensePlate" placeholder="Additional License Plate" ref={additionalLicensePlateRef} />
									</div>

									{
										additionalLicensePlateError && <p style={{fontSize: "1rem", marginBottom: "15px"}}><strong className="redText">{additionalLicensePlateError}</strong></p>
									}
									{
										additionalLicensePlateSuccess && <p style={{fontSize: "1rem", marginBottom: "15px"}}><strong className="greenText">{additionalLicensePlateSuccess}</strong></p>
									}

									<div className="button">
										<button type="submit" className="redBtn">Add</button>
									</div>
								</form>
								
							</div>
						</div>

							{licensePlates}
						</>
					}

			</div>
		</>
	);
};

export default AccountSettings;