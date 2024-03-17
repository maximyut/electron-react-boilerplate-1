const { startParsing } = require("./parse");

const start = async (filePath, mainWindow) => {
	await startParsing(filePath, mainWindow);
};

// start();
module.exports = {
	start,
};
