export const verifyUser = (id, setState, scrollPosition, refresh) => {
	setState(window.pageYOffset);
	fetch("/api/verifyUser", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({id})
	}).then(() => {
		refresh();
		window.scrollTo(0, scrollPosition);
	}).catch(error => {
		console.error(error);
	});
};