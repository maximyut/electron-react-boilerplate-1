/* eslint-disable no-restricted-syntax */
const cheerio = require("cheerio");
// const puppeteer = require('puppeteer-in-electron');
const puppeteer = require("puppeteer");
const PCR = require("puppeteer-chromium-resolver");
const { ipcMain, BrowserWindow } = require("electron");
const _ = require("lodash");

const { getCatalogFromExcel } = require("./excelFunc");
const { default: store } = require("../store");

const createPage3 = (catalog) => {
	let newArr = _.chain(catalog)
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
	newArr = newArr.map((obj, i) => {
		return { id: i, ...obj };
	});

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

const getRepeats = async (item, catalog) => {
	// const foundPhrases = await getData(foundPhrasesPath);
	// let foundPhrases = store.get("foundPhrases");

	const phrase = item["Фраза"];
	const [repeatedLinks, repeats] = countRepeats(phrase, catalog);
	item["Количество конкурентов по ключу"] = repeats;
	item["Повторяющиеся ссылки"] = repeatedLinks;

	// await createJSON([...foundPhrases, phrase], foundPhrasesPath);
	// store.set("foundPhrases", [...foundPhrases, phrase]);
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

const getPageInfo = async (item, page, mainWindow, config) => {
	let newItem = {};
	const info = {};
	const visitedLinks = await store.get("visitedLinks");

	const link = item["URL [KS]"];

	if (link in visitedLinks) {
		newItem = { ...item, ...visitedLinks[link] };
		console.log("Ссылка уже обработана");
	} else {
		let html;

		try {
			await page.goto(link, { waitUntil: "load" }); // Navigate to the provided URL
			html = await page.content(); // Get the page content

			// html = (await axios.get(link)).data;
		} catch (error) {
			mainWindow.webContents.send("getInfo", `Страница ${link} недоступна, ${error}`);
			return item;
		}

		const $ = cheerio.load(html);

		const contentContainer = $("html");
		if (config.h1) {
			info.H1 = contentContainer.find("h1").text() || "";
		}
		if (config.title) {
			info.title = contentContainer.find("title").text() || "";
		}

		if (config.title) {
			info.description = contentContainer.find('meta[name="description"]').attr("content") || "";
		}
		if (config.breadcrumbs) {
			const breadcrumbsClasses = [".breadcrumbs", ".breadcrumb", "#breadcrumbs", "#breadcrumb"];

			let breadcrumbs;

			for (const breadcrumbsClass of breadcrumbsClasses) {
				const item = contentContainer.find($(`${breadcrumbsClass}:has(a)`));
				if (item.length > 0) {
					breadcrumbs = item.text().trim();
					break;
				}
			}
			info["Хлебные крошки"] = breadcrumbs;
		}

		newItem = { ...item, ...info };
		visitedLinks[link] = info;

		store.set("visitedLinks", visitedLinks);
	}

	return newItem;
};

// eslint-disable-next-line prettier/prettier
const parseItem = async (item, initialCatalog, page, mainWindow, config) => {
	let newItem = {};

	try {
		newItem = await getRepeats(item, initialCatalog);
		newItem = await getPageInfo(newItem, page, mainWindow, config);
		newItem = { ...newItem, ...getDomainInfo(item["URL [KS]"]) };
	} catch (error) {
		mainWindow.webContents.send("getInfo", `Ошибка записи: ${error}`);
	}

	return newItem;
};

const parse = async (filePath, mainWindow, config) => {
	mainWindow.webContents.send("getInfo", `parse`);
	let initialCatalog;

	if (!store.has("initialCatalog")) {
		try {
			initialCatalog = await getCatalogFromExcel(filePath);
		} catch (error) {
			mainWindow.webContents.send("getInfo", ` Нет каталога, ${error}, ${filePath}`);
			return;
		}
		store.set("initialCatalog", initialCatalog);
	} else {
		initialCatalog = store.get("initialCatalog");
	}

	if (!store.has("visitedLinks")) {
		store.set("visitedLinks", {});
	}

	let i = 1;

	const newCatalog = [];
	try {
		const options = {};
		const stats = await PCR(options);
		const browser = await stats.puppeteer
			.launch({
				headless: true,
				executablePath: stats.executablePath,
			})
			.catch((error) => {
				console.log(error);
				mainWindow.webContents.send("getInfo", ` нет запуска браузера:${error}`);
			});
		// browser = await puppeteer
		// 	.launch()
		// 	.then(() => {
		// 		mainWindow.webContents.send("getInfo", ` запуска браузера: `);
		// 	})
		// 	.catch((err) => {
		// 		mainWindow.webContents.send("getInfo", ` нет запуска браузера:${err}`);
		// 	}); // Launch the browser
		const page = await browser.newPage(); // Open a new page
		mainWindow.webContents.send("getInfo", ` запуска страницы: `);
		await page.setUserAgent("Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0");
		let stopParsing,
			pausedElement = 0;

		ipcMain.on("stopParsing", async () => {
			stopParsing = true;
			pausedElement = store.delete("pausedElement");
		});

		ipcMain.on("pauseParsing", async () => {
			stopParsing = true;
			store.set("pausedElement", i);
		});

		if (store.has("pausedElement")) {
			pausedElement = store.get("pausedElement");
		}

		for (const item of initialCatalog) {
			// mainWindow.webContents.send("getInfo", `Элемент ${i} из ${initialCatalog.length}`)
			if (i >= pausedElement) {
				console.log(`Элемент ${i} из ${initialCatalog.length}`);
				mainWindow.webContents.send("getInfo", `Элемент ${i} из ${initialCatalog.length}`);
				try {
					newCatalog.push({ id: i, ...(await parseItem(item, initialCatalog, page, mainWindow, config)) });
				} catch (error) {
					mainWindow.webContents.send(
						"getInfo",
						`Элемент ${i} из ${initialCatalog.length} \n Ошибка: ${error}`,
					);
					return newCatalog;
				}
				if (i % Math.floor(initialCatalog.length / 1000) === 0) {
					mainWindow.webContents.send("getProgress", { current: i, total: initialCatalog.length });
				}
				if (stopParsing) {
					break;
				}
			}

			i += 1;
		}

		if (i === initialCatalog.length) {
			store.delete("pausedElement");
		}

		await browser.close(); // Close the browser

		return newCatalog;
	} catch (error) {
		mainWindow.webContents.send("getInfo", `Ошибка запуска браузера: ${error.message}`);
	}
};

const startParsing = async (filePath) => {
	console.log(`Старт парсинга`);
	const mainWindow = BrowserWindow.fromId(1);

	mainWindow.webContents.send("getInfo", `Старт парсинга`);
	const config = store.get("config");

	const pages = [];
	let catalog2, catalog3;
	try {
		const mainCatalog = await parse(filePath, mainWindow, config);
		console.log(mainCatalog);
		pages.push(mainCatalog);

		if (config.page2) {
			catalog2 = createPage2(mainCatalog);
			pages.push(catalog2);
		}
		if (config.page3) {
			catalog3 = createPage3(catalog2);
			pages.push(catalog3);
		}
		mainWindow.webContents.send("getCatalog", pages);
		store.set("pages", pages);
	} catch (error) {
		mainWindow.webContents.send("getInfo", `ошибка парсинга: ${error}`);
	}

	mainWindow.webContents.send("getInfo", `Конец парсинга`);
	console.log(`Конец парсинга`);
	return pages;
};

module.exports = {
	startParsing,
};
