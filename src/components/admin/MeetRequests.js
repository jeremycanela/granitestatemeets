// Dependencies
import { useState, useRef, useEffect } from 'react';
import { Form, InputGroup, ToggleButton, Accordion, ListGroup, Button, Badge, Toast } from 'react-bootstrap';

// Components
import Navigation from './Navigation';
import VehiclePhotoModal from './VehiclePhotoModal';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MeetRequests = props => {
	const [showPendingRequests, setShowPendingRequests] = useState(false);
	const [showPhoto, setShowPhoto] = useState({show: false, details: {path: ""}});
	const [currentMeet, setCurrentMeet] = useState({
		title: "",
		announcement: "",
		date: "",
		time: "",
		location: ""
	});
	const [meetRequests, setMeetRequests] = useState([]);
	const [scrollPosition, setScrollPosition] = useState(0);
	const [allUsersCount, setAllUsersCount] = useState(0);
	const [approvedCount, setApprovedCount] = useState(0);
	const [approvalError, setApprovalError] = useState(false);
	const [loading, setLoading] = useState(false);

	const currentMeetRef = useRef();
	const approvedCountRef = useRef();

	currentMeetRef.current = currentMeet;
	approvedCountRef.current = approvedCount;


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

	const generateRows = list => {
		const requestsHTML = [];
		list.forEach(request => {
			const user = request.users;
			
			requestsHTML.push(
				<Accordion.Item eventKey={user.id} key={user.id}>
					<Accordion.Header>{user.fullName} - {user.licensePlate}</Accordion.Header>
					<Accordion.Body>
						<ListGroup>
							<ListGroup.Item>{user.email}</ListGroup.Item>
							<ListGroup.Item><Button variant="primary" onClick={() => setShowPhoto({show: true, details: {path: user.vehiclePhoto, additionalPath: user.additionalVehiclePhoto}})}>View Photo</Button></ListGroup.Item>
							<ListGroup.Item>{request.status ? <Badge bg="success">Yes</Badge> : <Button variant="success" onClick={() => approveRequest(request.id)}><Badge bg="warning">Pending</Badge> Approve</Button>}</ListGroup.Item>
						</ListGroup>
					</Accordion.Body>
				</Accordion.Item>
			);
		});
		
		setMeetRequests(requestsHTML);
	};

	const getMeetRequests = meetId => {
		fetch(`/api/getMeetRequests/${meetId}`).then(async response => {
			const allMeetRequests = await response.json();
			setAllUsersCount(allMeetRequests.length);
			generateRows(allMeetRequests);
		});
	};

	const getPendingMeetRequests = meetId => {
		fetch(`/api/getPendingMeetRequests/${meetId}`).then(async response => {
			const allPendingMeetRequests = await response.json();
			generateRows(allPendingMeetRequests);
		});
	};

	const getApprovedRequestsCount = async meetId => {
		await fetch(`/api/getApprovedUsersCount/${meetId}`).then(async response => {
			const { count } = await response.json();
			setApprovedCount(count);
		}).catch(error => console.error(error));
	};

	const approveRequest = requestId => {
		if(!(approvedCountRef.current >= currentMeetRef.current.limit)) {
			setScrollPosition(window.pageYOffset);
			fetch("/api/approveMeetRequest", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({requestId})
			}).then(() => {
				getMeetRequests(currentMeetRef.current.id);
				getApprovedRequestsCount(currentMeetRef.current.id);
				window.scrollTo(0, scrollPosition);
			}).catch(error => console.error(error));
		} else {
			setApprovalError(true);
		}
	};

	let searchTimeout = null;
	const handleUserSearch = e => {
		const searchValue = e.target.value;
		clearTimeout(searchTimeout);

		if(searchValue) {
			searchTimeout = setTimeout(() => {
				fetch(`/api/searchMeetRequestUser/${searchValue}/${currentMeetRef.current.id}`).then(async response => {
					const searchResults = await response.json();
					generateRows(searchResults);
				});
			}, 500);
		} else {
			getMeetRequests(currentMeetRef.current.id);
		}

	};

	useEffect(() => {
		setLoading(true);
		fetch(`/api/getCurrentMeet`).then(async response => {
			const meetDetails = await response.json();
			
			setCurrentMeet(meetDetails);
			getApprovedRequestsCount(meetDetails.id);
			
			if(showPendingRequests) {
				getPendingMeetRequests(meetDetails.id);
			} else {
				getMeetRequests(meetDetails.id);
			}

			setLoading(false);
		});

	}, [showPendingRequests]);

	return(
		<div id="adminContainer">
			<Navigation updateLoginStatus={props.updateLoginStatus} />
			<h2 className="pageTitle"><Badge bg="primary" className="count">{allUsersCount}</Badge>Private Meet Requests</h2>
			
			{ 	loading ?
					<h3 className="loading"><FontAwesomeIcon icon={faSpinner} className="loadingAnimation" size="3x" /><br />Loading</h3>
				:
					currentMeet.privateMeet ?
						<>
							<div>
								<h3>{currentMeet.title}</h3>
								<p style={{marginBottom: 0}}>{`${currentMeet.date && formatDate(currentMeet.date)} at ${currentMeet.time && convertTime(currentMeet.time)}`}</p>
								<p>{currentMeet.location}</p>
								{currentMeet.privateMeet && 
									<>
										<p style={{marginBottom: 0}}>Limit: <Badge bg="primary">{currentMeet.limit}</Badge></p>
										<p>Approved: <Badge bg="success">{approvedCount}</Badge></p>
									</>
								}
							</div>

							<Form>
								<InputGroup>
								<Form.Control type="text" placeholder="Search for email, name, or license plate number" onChange={handleUserSearch} />
								<ToggleButton
									id="pendingRequests"
									type="checkbox"
									variant="outline-primary"
									value="2"
									checked={showPendingRequests}
									name="filterRequestsResults"
									onChange={() => {
										setShowPendingRequests(prevState => !prevState);
									}}>Show Pending Requests Only</ToggleButton>
								</InputGroup>
								
							</Form>

							<Accordion style={{marginTop: "15px"}}>
								{meetRequests}
							</Accordion>

							<VehiclePhotoModal showPhoto={showPhoto} setShowPhoto={setShowPhoto} />
						</>
					:
						!loading &&
						<h3 className="publicMeetInfo"><FontAwesomeIcon icon={faCircleInfo} style={{color: "#8d8d8d", marginRight: "10px"}} size="3x" /><br />The current meet is public</h3>
				}

				<Toast show={approvalError} onClose={() => setApprovalError(false)} delay={5000} autohide bg="danger" style={{position: "fixed", bottom: "30px", right: "30px"}}>
					<Toast.Header>
						<strong className="me-auto">Error</strong>
					</Toast.Header>
					<Toast.Body style={{color: "#fff"}}>The meet limit has been reached.</Toast.Body>
				</Toast>

		</div>
	);
};

export default MeetRequests;