import photo from '../images/WelcomePhoto.jpg';

const WelcomePhoto = () => {
	return(<div className="welcomePhoto" style={{backgroundImage: `url(${photo})`, backgroundSize: "cover"}}></div>);
};

export default WelcomePhoto;