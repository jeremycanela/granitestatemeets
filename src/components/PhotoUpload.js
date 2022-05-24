// Components
import { IKImage, IKContext, IKUpload } from 'imagekitio-react';
import {imageKitAuthenticationEndpoint,
		imageKitUrlEndpoint,
		imageKitPublicKey } from '../api_config';
import { v4 as uuidv4 } from 'uuid';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faAt, faKey, faIdCard, faUpload, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const PhotoUpload = props => {

	const openFileBrowser = e => {
		e.target.offsetParent && e.target.offsetParent.children[0].click();
	};

	return(
		<div className="fileInput" onClick={openFileBrowser} style={{marginBottom: "15px", color: "initial"}}>
			<IKContext publicKey={imageKitPublicKey} urlEndpoint={imageKitUrlEndpoint} authenticationEndpoint={imageKitAuthenticationEndpoint} >
				<IKUpload fileName={`${uuidv4()}.jpg`} onSuccess={props.handlePhotoUpload} onError={props.handleUploadError} />
				{
					!props.uploadedPhoto ?
						<div className="flexbox">
							<div className="icon">
								<FontAwesomeIcon icon={faUpload} color="#d4d4d4" size="lg" />
							</div>
							{ props.licensePlate ?
								<div className="instructions">
									<h4>Vehicle photo</h4>
									<p><strong className="redText">Choose</strong> a photo from your device.</p>
									<p className="info"><FontAwesomeIcon icon={faCircleInfo} color="#8d8d8d" size="sm" /> The license plate number must be legible for approval.</p>
								</div>
							:
								<div className="instructions">
									<h4>Additional vehicle photo</h4>
									<p><strong className="redText">Choose</strong> a photo from your device.</p>
									<p className="info"><FontAwesomeIcon icon={faCircleInfo} color="#8d8d8d" size="sm" /> Not required, but will be if your account is denied.</p>
								</div>
							}
						</div>
					:	
						<>
							<IKImage
								path={props.uploadedPhoto.filePath}
								width="268"
								style={{borderRadius: "3px", display: props.uploadingPhoto ? "none" : "block" }}
								onLoad={() => props.setUploadingPhoto(false)}
							/>
							{ props.uploadingPhoto ?
								<p><FontAwesomeIcon icon={faCircleInfo} color="#8d8d8d" /> Uploading...</p>
							:
								props.licensePlate &&
								<p className="info" style={{marginTop: "15px"}}><FontAwesomeIcon icon={faCircleInfo} color="#8d8d8d" size="sm" /> The license plate number must be legible for approval.</p>
							}
							
						</>
				}
			</IKContext>
		</div>
	);
};

export default PhotoUpload;