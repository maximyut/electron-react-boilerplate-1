import { Button, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";
import ConfigForm from "./ConfigForm";

export default function BeginParsing({ continueParsing }) {
	const [fileDir, setFileDir] = useState("");
	const [current, setCurrent] = useState(0);
	const [total, setTotal] = useState();
	const [parsing, setParsing] = useState(false);
	const [config, setConfig] = useState(window.electronAPI.store.get("config"));

	const openFile = async () => {
		const dirPath = await window.electronAPI.startParsing();
		window.electronAPI.store.set("config", config);
		setParsing(true);
		setFileDir(dirPath);
	};
	if (parsing) {
		window.electronAPI.getProgress((event, data) => {
			setCurrent(data.current);

			if (!total) {
				setTotal(data.total);
			}
		});
	}

	useEffect(() => {
		if (continueParsing) {
			setParsing(true);
		}
	}, [continueParsing]);

	const percentage = useMemo(() => {
		// Вычисление дорогостоящей функции
		const result = Number(Number((current / total) * 100).toFixed(1));

		if (result && !Number.isNaN(result)) {
			return result;
		}
		return 0.0;
	}, [current, total]);
	const pauseParsing = () => {
		window.electronAPI.pauseParsing();
		setParsing(false);
	};
	const stopParsing = () => {
		window.electronAPI.stopParsing();
		setParsing(false);
	};

	const handleClick = () => {
		onFunctionCall("Данные из дочернего компонента");
	};

	const handleConfigChange = (newConfig) => {
		setConfig({
			...config,
			...newConfig,
		});
	};

	return (
		<Stack spacing={4}>
			<Stack spacing={2}>
				<ConfigForm config={config} onConfigChange={handleConfigChange} />
				<Stack direction="row" spacing={2} alignItems="center">
					{parsing ? (
						<>
							<Button variant="contained" onClick={pauseParsing}>
								Приостановить парсинг
							</Button>
							<Button variant="contained" onClick={stopParsing}>
								Окончить парсинг
							</Button>
						</>
					) : (
						<Button variant="contained" onClick={openFile}>
							Выбрать файл и начать парсинг
						</Button>
					)}
				</Stack>
				<div>
					Путь до файла: <strong>{fileDir}</strong>
				</div>
			</Stack>
			<div>
				Статус парсинга: <strong>{parsing ? "В процессе" : "Не запущен"}</strong>
			</div>
			<ProgressBar current={percentage} />
		</Stack>
	);
}
