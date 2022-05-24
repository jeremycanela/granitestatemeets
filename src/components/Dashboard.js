// Dependencies
import { useState, useEffect, useContext } from 'react';

// Components
import { UserContext } from './Context';
import Cover from './Cover';
import PhotoUpload from './PhotoUpload';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faSpinner, faCalendarDay, faClock, faLocationDot, faBullhorn, faLock, faArrowRightFromBracket, faUserShield, faBars } from '@fortawesome/free-solid-svg-icons';

// Images
import logo from '../images/logo.png';

const Dashboard = props => {
	const [currentMeet, setCurrentMeet] = useState({
		title: "",
		announcement: "",
		date: "",
		time: "",
		location: ""
	});
	const [showMeetRequest, setShowMeetRequest] = useState(false);
	const [disableRequest, setDisableRequest] = useState(false);
	const [uploadedLicensePlatePhoto, setUploadedLicensePlatePhoto] = useState();
	const [uploadingLicensePlatePhoto, setUploadingLicensePlatePhoto] = useState(false);
	const [uploadedAdditionalPhoto, setUploadedAdditionalPhoto] = useState();
	const [uploadingAdditionalPhoto, setUploadingAdditionalPhoto] = useState(false);
	const [vehicleModifications, setVehicleModifications] = useState("");
	const [uploadError, setUploadError] = useState(false);
	const [loading, setLoading] = useState(false);

	const user = useContext(UserContext);

	const parseJwtPayload = payload => JSON.parse(atob(payload));

	const formatDate = date => {
		const substr = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		const year = substr[1];
		const month = substr[2];
		const day = substr[3];

		return `${month}/${day}/${year}`;
	};

	const convertTime = time => {
		const substr = time.match(/^(\d{2}):(\d{2}):(\d+)$/);
		let hour = substr[1];
		const minute = substr[2];
		const second = substr[3];
		let period = "AM";


		if(hour === "00") {
			hour = 12;
		} else if(hour === "12") {
			period = "PM";
		} else if(parseInt(hour) > 12) {
			hour = hour - 12;
			period = "PM";
		}

		return `${hour}:${minute} ${period}`;
	};

	const sendPrivateMeetRequest = async () => {
		await fetch(`/api/sendPrivateMeetRequest/${currentMeet.id}`).then(() => {
			setDisableRequest(true);
		});
	};

	const checkPrivateMeetRequestStatus = async meetDetails => {
		return await fetch(`/api/checkPrivateMeetRequestStatus/${meetDetails.id}`).then(async status => {
			const meetRequest = await status.json();
			if(meetRequest.status) {
				setCurrentMeet(meetRequest.meets);
				setShowMeetRequest(false);
			} else {
				setShowMeetRequest(true);
			}

			return meetRequest;
		});
	};

	const getCurrentMeet = async () => {
		setLoading(true);
		await fetch("/api/getCurrentMeet").then(async response => {
			const meetDetails = await response.json();

			if(meetDetails.privateMeet) {
				setCurrentMeet({id: meetDetails.id});
			
				const status = await checkPrivateMeetRequestStatus(meetDetails);
				
				if(!status.error && status.status) {
					setShowMeetRequest(false);
					setCurrentMeet(meetDetails);
				} else if(!status.error && !status.status) {
					setDisableRequest(true);
					setShowMeetRequest(true);
				} else if(status.error) {
					setDisableRequest(false);
				}
				
			} else {
				setCurrentMeet(meetDetails);
			}

			setLoading(false);
		});
	};

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
			setUploadError("The file format uploaded is invalid. Please upload a image file and try again.");
		}
	};

	const handlePhotoSubmit = e => {
		e.preventDefault();
		setUploadError(false);

		if(!uploadedLicensePlatePhoto || !uploadedAdditionalPhoto) {
			setUploadError("Please upload 2 photos of your vehicle and try again.");
		} else {
			console.log(uploadedAdditionalPhoto)
			const vehiclePhoto = uploadedLicensePlatePhoto.filePath;
			const additionalVehiclePhoto = uploadedAdditionalPhoto.filePath;
			
			fetch("/api/updateUserVehiclePhoto", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({id: user.details.id, vehiclePhoto, vehicleModifications, additionalVehiclePhoto})
			}).then(async response => {
				props.updateLoginStatus(await response.json());
			}).catch(() => {
				setUploadError("An unexpected error has occurred. Please try again.");
			});
		}
	};

	useEffect(() => {
		setVehicleModifications(user.details.vehicleModifications);

		let checkVerification = null;

		if(!user.details.verified || user.details.denied) {
			
			checkVerification = setInterval(async () => {
				
				const response = await fetch("/api/checkVerification").then(async res => await res.json());
				
				if(response.token && !response.error) {
					const details = parseJwtPayload(response.token.split(".")[1]);

                    props.updateLoginStatus(details);
                    getCurrentMeet();
                    clearInterval(checkVerification);
				} else if(response.denied) {
					user.details.denied = response.denied;
					props.updateLoginStatus(user.details);
				}
			}, 10000);
		} else {
			getCurrentMeet();
		}

		return () => clearInterval(checkVerification);
	}, []);

	return(
		<>
			<Cover page="Dashboard" updateLoginStatus={props.updateLoginStatus} />
			<div id="content">
				<div className="logo">
					<img src={logo} alt="Granite State Meets Logo" />
				</div>
				{
					user.details.verified ?
						showMeetRequest ?
							<div className="container">
								<div className="privateMeet">
									<FontAwesomeIcon icon={faLock} className="privateMeetAnimation" size="5x" />
									<h1>Limited Private Meet</h1>
									<p>Please send a request. You will need to be approved to view the details.</p>
									<button className="blueBtnSm" onClick={sendPrivateMeetRequest} disabled={disableRequest ? true : false}>{disableRequest ? "Request Sent" : "Send Request"}</button>
								</div>
							</div>
						:
							loading ?
								<h3 className="loading"><FontAwesomeIcon icon={faSpinner} className="loadingAnimation" size="3x" /><br />Loading</h3>
							:
								currentMeet.id &&
									<>
										<div className="container">
											<h1 className="meetTitle">{currentMeet.title}</h1>
											{currentMeet.privateMeet && <h5 style={{textTransform: "uppercase", color: "#990000", marginBottom: "30px"}}><FontAwesomeIcon icon={faLock} size="xs" style={{marginRight: "15px"}} />Private Meet</h5>}
										</div>


										<div className="section">
											<div className="container flexbox">
												<div className="title"><FontAwesomeIcon icon={faCalendarDay} /><span>Date</span></div>
												<p>{currentMeet.date && formatDate(currentMeet.date)}</p>
											</div>
										</div>

										<div className="section">
											<div className="container flexbox">
												<div className="title"><FontAwesomeIcon icon={faClock} /><span>Time</span></div>
												<p>{currentMeet.time && convertTime(currentMeet.time)} - {currentMeet.endTime && convertTime(currentMeet.endTime)}</p>
											</div>
										</div>

										<div className="section">
											<div className="container">
												<div className="title"><FontAwesomeIcon icon={faLocationDot} /><span>Location</span></div>
												<p style={{whiteSpace: "pre-wrap", marginTop: "15px"}}>{currentMeet.location}</p>
											</div>
										</div>

										{ currentMeet.backupLocation && 
											<div className="section">
												<div className="container">
													<div className="title"><FontAwesomeIcon icon={faLocationDot} /><span>Backup Location</span></div>
													<p style={{whiteSpace: "pre-wrap", marginTop: "15px"}}>{currentMeet.backupLocation}</p>
												</div>
											</div>
										}

										<div className="section">
											<div className="container">
												<div className="title"><FontAwesomeIcon icon={faBullhorn} /><span>Announcement</span></div>
												<p style={{whiteSpace: "pre-wrap", marginTop: "15px"}}>{currentMeet.announcement}</p>
											</div>
										</div>
									</>
					:
						user.details.denied ?
							<div className="container">
								<div className="declined">
									<FontAwesomeIcon icon={faTriangleExclamation} className="deniedAnimation" size="5x" />
									<h1>Your account has been denied.</h1>
									<p>Uh oh! Unfortunately your account has been denied because the vehicle photo you submitted does not display your license plate number properly or it does not meet our audience's standards. Please resubmit a photo below and we will review it shortly.</p>
									<form onSubmit={handlePhotoSubmit}>
										<PhotoUpload handlePhotoUpload={handleLicensePlatePhotoUpload} handleUploadError={handleUploadError} uploadedPhoto={uploadedLicensePlatePhoto} uploadingPhoto={uploadingLicensePlatePhoto} setUploadingPhoto={setUploadingLicensePlatePhoto} licensePlate={true} />
										<PhotoUpload handlePhotoUpload={handleAdditionalPhotoUpload} handleUploadError={handleUploadError} uploadedPhoto={uploadedAdditionalPhoto} uploadingPhoto={uploadingAdditionalPhoto} setUploadingPhoto={setUploadingAdditionalPhoto} />
										<div className="textarea">
											<textarea placeholder="List vehicle modifications (if applicable)" style={{width: "300px", height: "200px"}} value={vehicleModifications ? vehicleModifications : ""} onChange={e => setVehicleModifications(e.target.value)}></textarea>
										</div>
										{
											uploadError ? <p><strong className="redText">{uploadError}</strong></p> : null
										}
										<button className="blueBtnSm" style={{marginTop: "15px"}} type="submit">Submit</button>
									</form>
								</div>
							</div>
						:
							<div className="container">
								<div className="pending">
									<FontAwesomeIcon icon={faTriangleExclamation} className="pendingAnimation" size="5x" />
									<h1>Your account verification is pending</h1>
									<p>Thank you for registering! We will verify your account shortly.</p>
									<p><FontAwesomeIcon icon={faSpinner} className="loadingAnimation" />Waiting for verification...</p>
								</div>
							</div>

				}
			</div>
		</>
	);
};

export default Dashboard;