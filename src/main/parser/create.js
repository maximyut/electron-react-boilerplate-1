const fs = require("fs/promises");
const path = require("path");

const xlsx = require("xlsx");
const { getData, getObjectWithLongestArray, checkJSON } = require("./functions");

const traverseAndFlatten = (currentNode, target, flattenedKey) => {
	for (const key in currentNode) {
		if (currentNode.hasOwnProperty(key)) {
			let newKey;
			if (flattenedKey === undefined) {
				newKey = key;
			} else {
				newKey = `${flattenedKey}.${key}`;
			}

			const value = currentNode[key];
			if (typeof value === "object") {
				traverseAndFlatten(value, target, newKey);
			} else {
				target[newKey] = value;
			}
		}
	}
};

const flatten = (obj) => {
	const flattenedObject = {};
	traverseAndFlatten(obj, flattenedObject);
	return flattenedObject;
};

const getPathsWithData = (directoryPath) => {
	const fsAll = require("fs");

	function findJsonFiles(directoryPath) {
		let jsonFiles = [];

		const files = fsAll.readdirSync(directoryPath);

		files.forEach((file) => {
			const filePath = path.join(directoryPath, file);
			const stat = fsAll.statSync(filePath);

			if (stat.isFile() && path.extname(file) === ".json") {
				if (
					path.basename(file) !== "linksWithError.json" &&
					path.basename(file) !== "visitedLinks.json" &&
					path.basename(file) !== "allLinks.json" &&
					path.basename(file) !== "characteristics.json"
				) {
					jsonFiles.push(filePath);
				}
			} else if (stat.isDirectory()) {
				jsonFiles = jsonFiles.concat(findJsonFiles(filePath));
			}
		});

		return jsonFiles;
	}

	const jsonFiles = findJsonFiles(directoryPath);

	return jsonFiles;
};

const createNewArray = async (directoryPath) => {
	const flattedArray = [];
	const normalArray = [];
	const arrayPaths = getPathsWithData(directoryPath);
	for (const path of arrayPaths) {
		const data = await getData(path);
		if (data.length) {
			data.forEach((item) => {
				if (item !== null) {
					normalArray.push(item);
					flattedArray.push(flatten(item));
				}
			});
		} else if (data !== null) {
			normalArray.push(data);
			flattedArray.push(flatten(data));
		}
	}

	return { flattedArray, normalArray };
};

const createCharacteristics = async (flattedArray, path) => {
	const names = [];

	flattedArray.forEach((obj) => {
		const keys = Object.keys(obj);

		const characteristicsNamesKeys = keys.filter(
			(key) =>
				!key.includes("title") && !key.includes("price") && !key.includes("url") && !key.includes("images"),
		);

		for (const key of keys) {
			names.push(key);
		}
	});
	const newSet = new Set(names);
	const uniqueValues = Array.from(newSet);
	const valuesObj = {};
	uniqueValues.forEach((value) => {
		valuesObj[value] = value;
	});
	fs.writeFile(`${path}/characteristics.json`, JSON.stringify(valuesObj));
	return valuesObj;
};

const createOneFile = async (path) => {
	const flattedArray = [...(await createNewArray(`${path}/catalog`)).flattedArray]; // ...(await createNewArray(`${path}/errorLinks`)).flattedArray
	const normalArray = [...(await createNewArray(`${path}/catalog`)).normalArray];

	console.log("Товаров: ", flattedArray.length);

	await fs.writeFile(`${path}/catalog.json`, JSON.stringify(normalArray));
	await fs.writeFile(`${path}/flattedCatalog.json`, JSON.stringify(flattedArray));

	const createNewFlattedCatalog = async (flattedArray) => {
		let characteristicsObj;
		if (await checkJSON(`${path}/characteristics.json`)) {
			characteristicsObj = await getData(`${path}/characteristics.json`);
		} else {
			characteristicsObj = await createCharacteristics(flattedArray, path);
		}
		const maxImgLinks = getObjectWithLongestArray(normalArray, "images").images.length;

		const createObjWithNamedCharacteristics = (obj, i) => {
			const keys = Object.keys(obj);
			let newObj = {};

			const changeCharacteristics = (obj) => {
				const newObj = {};
				keys.forEach((key, i) => {
					for (const newKey in characteristicsObj) {
						if (key == newKey) {
							newObj[characteristicsObj[newKey]] = obj[key];
						}
					}
				});

				return newObj;
			};

			if (i === 0) {
				const values = Object.values(characteristicsObj);

				for (const value of values) {
					newObj[value] = null;
				}
			}
			newObj = { ...newObj, ...changeCharacteristics(obj) };

			return newObj;
		};

		const createArrWithNamedCharacteristics = (array) => {
			return array.map((obj, i) => {
				return createObjWithNamedCharacteristics(obj, i);
			});
		};

		let newArray = createArrWithNamedCharacteristics(flattedArray);
		newArray = newArray.map((obj, i) => {
			if (i === 0) {
				newObj = {};

				for (let i = 0; i <= maxImgLinks; i++) {
					newObj[`images.${i}`] = null;
				}
				newObj = { ...newObj, ...obj };

				return newObj;
			}
			return obj;
		});

		await fs.writeFile(`${path}/newFlattedCatalog.json`, JSON.stringify(newArray));
		return newArray;
	};

	const newArr = await createNewFlattedCatalog(flattedArray);
	return { flattedArray, normalArray, newArr };
};

const startCreatingOneFile = async (pathToCatalogFolder, pathToDownloadFolder) => {
	console.log("start creating one file");
	const { flattedArray, normalArray, newArr } = await createOneFile(pathToCatalogFolder);

	const originalWorkbook = xlsx.utils.book_new();
	const newWorkbook = xlsx.utils.book_new();

	const originalWorksheet = xlsx.utils.json_to_sheet(flattedArray);
	const newWorksheet = xlsx.utils.json_to_sheet(newArr);

	xlsx.utils.book_append_sheet(originalWorkbook, originalWorksheet, "Оригинал");
	xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Измененный");

	await xlsx.writeFile(originalWorkbook, `${pathToDownloadFolder}/Оригинал.xlsx`);
	await xlsx.writeFile(newWorkbook, `${pathToDownloadFolder}/Измененный.xlsx`);

	console.log("stop creating one file");
};

module.exports = {
	startCreatingOneFile,
};
