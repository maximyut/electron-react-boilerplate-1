const { startParsing } = require("./parse");

const start = async (filePath) => {
	await startParsing(filePath);
};

// start();
module.exports = {
	start,
};
