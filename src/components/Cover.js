// Dependencies
import { useState, useEffect, useContext } from 'react';
import { IKContext, IKImage } from 'imagekitio-react';
import {imageKitAuthenticationEndpoint,
		imageKitUrlEndpoint,
		imageKitPublicKey } from '../api_config';

// Components
import Menu from './Menu';
import { UserContext } from './Context';
import { useNavigate } from 'react-router-dom';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const Cover = props => {
	const [showMenu, setShowMenu] = useState(false);
	const [signOut, signOutUser] = useState(false);

	const user = useContext(UserContext);
	const navigate = useNavigate();

	useEffect(() => {
		const checkBanStatus = setInterval(async () => {
			const user = await fetch("/api/checkBanStatus").then(async res => await res.json());
			
			if(user.banned) {
				signOutUser(true);
			}
		}, 10000);

		return () => clearInterval(checkBanStatus);
	}, []);

	useEffect(() => {
		if(signOut) {
			fetch("/api/signOut").then(() => {
				props.updateLoginStatus(null);
				navigate("/");
			});
		}
	}, [signOut]);

	return(
		<>
			<div id="cover">
				<IKContext publicKey={imageKitPublicKey} urlEndpoint={imageKitUrlEndpoint} authenticationEndpoint={imageKitAuthenticationEndpoint} >
					<IKImage path={user.details.vehiclePhoto} width="100%" />
				</IKContext>
				<div className="overlay">
					<button className="menuBtn" onClick={() => setShowMenu(true)}><FontAwesomeIcon icon={faBars} size="2x" /></button>
					<h5 className="pageTitle">{props.page}</h5>
					<div className="container">
						<div className="greeting"><span>Hello,</span> {user.details.fullName}</div>
					</div>
				</div>
			</div>
			<Menu showMenu={showMenu} setShowMenu={setShowMenu} signOutUser={signOutUser} />
		</>
	);
};

export default Cover;