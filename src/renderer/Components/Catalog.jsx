import { useState, memo, useEffect, useRef } from "react";
import { Button, Stack } from "@mui/material";

import BeginParsing from "./BeginParsing";
import BasicTabs from "./Tabs";

const Catalog = memo(() => {
	const [pages, setPages] = useState();
	const [continueParsing, setContinueParsing] = useState(false);

	const storePages = useRef();

	// const pausedElement = useRef();
	const [pausedElement, setPausedElement] = useState(0);

	useEffect(() => {
		storePages.current = window.electronAPI.store.get("pages");
		// pausedElement.current = window.electronAPI.store.get("pausedElement");

		setPausedElement(window.electronAPI.store.get("pausedElement"));
	}, []);

	useEffect(() => {
		if (storePages.current) {
			setPages(storePages.current);
			setPausedElement(window.electronAPI.store.get("pausedElement"));
		}
	}, [storePages]);

	window.electronAPI.getCatalog((event, data) => {
		setPages(data);
	});

	const saveCatalog = () => {
		window.electronAPI.createExcel();
	};

	const clearCatalog = () => {
		window.electronAPI.store.clear();
		setPages(undefined);
	};

	const handleContinueParsing = () => {
		window.electronAPI.continueParsing();
		setPages(undefined);
		setContinueParsing(true);
	};
	if (pages && pages.length > 0) {
		return (
			<Stack spacing={2} height="100%">
				<Stack direction="row" spacing={2}>
					<Button variant="contained" onClick={saveCatalog}>
						Сохранить каталог
					</Button>
					{pausedElement ? (
						<Button variant="contained" onClick={handleContinueParsing}>
							Возобновить парсинг
						</Button>
					) : null}

					<Button variant="contained" onClick={clearCatalog}>
						Очистить каталог
					</Button>
				</Stack>
				<BasicTabs pages={pages} />
			</Stack>
		);
	}

	return <BeginParsing continueParsing={continueParsing} />;
});

export default Catalog;
