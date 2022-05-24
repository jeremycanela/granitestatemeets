// Dependencies
import { useContext } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Fade } from 'react-reveal';

// Components
import { UserContext } from './Context';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

const Menu = props => {
	const user = useContext(UserContext);
	return(
		<div id="menu" style={{display: (props.showMenu ? "block" : "none")}}>
			<button className="close" onClick={() => props.setShowMenu(false)}><FontAwesomeIcon icon={faXmark} color="#fff" size="3x" /></button>
			<div className="container">
				<Fade bottom cascade>
					<ul>
						<li><NavLink to="/dashboard">Dashboard</NavLink></li>
						{ user.details.admin && <li><NavLink to="/admin">Admin Portal</NavLink></li> }
						<li><NavLink to="/accountSettings">Account Settings</NavLink></li>
						<li onClick={() => props.signOutUser(true)}>Sign out</li>
					</ul>
				</Fade>
			</div>
		</div>
	);
};

export default Menu;