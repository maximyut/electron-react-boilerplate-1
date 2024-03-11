const clc = require("cli-color");
const fs = require("fs");
const path = require("path");

function getDirectoriesRecursively(directoryPath) {
	const subdirectories = [];

	fs.readdirSync(directoryPath).forEach((file) => {
		const filePath = path.join(directoryPath, file);
		if (fs.statSync(filePath).isDirectory()) {
			subdirectories.push(filePath);
			subdirectories.push(...getDirectoriesRecursively(filePath));
		}
	});

	return subdirectories;
}

const getCategory = async (path) => {
	const productsArr = JSON.parse(await fs.promises.readFile(path));
	let linksArr = [];
	productsArr.forEach((item) => {
		linksArr.push(item.url);
	});

	let categoriesArr = [];
	let allCategoriesArr = [];

	linksArr.forEach((link, i) => {
		const splittedLink = link.split("/");
		const notCategories = ["https:", "", "msk.ecovita.ru", "catalog"];

		let newSplittedLink = splittedLink.filter((link) => {
			if (!notCategories.includes(link) && !link.includes(".html")) {
				allCategoriesArr.push(link);

				return link;
			}
		});
		newSplittedLink = newSplittedLink.join(" > ");
		categoriesArr.push(newSplittedLink);
	});

	const newSet = new Set(allCategoriesArr);
	allCategoriesArr = Array.from(newSet);

	const categoriesPath = path.substr(0, path.indexOf("L")) + "Categories.json";

	await fs.promises.writeFile(categoriesPath, JSON.stringify(categoriesArr));
};

const errorText = clc.red.bold;
const infoText = clc.blue.bold;

const addLinkWithError = async (linkWithError, file) => {
	try {
		await fs.promises.stat(file);
		console.log("Файл с ошибками ссылок уже есть");
		const currentLinks = JSON.parse(await fs.promises.readFile(file));
		const newLinks = [...currentLinks, linkWithError];
		await fs.promises.writeFile(file, JSON.stringify(newLinks));
	} catch (err) {
		if (err.code === "ENOENT") {
			98;
			const newLinks = [linkWithError];
			await fs.promises.writeFile(file, JSON.stringify(newLinks));
		} else {
			throw err;
		}
	}
};

const getData = async (path) => {
	try {
		const data = await fs.promises.readFile(path, { encoding: "utf8" });
		return JSON.parse(data);
	} catch (err) {
		console.error(errorText("getData error", err.name));
	}
};

const createDir = async (dirPath, errorPath) => {
	const splittedPath = dirPath.split("/");

	try {
		await fs.promises.stat(dirPath);
		// console.log("Директория есть");
	} catch (error) {
		if (error.code === "ENOENT") {
			let newPath = "";
			const i = 0;
			for (const path of splittedPath) {
				if (i === splittedPath.length - 1) {
					newPath += `${path}`;
				} else {
					newPath += `${path}/`;
				}

				try {
					await fs.promises.mkdir(newPath);
				} catch (error) {
					if (error.code !== "EEXIST") {
						console.error("createDir error", error.name);
						addLinkWithError(path, errorPath);
					}
				}
			}
		}
	}
};

const createJSON = async (data, jsonPath) => {
	const jsonContent = JSON.stringify(data);
	if (jsonPath.includes(".json")) {
		await createDir(path.dirname(jsonPath));
	} else {
		await createDir(jsonPath);
		jsonPath += "/data.json";
	}

	try {
		await fs.promises.writeFile(`${jsonPath}`, jsonContent);
	} catch (error) {
		console.log(errorText("error with createJson"), error);
	}
};

const checkJSON = async (path) => {
	let state = false;
	try {
		await fs.promises.stat(`${path}`);
		// console.log(`Файл ${path} существует`);
		state = true;
	} catch (err) {
		if (err.code === "ENOENT") {
			state = false;
		} else {
			throw err;
		}
	}

	return state;
};

const getObjectWithLongestArray = (array, key) => {
	const objectWithLongestArray = array.reduce((prev, current) => {
		try {
			return prev[key].length > current[key].length ? prev : current;
		} catch (error) {
			console.error(errorText("getObjectWithLongestArray error", current));
		}
	});

	return objectWithLongestArray;
};

module.exports = {
	createDir,
	createJSON,
	checkJSON,
	getData,
	addLinkWithError,
	getObjectWithLongestArray,
	errorText,
	infoText,
};
