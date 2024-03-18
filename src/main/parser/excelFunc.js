/* eslint-disable no-restricted-syntax */
const { BrowserWindow } = require("electron");
const XLSX = require("xlsx");

const getCatalogFromExcel = async (filePath) => {
	const mainWindow = BrowserWindow.fromId(1);
	try {
		const workbook = XLSX.readFile(filePath);
		const sheetNameList = workbook.SheetNames;
		const initialCatalog = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);

		return initialCatalog;
	} catch (error) {
		mainWindow.webContents.send("getInfo", `${error}`);
		throw new Error(`Ошибка получения данных из файла ${error}`);
	}
};

const createExcelAndCSV = async (pages, filePath) => {
	const workbook = XLSX.utils.book_new();

	pages.forEach((page, i) => {
		const worksheet = XLSX.utils.json_to_sheet(page);
		XLSX.utils.book_append_sheet(workbook, worksheet, `Страница ${i}`);
	});

	await XLSX.writeFile(workbook, filePath);
};

module.exports = {
	getCatalogFromExcel,
	createExcelAndCSV,
};
