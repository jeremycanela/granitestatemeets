// Dependencies
import { useState, useEffect, useContext } from 'react';
import {
	Badge,
	Card,
	ButtonGroup,
	Button,
	Modal } from 'react-bootstrap';
import { IKContext, IKImage } from 'imagekitio-react';
import {imageKitAuthenticationEndpoint,
		imageKitUrlEndpoint,
		imageKitPublicKey } from '../../api_config';

// Components
import Navigation from './Navigation';
import { verifyUser } from './helpers/verifyUser';
import { declineUser } from './helpers/declineUser';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';

const Admin = props => {
	const [unverifiedAccounts, setUnverifiedAccounts] = useState([]);
	const [scrollPosition, setScrollPosition] = useState(0);
	const [loading, setLoading] = useState(false);

	const getUnverifiedUsers = async () => {
		setLoading(true);
		await fetch("/api/getUnverifiedUsers").then(async response => {
			const unverifiedUsers = await response.json();
			
			const unverifiedUsersHTML = [];

			if(unverifiedUsers.length) {
				unverifiedUsers.forEach(user => {
					unverifiedUsersHTML.push(
						<Card key={user.id}>
							<IKContext publicKey={imageKitPublicKey} urlEndpoint={imageKitUrlEndpoint} authenticationEndpoint={imageKitAuthenticationEndpoint} >
								<IKImage path={user.vehiclePhoto} loading="lazy" className="card-img-top" />
								{ user.additionalVehiclePhoto && <IKImage path={user.additionalVehiclePhoto} loading="lazy" className="card-img-top" /> }
							</IKContext>
							<Card.Body>
								<Card.Title>{user.fullName}</Card.Title>
								<Card.Text>Licence Plate: <strong>{user.licensePlate}</strong></Card.Text>
								{user.vehicleModifications ? <Card.Text style={{whiteSpace: "pre-wrap"}}>Modifications:<br/>{user.vehicleModifications}</Card.Text> : <Card.Text>Modifications: Stock</Card.Text>}
								<ButtonGroup style={{width: "100%"}}>
									<Button variant="success" onClick={() => verifyUser(user.id, setScrollPosition, scrollPosition, getUnverifiedUsers)}>Accept</Button>
									<Button variant="warning" onClick={() => declineUser(user.id, setScrollPosition, scrollPosition, getUnverifiedUsers)}>Decline</Button>
								</ButtonGroup>
							</Card.Body>
						</Card>
					);
				});

				setUnverifiedAccounts(unverifiedUsersHTML);
				
			} else {
				setUnverifiedAccounts([]);
			}
			setLoading(false);
		});
	};

	useEffect(() => {
		getUnverifiedUsers();
	}, []);

	return(
		<div id="adminContainer">
			<Navigation updateLoginStatus={props.updateLoginStatus}  />

			<h2 className="pageTitle"><Badge bg={unverifiedAccounts.length ? "warning" : "success"} className="count">{unverifiedAccounts.length ? unverifiedAccounts.length : 0}</Badge> Unverified Accounts</h2>
		
			{ 	loading ?
					<h3 className="loading"><FontAwesomeIcon icon={faSpinner} className="loadingAnimation" size="3x" /><br />Loading</h3>
				:
					unverifiedAccounts.length ? unverifiedAccounts : <h3 className="noneUnverifiedAccounts"><FontAwesomeIcon icon={faUserCheck} size="3x" /><br />All accounts are verified</h3>
			}
		</div>
	);
}

export default Admin;