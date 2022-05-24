// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

const Rules = props => {
	return(
		<div id="rulesOverlay" style={{display: (props.viewingRules ? "block" : "none")}}>
			<button className="close" onClick={() => props.updateViewingRules(false)}><FontAwesomeIcon icon={faXmark} color="#fff" size="3x" /></button>
			<div className="container">
				<h1>Granite State Meet Rules</h1>

				<p>Welcome to the Granite State Meets website. Listed below are our rules for all of our meets. Attenders who violate any of the following rules are not welcome at our meets and are subject to an account ban. We kindly ask that you respect these <strong>strict</strong> rules in order for us to operate meets safely and refrain from public disturbance.</p>

				<ul>
					<li><strong>No</strong> sharing meet locations or sharing accounts.</li>
					<li><strong>No</strong> revving, burnouts, donuts, loud music, causing drama, or performing any illegal activity.</li>
					<li><strong>No</strong> organizing meets or gatherings at locations Granite State Meets uses.</li> 
				</ul>
			</div>
		</div>
	);
};

export default Rules;