// const { contextBridge, ipcRenderer } = require('electron');
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
	getInfo: (callback) => ipcRenderer.on("info", callback),
	getCatalog: (callback) => ipcRenderer.on("catalog", callback),
	getProgress: (callback) => ipcRenderer.on("progress", callback),

	openDir: () => ipcRenderer.invoke("dialog:openDir"),
	stopParsing: () => ipcRenderer.invoke("stopParsing"),
});
