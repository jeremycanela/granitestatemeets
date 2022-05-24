// Dependencies
import { useState, useEffect } from 'react';
import {
	Nav,
	NavDropdown,
	Button } from 'react-bootstrap';
import { NavLink, useNavigate, Link } from 'react-router-dom';

const Navigation = props => {
	const [signOut, signOutUser] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		if(signOut) {
			fetch("/api/signOut").then(() => {
				props.updateLoginStatus(null);
				navigate("/");
			});
		}
	}, [signOut]);

	return(
		<Nav variant="pills">
			<Nav.Item>
				<NavLink to="/admin" className={({isActive}) => window.location.pathname === "/admin" || window.location.pathname === "/admin/" ? "nav-link active" : "nav-link"}>Home</NavLink>
			</Nav.Item>
			<NavDropdown title="Menu" id="nav-dropdown">
				<NavLink strict="true" to="/dashboard" className="dropdown-item">Dashboard</NavLink>
				<NavDropdown.Divider />
				<NavLink strict="true" to="/admin/accounts" className="dropdown-item">Accounts</NavLink>
				<NavDropdown.Divider />
				<NavLink strict="true" to="/admin/createMeet" className="dropdown-item">Create Meet</NavLink>
				<NavLink strict="true" to="/admin/editMeet" className="dropdown-item">Edit Meet</NavLink>
				<NavLink strict="true" to="/admin/meetRequests" className="dropdown-item">Private Meet Requests</NavLink>
			</NavDropdown>
			<Nav.Item>
				<Button variant="outline-danger" onClick={() => signOutUser(true)}>Sign Out</Button>
			</Nav.Item>
		</Nav>
	)
};

export default Navigation;