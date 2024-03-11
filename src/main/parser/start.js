const path = require("path");

const { startParsing } = require("./parse");

const start = async () => {
	const filePath = process.argv[2];
	const downloadFolderPath = path.dirname(filePath);
	console.log(filePath);
	await startParsing(filePath, downloadFolderPath);
};

start();
module.exports = {
	start,
};
