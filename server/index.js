process.env.NODE_ENV !== "production" && require("dotenv").config();

// Dependencies
const express = require("express");
const db = require("./models/index.js");
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Op } = db.Sequelize;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const ImageKit = require("imagekit");

const imagekit = new ImageKit({
	urlEndpoint: "https://ik.imagekit.io/granitestatemeets",
	publicKey: "public_DzDRizaHVNge8n1cOiXS0odsYu8=",
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});

const path = require('path');
const port = process.env.PORT || 3001;

// HTTPS redirect
const requireHTTPS = (req, res, next) => {
  if (!req.secure && req.get("x-forwarded-proto") !== "https" && process.env.NODE_ENV !== "development") {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
}

if(process.env.NODE_ENV === "production") {
	app.enable('trust proxy');
	app.use(requireHTTPS);
}

app.use(cookieParser());

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(cors());

app.use(bodyParser.json());

// Render react build
app.use(express.static(path.join(__dirname, "..", "build")));
app.use(express.static("public"));

const JWTSecretKey = process.env.JWT_SECRET_KEY;

const createUserCookies = (response, user, rememberMe) => {
	const token = jwt.sign({
		id: user.id,
		email: user.email,
		fullName: user.fullName,
		vehiclePhoto: user.vehiclePhoto,
		vehicleModifications: user.vehicleModifications,
		verified: user.verified,
		denied: user.denied,
		banned: user.banned,
		admin: user.admin
	}, JWTSecretKey);
	const [header, payload, signature] = token.split(".");

	let expireCookie = new Date();
	const expirationTime = rememberMe ? (3600000 * 24 * 14) : (30 * 60 * 1000);
	expireCookie.setTime(expireCookie.getTime() + expirationTime);

	response.cookie("headerPayload", `${header}.${payload}`, {
		secure: process.env.NODE_ENV !== "development",
	    expires: expireCookie,
	    sameSite: true,
	    overwrite: true
	});

	response.cookie("signature", signature, {
		secure: process.env.NODE_ENV !== "development",
	    httpOnly: true,
	    expires: expireCookie,
	    sameSite: true,
	    overwrite: true
	});

	return token;
};

const userColumns = ["id", "email", "fullName", "vehiclePhoto", "vehicleModifications", "verified", "denied", "banned", "admin"];
const errorObj = {error: true, message: "An unexpected error has occured. Please try again."};

const authenticateUser = (request, response, next) => {
	const token = `${request.cookies.headerPayload}.${request.cookies.signature}`;

	if(token) {
		jwt.verify(token, JWTSecretKey, (error, decoded) => {

			if(error) {
				response.status(401).send("Unauthorized: Invalid token");
			} else {
				request.user = decoded;
				next();
			}
		});
	} else {
		response.status(401).send("Unauthorized: Invalid token");
	}
};

const authenticateAdminUser = (request, response, next) => {
	const token = `${request.cookies.headerPayload}.${request.cookies.signature}`;

	if(token) {
		jwt.verify(token, JWTSecretKey, (error, decoded) => {

			if(error) {
				response.status(401).send("Unauthorized: Invalid token");
			} else if(decoded.admin === true) {
				next();
			} else {
				response.status(403).send("Forbidden");
			}
		});
	} else {
		response.status(401).send("Unauthorized: Invalid token");
	}
};

app.get("/api/uploadPhoto", (req, res) => {
	const result = imagekit.getAuthenticationParameters();
	res.send(result);
});

app.post("/api/verifyReCAPTCHA", urlencodedParser, async (req, res) => {
	try {
		const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.token}`);
		const responseJSON = await response.json();
		res.send(responseJSON);
		
	} catch(error) {
		res.status(500);
	}
});

app.post("/api/createUser", async (req, res) => {
	const { password, securityAnswer } = req.body;
	const userBuild = db.Users.build(req.body);

	await bcrypt.hash(password, 10).then(hash => {
		userBuild.password = hash;
	});

	await bcrypt.hash(securityAnswer, 10).then(hash => {
		userBuild.securityAnswer = hash;
	});

	await userBuild.save().then(() => {
		const token = createUserCookies(res, userBuild);
		res.send({token});
	}).catch(error => {
		console.log(error)
		res.send(error);
	});
});

app.get("/api/authenticateUser", authenticateUser, (req, res) => {
	const {user} = req;
	res.send(user);
});

// Sign in
app.post("/api/authenticateUser", async (req, res) => {
	const {emailOrLicensePlate, password, rememberMe} = req.body;

	await db.Users.findOne({
		where: {
			[Op.or]: [
				{
					email: emailOrLicensePlate
				}, {
					licensePlate: emailOrLicensePlate
				}
			]
		}
	}).then(user => {
		if(user) {
			bcrypt.compare(password, user.password).then(result => {
				if(result) {

					if(!user.banned) {
						const token = createUserCookies(res, user, rememberMe);

						res.send({token});
					} else {
						res.send({error: true, message: "This account has been banned due to a violation of our rules."})
					}
				} else {
					res.send({error: true, message: "The password entered is incorrect. Please try again."});
				}
			});
		} else {
			res.send({error: true, message: "The email/license plate you entered doesn't belong to an account. Please try again."});
		}
	}).catch(error => {
		console.log(error)
		res.send(errorObj);
	});
});

app.get("/api/checkUserEmail/:email", async (req, res) => {
	const { email } = req.params;

	const user = await db.Users.findOne({
		attributes: ["email", "securityQuestion"],
		where: {
			email
		}
	});

	if(user) {
		res.send(user);
	} else {
		res.send({error: true, message: "The email you entered doesn't belong to an account. Please try again."});
	}
});

app.get("/api/getSecurityQuestion/:path", async (req, res) => {
	const { path } = req.params;

	await db.ForgotPasswordLinks.findOne({
		where: {
			path
		},
		include: [{
			attributes: ["securityQuestion"],
			model: db.Users,
			as: "passwordSecurity"
		}]
	}).then(user => {
		if(user) {
			res.send(user);
		} else {
			res.send({error: true});
		}
	}).catch(() => {
		res.send(errorObj);
	});
});

app.post("/api/checkSecurityAnswer", (req, res) => {
	const { email, securityAnswer } = req.body;

	db.Users.findOne({
		attributes: ["id", "securityAnswer"],
		where: {
			email
		}
	}).then(user => {
		bcrypt.compare(securityAnswer, user.securityAnswer).then(async result => {
			if(result) {
				await db.ForgotPasswordLinks.create({userId: user.id}).then(record => {
					const { userId, path } = record;

					const token = jwt.sign({
						userId,
						path
					}, JWTSecretKey);
					const [header, payload, signature] = token.split(".");

					let expireCookie = new Date();
					const expirationTime = 20 * 60 * 1000;
					expireCookie.setTime(expireCookie.getTime() + expirationTime);

					res.cookie("forgotPasswordHP", `${header}.${payload}`, {
						secure: process.env.NODE_ENV !== "development",
					    expires: expireCookie,
					    sameSite: true,
					    overwrite: true
					});

					res.cookie("signature", signature, {
						secure: process.env.NODE_ENV !== "development",
					    httpOnly: true,
					    expires: expireCookie,
					    sameSite: true,
					    overwrite: true
					});

					res.send({token, path});

				}).catch(() => res.send({error: true, message: "An unexpected error has occured. Please try again."}));
			} else {
				res.send({error: true, message: "Incorrect answer. Please try again."})
			}
		});
	});
});

app.get("/api/checkForgotPasswordLink/:path", async (req, res) => {
	const { path } = req.params;
	const token = `${req.cookies.forgotPasswordHP}.${req.cookies.signature}`;

	if(token) {
		jwt.verify(token, JWTSecretKey, (error, decoded) => {

			if(error) {
				res.status(401).send("Unauthorized: Invalid token");
			} else {
				db.ForgotPasswordLinks.findOne({
					attributes: ["path", "createdAt"],
					where: {
						path
					}
				}).then(record => {
					res.send(record);
				}).catch(() => {
					res.send({error: true});
				});
			}
		});
	} else {
		res.status(401).send("Unauthorized: Invalid token");
	}

	
});

app.post("/api/updateForgottenUserPassword", async (req, res) => {
	const { userId, newPassword } = req.body;

	const user = await db.Users.findByPk(userId, {
		attributes: ["id", "password"]
	});
	
	await bcrypt.hash(newPassword, 10).then(hash => {
		user.password = hash;
	});

	await user.save().then(() => {
		res.send({error: false});
	}).catch(() => res.send(errorObj));
});

app.get("/api/signOut", (req, res) => {
	res.clearCookie("headerPayload").clearCookie("signature").send();
});

// User verification
app.get("/api/checkVerification", authenticateUser, async (req, res) => {
	const user = req.user;
	
	await db.Users.findByPk(user.id, {
		attributes: userColumns
	}).then(response => {
		if(response.verified) {
			const token = createUserCookies(res, response);
			res.send({token});
		} else if(response.denied) {
			res.send({denied: response.denied});
		} else {
			res.send({error: "User not verified"});
		}
	}).catch(() => {
		res.status(500).send();
	});
});

app.get("/api/getCurrentMeet", authenticateUser, async (req, res) => {
	const currentMeet = await db.Meets.findOne({
		attributes: ["id", "title", "date", "time", "location", "announcement", "privateMeet", "limit", "backupLocation", "endTime"],
		order: [["createdAt", "DESC"]]
	});
	res.send(currentMeet);
});

app.get("/api/sendPrivateMeetRequest/:meetId", authenticateUser, async (req, res) => {
	const user = req.user;
	const { meetId } = req.params;

	const meetRequest = await db.MeetRequests.create({userId: user.id, meetId, status: false}, {include: [{model: db.Meets, as: "meets"}]});
	res.send(meetRequest);
});

app.get("/api/checkPrivateMeetRequestStatus/:meetId", authenticateUser, async (req, res) => {
	const user = req.user;
	const { meetId } = req.params;

	const status = await db.MeetRequests.findOne({
		where: {
			[Op.and]: [
				{userId: user.id},
				{meetId}
			]
		},
		include: [{
			model: db.Meets,
			as: "meets"
		}]
	}).then(response => {
		if(response.status) {
			res.send(response);
		} else {
			res.send({status: false})
		}
	}).catch(() => {
		res.send(errorObj);
	});
});

app.get("/api/getMeetRequests/:meetId", authenticateUser, async (req, res) => {
	const { meetId } = req.params;

	const meetRequests = await db.MeetRequests.findAll({
		where: {
			meetId
		},
		order: [["createdAt", "DESC"]],
		include: [{
			model: db.Users,
			as: "users",
			attributes: {
				exclude: ["password", "verified", "banned", "admin", "ipAddress", "createdAt", "updatedAt"]
			}
		}]
	});
	res.send(meetRequests);
});

app.get("/api/checkBanStatus", authenticateUser, async (req, res) => {
	const { user } = req;

	const currentUserDetails = await db.Users.findByPk(user.id, {attributes: ["banned"]});
	res.send(currentUserDetails);
});

app.post("/api/updateUserVehiclePhoto", authenticateUser, async (req, res) => {
	const { id, vehiclePhoto, vehicleModifications, additionalVehiclePhoto } = req.body;

	const user = await db.Users.findByPk(id, {
		attributes: userColumns
	});
	
	user.vehiclePhoto = vehiclePhoto;
	user.vehicleModifications = vehicleModifications;
	user.denied = false;
	user.additionalVehiclePhoto = additionalVehiclePhoto;
	await user.save().then(() => {
		const token = createUserCookies(res, user);
		res.send(user);
	}).catch(() => {
		res.status(500).send();
	})
});

// Account Settings
app.post("/api/updateUserEmail", authenticateUser, async (req, res) => {
	const userDetails = req.user;
	const { email } = req.body;

	const user = await db.Users.findByPk(userDetails.id, {
		attributes: userColumns
	});

	user.email = email;

	await user.save().then(response => {
		createUserCookies(res, user);
		res.send(response);
	}).catch(() => res.send(errorObj));
});

app.post("/api/updateLoggedUserPassword", authenticateUser, async (req, res) => {
	const userDetails = req.user;
	const { currentPassword, newPassword } = req.body;

	const user = await db.Users.findByPk(userDetails.id, {
		attributes: ["id", "password"]
	});
	
	await bcrypt.compare(currentPassword, user.password).then(async result => {
		if(result) {
			await bcrypt.hash(newPassword, 10).then(hash => {
				user.password = hash;
			});

			await user.save().then(() => {
				res.send({error: false});
			}).catch(() => res.send(errorObj));
		} else {
			res.send({error: true, message: "The password entered is incorrect. Please try again."});
		}
	});
});

app.get("/api/getUserLicensePlates", authenticateUser, async (req, res) => {
	const userDetails = req.user;
	const licensePlates = [];

	const user = await db.Users.findByPk(userDetails.id, {
		attributes: ["id", "licensePlate"]
	});

	licensePlates.push(user.licensePlate);

	const additionalLicensePlates = await db.AdditionalLicensePlates.findAll({
		where: {
			userId: userDetails.id
		},
		attributes: ["userId", "licensePlate"]
	});

	additionalLicensePlates.forEach(record => licensePlates.push(record.licensePlate));

	res.send(licensePlates);
});

app.post("/api/checkLicensePlate", authenticateUser, async (req, res) => {
	const { additionalLicensePlate } = req.body;

	const usersResults = await db.Users.findAll({
		where: {
			licensePlate: additionalLicensePlate
		}
	});

	usersResults.length ? res.send({error: true, message: "The license plate entered is already in use."}) : res.send(usersResults);
});

app.post("/api/checkAdditionalLicensePlates", async (req, res) => {
	const { licensePlate } = req.body;

	const additionalLicensePlatesResults = await db.AdditionalLicensePlates.findAll({
		where: {
			licensePlate
		}
	});

	additionalLicensePlatesResults.length ? res.send({error: true, message: "The license plate entered is already in use."}) : res.send(additionalLicensePlatesResults);
});

app.post("/api/addLicensePlate", authenticateUser, async (req, res) => {
	const { additionalLicensePlate } = req.body;
	const userDetails = req.user;

	await db.AdditionalLicensePlates.create({userId: userDetails.id, licensePlate: additionalLicensePlate}).then(response => {
		res.send(response);
	}).catch(error => {
		res.send(error);
	});
});

// Admin
app.get("/api/getUnverifiedUsers", authenticateAdminUser, async (req, res) => {
	await db.Users.findAll({
		attributes: ["id", "fullName", "licensePlate", "vehiclePhoto", "vehicleModifications", "additionalVehiclePhoto"],
		order: [["createdAt", "DESC"]],
		where: {
			verified: false,
			denied: false,
			banned: false
		}
	}).then(response => {
		res.send(response);
	}).catch(() => {
		res.status(500).send("An unexpected error has occured.")
	});
});

app.post("/api/verifyUser", authenticateAdminUser, async (req, res) => {
	const { id } = req.body;

	const user = await db.Users.findByPk(id);

	user.verified = true;
	user.denied = false;

	await user.save().then(() => {
		res.status(200).send();
	}).catch(() => {
		res.status(500).send();
	});

});

app.post("/api/changeBanStatus", authenticateAdminUser, async (req, res) => {
	const { id, status } = req.body;

	const user = await db.Users.findByPk(id);
	
	user.banned = status;

	await user.save().then(() => {
		res.status(200).send();
	}).catch(() => {
		res.status(500).send();
	});
});

app.post("/api/declineUser", authenticateAdminUser, async (req, res) => {
	const { id } = req.body;

	const user = await db.Users.findByPk(id);
	
	user.denied = true;
	user.verified = false;

	await user.save().then(() => {
		res.status(200).send();
	}).catch(() => {
		res.status(500).send();
	});

});

app.get("/api/getAllUsers", authenticateAdminUser, async (req, res) => {
	db.Users.findAll({
		attributes: ["id", "email", "fullName", "licensePlate", "vehiclePhoto", "verified", "denied", "banned", "admin", "createdAt", "additionalVehiclePhoto"],
		order: [["createdAt", "DESC"]],
		include: [{
			model: db.AdditionalLicensePlates,
			as: "additionalLicensePlates",
			attributes: ["licensePlate"]
		}]
	}).then(response => {
		res.send(response);
	}).catch(error => {
		res.send(error);
	});
});

app.get("/api/getAllUsersStats", authenticateAdminUser, async (req, res) => {
	const approvedUsers = await db.Users.findAndCountAll({
		where: {
			verified: true,
			denied: false,
			banned: false
		}
	});

	const deniedUsers = await db.Users.findAndCountAll({
		where: {
			verified: false,
			denied: true,
			banned: false
		}
	});

	const bannedUsers = await db.Users.findAndCountAll({
		where: {
			banned: true
		}
	});

	const stats = {
		approved: approvedUsers.count,
		denied: deniedUsers.count,
		banned: bannedUsers.count
	};

	res.send(stats);
});

app.get("/api/searchUsers/:searchValue", authenticateAdminUser, (req, res) => {
	const { searchValue } = req.params;

	db.Users.findAll({
		attributes: ["id", "email", "fullName", "licensePlate", "vehiclePhoto", "verified", "denied", "banned", "admin", "createdAt", "additionalVehiclePhoto"],
		where: {
			[Op.or]: [
				{ email: {[Op.iLike]: `%${searchValue}%`} },
				{ fullName: {[Op.iLike]: `%${searchValue}%`} },
				{ licensePlate: {[Op.iLike]: `%${searchValue}%`} },
				{ '$additionalLicensePlates.licensePlate$': {[Op.iLike]: `%${searchValue}%`} }
			]
		},
		include: [{
			model: db.AdditionalLicensePlates,
			as: "additionalLicensePlates"
		}]
	}).then(response => {
		res.send(response);
	}).catch(error => {
		res.status(500).send(error);
	});
});

app.post("/api/createMeet", authenticateAdminUser, async (req, res) => {
	const newMeet = await db.Meets.create(req.body);
	res.send(newMeet);
});

app.post("/api/updateMeet", authenticateAdminUser, async (req, res) => {
	const { id, title, date, time, location, announcement, privateMeet, limit, backupLocation, endTime} = req.body;
	const meet = await db.Meets.findByPk(id);
	meet.title = title;
	meet.date = date;
	meet.time = time;
	meet.endTime = endTime;
	meet.location = location;
	meet.announcement = announcement;
	meet.privateMeet = privateMeet;
	meet.limit = limit;
	meet.backupLocation = backupLocation;

	const updatedMeet = await meet.save();
	res.send(updatedMeet);
});

app.post("/api/approveMeetRequest", authenticateAdminUser, async (req, res) => {
	const { requestId } = req.body;

	const meetRequest = await db.MeetRequests.findOne({
		where: {
			id: requestId
		}
	});

	meetRequest.status = true;

	const approvedMeetRequest = await meetRequest.save();
	res.send(approvedMeetRequest);
});

app.get("/api/getPendingMeetRequests/:meetId", authenticateAdminUser, async (req, res) => {
	const { meetId } = req.params;
	const pendingMeetRequests = await db.MeetRequests.findAll({
		where: {
			meetId,
			status: false
		},
		order: [["createdAt", "DESC"]],
		include: [{
			model: db.Users,
			as: "users",
		attributes: {
			exclude: ["password", "verified", "banned", "admin", "ipAddress", "createdAt", "updatedAt"]
		}
	}]});
	res.send(pendingMeetRequests);
});

app.get("/api/getApprovedUsersCount/:meetId", authenticateAdminUser, async (req, res) => {
	const { meetId } = req.params;
	const { count } = await db.MeetRequests.findAndCountAll({
		where: {
			meetId,
			status: true
		}
	});

	res.send({count});
});

app.get("/api/searchMeetRequestUser/:searchValue/:meetId", authenticateAdminUser, async (req, res) => {
	const { searchValue, meetId } = req.params;

	db.MeetRequests.findAll({
		where: {
			meetId
		},
		order: [["createdAt", "DESC"]],
		include: [{
			model: db.Users,
			as: "users",
			attributes: ["id", "email", "fullName", "licensePlate", "vehiclePhoto"],
			where: {
				[Op.or]: [
					{ email: {[Op.like]: `%${searchValue}%`} },
					{ fullName: {[Op.like]: `%${searchValue}%`} },
					{ licensePlate: {[Op.like]: `%${searchValue}%`} }
				]
			}
		}]
	}).then(async meetRequests => res.send(await meetRequests));
});

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

app.listen(port);