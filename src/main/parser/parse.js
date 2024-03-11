/* eslint-disable no-restricted-syntax */
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const { default: axios } = require("axios");
const _ = require("lodash");

const XLSX = require("xlsx");
const path = require("path");

const { checkJSON, createJSON, getData } = require("./functions");

const createPage3 = (catalog) => {
	const newArr = _.chain(catalog)
		.groupBy("Домен")
		.values()
		.value()
		.map((group) => {
			const groupLength = group.length;
			let allRepeats = 0;
			let allRepeatsPhrases = "";

			for (const obj of group) {
				allRepeats += Number(obj["Позиция [KS]"]);
				allRepeatsPhrases += `${obj["Фраза"]}, `;
			}
			const newGroup = group.map((obj) => {
				const newObj = {};
				newObj["Домен"] = obj["Домен"];
				newObj["Средняя позиция"] = allRepeats / groupLength;
				newObj["Количество повторений"] = groupLength;
				newObj["Все ключи"] = allRepeatsPhrases;
				return newObj;
			});
			return _.take(newGroup);
		})
		.flat();

	return newArr;
};

const createPage2 = (catalog) => {
	const newArr = _.chain(catalog)
		.groupBy("Фраза")
		.values()
		.sortBy("Позиция [KS]")
		.value()
		.map((group) => _.take(_.sortBy(group, ["Позиция [KS]"])))
		.flat();
	return newArr;
};

const createExcelAndCSV = async (array, downloadFolderPath, filePath) => {
	const workbook = XLSX.utils.book_new();
	const worksheet1 = XLSX.utils.json_to_sheet(array);

	const arr2 = createPage2(array);
	const worksheet2 = XLSX.utils.json_to_sheet(arr2);
	const arr3 = createPage3(arr2);

	const worksheet3 = XLSX.utils.json_to_sheet(arr3);

	XLSX.utils.book_append_sheet(workbook, worksheet1, "Страница 1");
	XLSX.utils.book_append_sheet(workbook, worksheet2, "Страница 2");
	XLSX.utils.book_append_sheet(workbook, worksheet3, "Страница 3");

	const fileName = path.basename(filePath);
	const xlxsPath = `${downloadFolderPath}/Обновленная ${fileName}`;

	await XLSX.writeFile(workbook, xlxsPath);
};

const countRepeats = (phrase, catalog) => {
	let i = 0;
	let repeatedLinks = "";
	for (const currentItem of catalog) {
		if (currentItem["Фраза"] === phrase) {
			repeatedLinks += `${currentItem["URL [KS]"]}\n `;
			i += 1;
		}
	}
	return [repeatedLinks, i];
};

const getRepeats = async (item, catalog, foundPhrasesPath) => {
	const foundPhrases = await getData(foundPhrasesPath);
	const phrase = item["Фраза"];
	const [repeatedLinks, repeats] = countRepeats(phrase, catalog);
	item["Количество конкурентов по ключу"] = repeats;
	item["Повторяющиеся ссылки"] = repeatedLinks;
	await createJSON([...foundPhrases, phrase], foundPhrasesPath);

	return item;
};

const getDomainInfo = (link) => {
	let newLink = link?.split("://")[1];
	newLink = newLink.endsWith("/") ? newLink.slice(0, -1) : newLink;
	return {
		Домен: newLink?.split("/")[0],
		Вложенность: newLink.split("/").length,
	};
};

