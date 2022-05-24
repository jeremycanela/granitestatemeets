// Dependencies
import { useState, useRef, useEffect } from 'react';
import { Form, FloatingLabel, Row, Col, Button, Toast } from 'react-bootstrap'; 

// Components
import Navigation from './Navigation';

const EditMeet = props => {
	const [currentMeet, setCurrentMeet] = useState({
		title: "",
		date: "",
		time: "",
		location: "",
		announcement: "",
		privateMeet: false,
		limit: "",
		backupLocation: "",
		endTime: ""
	});
	const [successConfirmation, setSuccessConfirmation] = useState(false);
	const [formError, setFormError] = useState(false);

	const titleRef = useRef();
	const dateRef = useRef();
	const timeRef = useRef();
	const endTimeRef = useRef();
	const locationRef = useRef();
	const announcementRef = useRef();
	const privateMeetRef = useRef();
	const limitRef = useRef();
	const backupLocationRef = useRef();

	const getCurrentMeet = () => {
		fetch("/api/getCurrentMeet").then(async response => {
			const meetDetails = await response.json();
			if(!meetDetails.limit) {
				meetDetails.limit = "";
			}

			setCurrentMeet(meetDetails);
		});
	};

	const handleMeetUpdate = e => {
		e.preventDefault();

		const title = titleRef.current.value;
		const date = dateRef.current.value;
		const time = timeRef.current.value;
		const endTime = endTimeRef.current.value;
		const location = locationRef.current.value;
		const announcement = announcementRef.current.value;
		const privateMeet = privateMeetRef.current.checked;
		const limit = limitRef.current ? parseInt(limitRef.current.value) : null;
		const backupLocation = backupLocationRef.current.value || null;


		fetch("/api/updateMeet", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({id: currentMeet.id, title, date, time, location, announcement, privateMeet, limit, backupLocation, endTime})
		}).then(async response => {
			if(response.status === 200) {
				setSuccessConfirmation(true);

				getCurrentMeet();
			} else {
				setFormError(true);
			}
		}).catch(() => {
			setFormError(true);
		});
	};

	useEffect(() => {
		getCurrentMeet();
	}, []);

	return(
		<div id="adminContainer">
			<Navigation updateLoginStatus={props.updateLoginStatus} />
			<h2 className="pageTitle">Edit Meet</h2>
			<Form onSubmit={handleMeetUpdate}>
				<FloatingLabel controlId="title" label="Title" className="mb-3">
					<Form.Control type="text" placeholder="Title" value={currentMeet.title} onChange={e => setCurrentMeet(prevState => ({...prevState, title: e.target.value}))} ref={titleRef} required />
				</FloatingLabel>

				<FloatingLabel controlId="date" label="Date" className="mb-3">
					<Form.Control type="date" placeholder="Date" value={currentMeet.date} onChange={e => setCurrentMeet(prevState => ({...prevState, date: e.target.value}))} ref={dateRef} required />
				</FloatingLabel>

				<Row>
					<Col>
						<FloatingLabel controlId="time" label="Start time" className="mb-3">
							<Form.Control type="time" placeholder="Start time" value={currentMeet.time} onChange={e => setCurrentMeet(prevState => ({...prevState, time: e.target.value}))} ref={timeRef} required />
						</FloatingLabel>
					</Col>
					<Col>
						<FloatingLabel controlId="endTime" label="End time" className="mb-3">
							<Form.Control type="time" placeholder="End time" value={currentMeet.endTime} onChange={e => setCurrentMeet(prevState => ({...prevState, endTime: e.target.value}))} ref={endTimeRef} required />
						</FloatingLabel>
					</Col>
				</Row>

				<FloatingLabel controlId="location" label="Location" className="mb-3">
					<Form.Control
						as="textarea"
						style={{height: "100px"}}
						placeholder="Location"
						value={currentMeet.location}
						onChange={e => setCurrentMeet(prevState => ({...prevState, location: e.target.value}))}
						ref={locationRef}
						required />
				</FloatingLabel>

				<FloatingLabel controlId="backupLocation" label="Backup location" className="mb-3">
					<Form.Control
						as="textarea"
						style={{height: "100px"}}
						placeholder="Backup location"
						value={currentMeet.backupLocation ? currentMeet.backupLocation : ""}
						onChange={e => setCurrentMeet(prevState => ({...prevState, backupLocation: e.target.value}))}
						ref={backupLocationRef} />
				</FloatingLabel>

				<FloatingLabel controlId="announcement" label="Announcement" className="mb-3">
					<Form.Control
						as="textarea"
						style={{height: "200px"}}
						placeholder="Announcement"
						value={currentMeet.announcement}
						onChange={e => setCurrentMeet(prevState => ({...prevState, announcement: e.target.value}))}
						ref={announcementRef}
						required />
				</FloatingLabel>

				<Form.Check type="radio" id="publicMeet" label="Public Meet" name="meetType" checked={!currentMeet.privateMeet && true} onChange={() => setCurrentMeet(prevState => ({...prevState, privateMeet: false}))} />
				<Form.Check type="radio" id="privateMeet" label="Private Meet" name="meetType" checked={currentMeet.privateMeet && true} onChange={() => setCurrentMeet(prevState => ({...prevState, privateMeet: true}))} ref={privateMeetRef} />
			
				{	currentMeet.privateMeet &&
					<FloatingLabel controlId="limit" label="Limit" className="mb-3">
						<Form.Control type="number" style={{margin: "16px 0"}} placeholder="Limit" value={currentMeet.limit && currentMeet.limit} onChange={e => setCurrentMeet(prevState => ({...prevState, limit: e.target.value}))} ref={limitRef} required />
					</FloatingLabel>
				}

				<Button variant="primary" size="lg" style={{marginTop: "15px"}} type="submit">Update</Button>
			</Form>

			<Toast show={successConfirmation} onClose={() => setSuccessConfirmation(false)} delay={5000} autohide bg="success" style={{position: "fixed", bottom: "20px", right: "20px"}}>
				<Toast.Header>
					<strong className="me-auto">Success!</strong>
				</Toast.Header>
				<Toast.Body style={{color: "#fff"}}>The meet information has been updated.</Toast.Body>
			</Toast>

			<Toast show={formError} onClose={() => setFormError(false)} delay={5000} autohide bg="danger" style={{position: "fixed", bottom: "20px", right: "20px"}}>
				<Toast.Header>
					<strong className="me-auto">Error</strong>
				</Toast.Header>
				<Toast.Body style={{color: "#fff"}}>An unexpected error has occurred. Please try again.</Toast.Body>
			</Toast>
		</div>
	)
};

export default EditMeet;