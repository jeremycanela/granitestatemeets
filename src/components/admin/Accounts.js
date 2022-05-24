// Dependencies
import { useState, useEffect, useRef } from 'react';
import { Form, Accordion, ListGroup, ButtonGroup, Button, Badge, Modal } from 'react-bootstrap';

// Components
import Navigation from './Navigation';
import VehiclePhotoModal from './VehiclePhotoModal';
import { verifyUser } from './helpers/verifyUser';
import { declineUser } from './helpers/declineUser';

const Accounts = props => {
	const [usersStats, setUsersStats] = useState({
		approved: 0,
		denied: 0,
		banned: 0
	});
	const [showPhoto, setShowPhoto] = useState({show: false, details: {path: "", additionalPath: ""}});
	const [accounts, setAccounts] = useState([]);
	const [allUsersCount, setAllUsersCount] = useState(0);
	const [scrollPosition, setScrollPosition] = useState(0);
	const [banConfirmation, setBanConfirmation] = useState({show: false});
	
	const banConfirmationRef = banConfirmation;
	const searchedUser = useRef();

	const formatDate = date => {
		const substr = date.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\w+)$/);
		const year = substr[1];
		const month = substr[2];
		const day = substr[3];

		return `${month}/${day}/${year}`;
	};

	const generateRows = list => {
		const allUsersHTML = [];

		list.forEach(user => {
			const additionalLicensePlates = [];

			if(user.additionalLicensePlates.length) {
				user.additionalLicensePlates.forEach(additionalLicensePlate => {
					const { licensePlate } = additionalLicensePlate;
					additionalLicensePlates.push(licensePlate);
				});
			}

			allUsersHTML.push(
				<Accordion.Item eventKey={user.id} key={user.id}>
					<Accordion.Header>{user.fullName} - {user.licensePlate}{additionalLicensePlates.length ? `, ${additionalLicensePlates.join(", ")}` : null}</Accordion.Header>
					<Accordion.Body>
						<ListGroup>
							<ListGroup.Item>{user.email}</ListGroup.Item>
							<ListGroup.Item><Button variant="primary" onClick={() => setShowPhoto({show: true, details: {path: user.vehiclePhoto, additionalPath: user.additionalVehiclePhoto}})}>View Photo</Button></ListGroup.Item>
							<ListGroup.Item>
								{ user.verified ?
						 			<Badge bg="success">Approved</Badge> 
						 		:
						 			<ButtonGroup>
						 				<Button variant="success" onClick={() => verifyUser(user.id, setScrollPosition, scrollPosition, searchedUser.current ? () => getSearchedUser(searchedUser.current) : getAllUsers)}>
						 					<Badge bg="warning">Pending</Badge> Approve</Button>
						 				{ user.denied ?
						 					<Button variant="warning" disabled><Badge bg="danger">Yes</Badge> Declined</Button>
						 				:
						 					<Button variant="warning" onClick={() => declineUser(user.id, setScrollPosition, scrollPosition, searchedUser.current ? () => getSearchedUser(searchedUser.current) : getAllUsers)}><Badge bg="success">No</Badge> Decline</Button>
						 				}
						 			</ButtonGroup>
						 		}
							</ListGroup.Item>
							<ListGroup.Item>{ user.banned ? <Button variant="warning" onClick={() => changeBanStatus(user.id, false, searchedUser.current ? () => getSearchedUser(searchedUser.current) : getAllUsers)}><Badge bg="danger">Yes</Badge> Unban</Button> : <Button variant="danger" onClick={() => setBanConfirmation({show: true, id: user.id, fullName: user.fullName})}><Badge bg="success">No</Badge> Ban</Button> }</ListGroup.Item>
							<ListGroup.Item>Created on: {formatDate(user.createdAt)}</ListGroup.Item>
						</ListGroup>
					</Accordion.Body>
				</Accordion.Item>
			);
		});
		
		setAccounts(allUsersHTML);
	};

	const getAllUsers = () => {
		fetch("/api/getAllUsers").then(async response => {
			const allUsers = await response.json();
			generateRows(allUsers);
			setAllUsersCount(allUsers.length);
		});

		fetch("/api/getAllUsersStats").then(async response => {
			const allUsersStats = await response.json();
			setUsersStats(allUsersStats);
		});
	};

	const getSearchedUser = searchValue => {
		fetch(`/api/searchUsers/${searchValue}`).then(async response => {
			const searchResults = await response.json();
			generateRows(searchResults);
		});
	};

	let searchTimeout = null;
	const handleUserSearch = e => {
		clearTimeout(searchTimeout);

		const searchValue = e.target.value;
		searchedUser.current = searchValue;

		if(searchValue) {
			searchTimeout = setTimeout(() => {
				getSearchedUser(searchValue);
			}, 500);
		} else {
			getAllUsers();
		}

	};

	const changeBanStatus = (id, status, refresh) => {
		setScrollPosition(window.pageYOffset);
		fetch("/api/changeBanStatus", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({id, status})
		}).then(() => {
			refresh();
			status && setBanConfirmation({show: false});
			window.scrollTo(0, scrollPosition);
		}).catch(error => {
			console.error(error);
		});
	};

	useEffect(() => {
		getAllUsers();
	}, []);

	return(
		<div id="adminContainer">
			<Navigation updateLoginStatus={props.updateLoginStatus} />

			<h2 className="pageTitle"><Badge bg="primary" className="count">{allUsersCount}</Badge>Accounts</h2>

			<ListGroup id="stats" horizontal>
				<ListGroup.Item variant="success"><strong><span>{usersStats.approved}</span>Approved</strong></ListGroup.Item>
				<ListGroup.Item variant="warning"><strong><span>{usersStats.denied}</span>Denied</strong></ListGroup.Item>
				<ListGroup.Item variant="danger"><strong><span>{usersStats.banned}</span>Banned</strong></ListGroup.Item>
			</ListGroup>

			<Form.Control type="text" placeholder="Search for email, name, or license plate number" onChange={handleUserSearch} />

			<Accordion style={{marginTop: "15px"}}>
				{accounts}
			</Accordion>

			<VehiclePhotoModal showPhoto={showPhoto} setShowPhoto={setShowPhoto} />

			<Modal show={banConfirmation.show} onHide={() => setBanConfirmation({show: false})} size="md" centered>
				<Modal.Header closeButton>
					<Modal.Title id="contained-modal-title-vcenter">Confirmation</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Are you sure you want to ban <strong>{banConfirmation.fullName}</strong>?</p>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="primary" onClick={() => setBanConfirmation({show: false})}>Close</Button>
					<Button variant="danger" onClick={() => changeBanStatus(banConfirmation.id, true, searchedUser.current ? () => getSearchedUser(searchedUser.current) : getAllUsers)}>Ban</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
};

export default Accounts;