// Dependencies
import { useState, useRef } from 'react';
import { Form, FloatingLabel, Row, Col, Button, ToastContainer, Toast } from 'react-bootstrap'; 

// Components
import Navigation from './Navigation';

const CreateMeet = props => {
	const [privateMeet, setPrivateMeet] = useState(false);
	const [successConfirmation, setSuccessConfirmation] = useState(false);
	const [formError, setFormError] = useState(false);

	const formRef = useRef();
	const titleRef = useRef();
	const dateRef = useRef();
	const timeRef = useRef();
	const endTimeRef = useRef();
	const locationRef = useRef();
	const backupLocationRef = useRef();
	const announcementRef = useRef();
	const privateMeetRef = useRef();
	const limitRef = useRef();

	const handleCreateMeet = e => {
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
		
		fetch("/api/createMeet", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({title, date, time, location, announcement, privateMeet, limit, backupLocation, endTime})
		}).then(async response => {
			if(response.status === 200) {
				setSuccessConfirmation(true);
				setPrivateMeet(false);
				formRef.current.reset();
			} else {
				setFormError(true);
			}
		}).catch(() => {
			setFormError(true);
		});
	};

	return(
		<div id="adminContainer">
			<Navigation updateLoginStatus={props.updateLoginStatus} />
			<h2 className="pageTitle">Create Meet</h2>
			<Form onSubmit={handleCreateMeet} ref={formRef}>
				<FloatingLabel controlId="title" label="Title" className="mb-3">
					<Form.Control type="text" placeholder="Title" ref={titleRef} required />
				</FloatingLabel>

				<FloatingLabel controlId="date" label="Date" className="mb-3">
					<Form.Control type="date" placeholder="Date" ref={dateRef} required />
				</FloatingLabel>

				<Row>
					<Col>
						<FloatingLabel controlId="time" label="Start time" className="mb-3">
							<Form.Control type="time" placeholder="Start time" ref={timeRef} required />
						</FloatingLabel>
					</Col>
					<Col>
						<FloatingLabel controlId="endTime" label="End time" className="mb-3">
							<Form.Control type="time" placeholder="End time" ref={endTimeRef} required />
						</FloatingLabel>
					</Col>
				</Row>

				<FloatingLabel controlId="location" label="Location" className="mb-3">
					<Form.Control as="textarea" style={{height: "100px"}} placeholder="Location" ref={locationRef} required />
				</FloatingLabel>

				<FloatingLabel controlId="backupLocation" label="Backup location" className="mb-3">
					<Form.Control as="textarea" style={{height: "100px"}} placeholder="Backup location" ref={backupLocationRef} />
				</FloatingLabel>

				<FloatingLabel controlId="announcement" label="Announcement" className="mb-3">
					<Form.Control as="textarea" style={{height: "200px"}} placeholder="Announcement" ref={announcementRef} required />
				</FloatingLabel>

				<Form.Check type="radio" id="publicMeet" label="Public Meet" name="meetType" checked={!privateMeet && true} onChange={() => setPrivateMeet(false)} />
				<Form.Check type="radio" id="privateMeet" label="Private Meet" name="meetType" checked={privateMeet && true} onChange={() => setPrivateMeet(true)} ref={privateMeetRef} />
			
				{	privateMeet &&
					<FloatingLabel controlId="limit" label="Limit" className="mb-3">
						<Form.Control type="number" style={{margin: "16px 0"}} placeholder="Limit" ref={limitRef} required />
					</FloatingLabel>
				}

				<Button variant="primary" size="lg" style={{marginTop: "15px"}} type="submit">Create</Button>
			</Form>

			<Toast show={successConfirmation} onClose={() => setSuccessConfirmation(false)} delay={5000} autohide bg="success" style={{position: "fixed", bottom: "20px", right: "20px"}}>
				<Toast.Header>
					<strong className="me-auto">Success!</strong>
				</Toast.Header>
				<Toast.Body style={{color: "#fff"}}>A new meet has been created.</Toast.Body>
			</Toast>

			<Toast show={formError} onClose={() => setFormError(false)} bg="danger" style={{position: "fixed", bottom: "20px", right: "20px"}}>
				<Toast.Header>
					<strong className="me-auto">Error</strong>
				</Toast.Header>
				<Toast.Body style={{color: "#fff"}}>An unexpected error has occurred. Please try again.</Toast.Body>
			</Toast>			
		</div>
	)
};

export default CreateMeet;