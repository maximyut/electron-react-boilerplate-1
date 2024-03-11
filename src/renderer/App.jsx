import { MemoryRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import { memo, useEffect, useMemo, useState } from "react";
import { Button, Container, Stack } from "@mui/material";

import AccordionUsage from "./Components/AccordionUsage";
import ConsoleBlock from "./Components/Console";
import Catalog from "./Components/Catalog";

function Hello() {
	const [fileDir, setFileDir] = useState("");

	const openFile = async () => {
		const dirPath = await window.electronAPI.openDir();
		setFileDir(dirPath);
	};

	return (
		<Stack direction="row" spacing={2} alignItems="center">
			<Button type="button" id="btn" onClick={openFile}>
				Выбрать файл и начать парсинг.
			</Button>
			<div>
				Путь до файла: <strong id="dirPath">{fileDir}</strong>
			</div>
		</Stack>
	);
}

function StartPage() {
	return (
		<Stack justifyContent="space-between">
			<Hello />
			<Catalog />
			<AccordionUsage title="Консоль">
				<ConsoleBlock />
			</AccordionUsage>
		</Stack>
	);
}

export default function App() {
	return (
		<Container>
			<Router>
				<Routes>
					<Route path="/" element={<StartPage />} />
				</Routes>
			</Router>
		</Container>
	);
}