const getPageInfo = async (item, visitedLinksPath, page) => {
	let newItem = {};
	const visitedLinks = await getData(visitedLinksPath);
	const link = item["URL [KS]"];

	if (link in visitedLinks) {
		newItem = { ...item, ...visitedLinks[link] };
	} else {
		let html;

		try {
			await page.goto(link, { waitUntil: "load" }); // Navigate to the provided URL
			html = await page.content(); // Get the page content

			// pageContainer = (await axios.get(link)).data;
		} catch (error) {
			console.log(`Страница ${link} недоступна, ${error}`);
			return item;
		}

		const $ = cheerio.load(html);

		const contentContainer = $("html");
		const H1 = contentContainer.find("h1").text();
		const title = contentContainer.find("title").text();
		const description = contentContainer.find('meta[name="description"]').attr("content");

		const breadcrumbsClasses = [".breadcrumbs", ".breadcrumb", "#breadcrumbs", "#breadcrumb"];

		let breadcrumbs;

		for (const breadcrumbsClass of breadcrumbsClasses) {
			const item = contentContainer.find($(`${breadcrumbsClass}:has(a)`));
			if (item.length > 0) {
				breadcrumbs = item.text().trim();
				break;
			}
		}

		const info = {
			H1,
			Title: title,
			Description: description,
			"Хлебные крошки": breadcrumbs,
		};

		newItem = { ...item, ...info };
		visitedLinks[link] = info;
		await createJSON(visitedLinks, visitedLinksPath);
	}

	return newItem;
};

// eslint-disable-next-line prettier/prettier
const parseItem = async (item, initialCatalog, foundPhrasesPath, visitedLinksPath, page) => {
	let newItem = {};

	const start = new Date().getTime();
	try {
		newItem = await getRepeats(item, initialCatalog, foundPhrasesPath);
		newItem = await getPageInfo(newItem, visitedLinksPath, page);
		newItem = { ...newItem, ...getDomainInfo(item["URL [KS]"]) };
	} catch (error) {
		console.log("Ошибка записи", error);
	}

	const end = new Date().getTime();
	// console.log(`Затрачено ${end - start}мс`);
	return newItem;
};

const parse = async (filePath, downloadFolderPath) => {
	const workbook = XLSX.readFile(filePath);
	const sheetNameList = workbook.SheetNames;
	const initialCatalog = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
	const initialCatalogPath = `${downloadFolderPath}/initialCatalog.json`;
	if (!(await checkJSON(initialCatalogPath))) {
		await createJSON(initialCatalog, initialCatalogPath);
	}

	let i = 1;

	const foundPhrasesPath = `${downloadFolderPath}/foundPhrases.json`;
	if (!(await checkJSON(foundPhrasesPath))) {
		await createJSON([], foundPhrasesPath);
	}

	const visitedLinksPath = `${downloadFolderPath}/visitedLinks.json`;
	if (!(await checkJSON(visitedLinksPath))) {
		await createJSON({}, visitedLinksPath);
	}

	const newCatalog = [];

	const browser = await puppeteer.launch(); // Launch the browser
	const page = await browser.newPage(); // Open a new page
	await page.setUserAgent("Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0");

	for (const item of initialCatalog) {
		// console.log(`Элемент ${i} из ${initialCatalog.length}`);
		try {
			newCatalog.push(await parseItem(item, initialCatalog, foundPhrasesPath, visitedLinksPath, page));
		} catch (error) {
			console.log("Ошибка", error);
			return newCatalog;
		}

		if (i % Math.floor(initialCatalog.length / 100) === 0) {
			await setTimeout(() => {
				process.parentPort.postMessage({ current: i, total: initialCatalog.length });
			}, 0);
		}

		i += 1;
	}

	process.parentPort.postMessage(newCatalog);
	await browser.close(); // Close the browser

	return newCatalog;
};

const startParsing = async (filePath, downloadFolderPath) => {
	console.log(`Старт парсинга`);
	const temporaryFilesPath = `${downloadFolderPath}/temporary files`;
	const newCatalog = await parse(filePath, temporaryFilesPath);
	// const newCatalog = await getData(`${temporaryFilesPath}/newCatalog.json`)

	await createJSON(newCatalog, `${temporaryFilesPath}/newCatalog.json`);
	await createExcelAndCSV(newCatalog, downloadFolderPath, filePath);

	console.log(`Конец парсинга`);
};

module.exports = {
	startParsing,
};
