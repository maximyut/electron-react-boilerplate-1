/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */

import path from "path";
import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

import MenuBuilder from "./menu";
import { resolveHtmlPath } from "./util";
import { start } from "./parser/start";
import { createExcelAndCSV } from "./parser/excelFunc";
import store from "./store";

class AppUpdater {
	constructor() {
		log.transports.file.level = "info";
		autoUpdater.logger = log;
		autoUpdater.checkForUpdatesAndNotify();
	}
}

let mainWindow;

if (process.env.NODE_ENV === "production") {
	// eslint-disable-next-line global-require
	const sourceMapSupport = require("source-map-support");
	sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDebug) {
	// eslint-disable-next-line global-require
	require("electron-debug")();
}

const installExtensions = async () => {
	// eslint-disable-next-line global-require
	const installer = require("electron-devtools-installer");
	const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
	const extensions = ["REACT_DEVELOPER_TOOLS"];

	return installer
		.default(
			extensions.map((name) => installer[name]),
			forceDownload,
		)
		.catch(console.log);
};

const createWindow = async () => {
	if (isDebug) {
		await installExtensions();
	}

	const RESOURCES_PATH = app.isPackaged
		? path.join(process.resourcesPath, "assets")
		: path.join(__dirname, "../../assets");

	const getAssetPath = (...paths) => {
		return path.join(RESOURCES_PATH, ...paths);
	};

	mainWindow = new BrowserWindow({
		show: false,
		width: 1024,
		height: 728,
		minWidth: 700,
		minHeight: 500,
		icon: getAssetPath("icon.png"),
		webPreferences: {
			preload: app.isPackaged
				? path.join(__dirname, "preload.js")
				: path.join(__dirname, "../../.erb/dll/preload.js"),
		},
	});

	mainWindow.loadURL(resolveHtmlPath("index.html"));

	mainWindow.on("ready-to-show", () => {
		if (!mainWindow) {
			throw new Error('"mainWindow" is not defined');
		}
		if (process.env.START_MINIMIZED) {
			mainWindow.minimize();
		} else {
			mainWindow.show();
		}
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	const menuBuilder = new MenuBuilder(mainWindow);
	menuBuilder.buildMenu();

	// Open urls in the user's browser
	mainWindow.webContents.setWindowOpenHandler((edata) => {
		shell.openExternal(edata.url);
		return { action: "deny" };
	});

	// Remove this if your app does not use auto updates
	// eslint-disable-next-line
	new AppUpdater();
};

const startParsing = (dirPaths) => {
	start(dirPaths);
};

// eslint-disable-next-line consistent-return
async function handleDirOpen() {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ["openFile"],
		filters: [
			{
				name: "Таблица",
				extensions: ["xlsx", "xls", "xlsb" /* ... other formats ... */],
			},
		],
	});

	if (!canceled) {
		store.set("filePath", filePaths[0]);
		startParsing(filePaths[0]);
		return filePaths[0];
	}
}

/**
 * Add event listeners...
 */

// IPC listener
ipcMain.on("electron-store-get", async (event, key) => {
	event.returnValue = store.get(key);
});
ipcMain.on("electron-store-set", async (event, key, val) => {
	store.set(key, val);
});

ipcMain.on("electron-store-delete", async (event, key) => {
	store.delete(key);
});

ipcMain.on("electron-store-clear", async () => {
	store.clear();
});

ipcMain.handle("create-excel", async () => {
	const storedFilePath = store.get("filePath");
	const dirname = path.dirname(storedFilePath);
	const basename = path.basename(storedFilePath);

	const options = {
		title: "Сохранить",
		buttonLabel: "Сохранить как",
		defaultPath: `${dirname}/Обновленная ${basename}`,
		filters: [{ name: "All files", extensions: [".xlsx"] }],
	};
	dialog
		.showSaveDialog(options)
		.then((filename) => {
			const { canceled, filePath } = filename;
			console.log(filePath);
			// eslint-disable-next-line promise/always-return
			if (!canceled) {
				createExcelAndCSV(store.get("pages"), filePath);
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

ipcMain.handle("startParsing", handleDirOpen);

ipcMain.on("continueParsing", async () => {
	startParsing(store.get("filePath"));
});

app.on("window-all-closed", () => {
	// Respect the OSX convention of having the application in memory even
	// after all windows have been closed
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.whenReady()
	// eslint-disable-next-line promise/always-return
	.then(() => {
		createWindow();
		app.on("activate", () => {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (mainWindow === null) {
				createWindow();
			}
		});
	})
	.catch(console.log);
// eslint-disable-next-line import/prefer-default-export
