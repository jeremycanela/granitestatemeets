// Dependencies
import { Modal } from 'react-bootstrap';
import { IKContext, IKImage } from 'imagekitio-react';
import {imageKitAuthenticationEndpoint,
		imageKitUrlEndpoint,
		imageKitPublicKey } from '../../api_config';

const VehiclePhotoModal = props => {
	return(
		<Modal
			show={props.showPhoto.show}
			onHide={() => props.setShowPhoto(prevState => ({...prevState, show: false}))}
			size="lg"
			style={{padding: "50px 0"}}
			centered>
			<IKContext publicKey={imageKitPublicKey} urlEndpoint={imageKitUrlEndpoint} authenticationEndpoint={imageKitAuthenticationEndpoint} >
				<IKImage loading="lazy" path={props.showPhoto.details.path} />
				{ props.showPhoto.details.additionalPath && <IKImage loading="lazy" path={props.showPhoto.details.additionalPath} /> }
			</IKContext>
		</Modal>
	);
};

export default VehiclePhotoModal;