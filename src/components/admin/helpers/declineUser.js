export const declineUser = (id, setState, state, refresh) => {
	setState(window.pageYOffset);
	fetch("/api/declineUser", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({id})
	}).then(() => {
		refresh();
		window.scrollTo(0, state);
	}).catch(error => {
		console.error(error);
	});
};