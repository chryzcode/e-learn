export default class CustomAPIError extends Error {
	constructor(message : any) {
		super(message);
	}
}
