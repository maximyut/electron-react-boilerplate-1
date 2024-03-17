// const { contextBridge, ipcRenderer } = require('electron');
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
	getInfo: (callback) => ipcRenderer.once("getInfo", callback),
	getCatalog: (callback) => ipcRenderer.once("getCatalog", callback),
	getProgress: (callback) => ipcRenderer.once("getProgress", callback),

	startParsing: () => ipcRenderer.invoke("startParsing"),
	stopParsing: () => ipcRenderer.send("stopParsing"),
	pauseParsing: () => ipcRenderer.send("pauseParsing"),
	continueParsing: () => ipcRenderer.send("continueParsing"),

	createExcel: () => ipcRenderer.invoke("create-excel"),
	store: {
		get(key) {
			return ipcRenderer.sendSync("electron-store-get", key);
		},
		set(property, val) {
			ipcRenderer.send("electron-store-set", property, val);
		},
		delete(key) {
			ipcRenderer.send("electron-store-delete", key);
		},
		clear() {
			ipcRenderer.send("electron-store-clear");
		},
		// Other method you want to add like has(), reset(), etc.
	},
});
