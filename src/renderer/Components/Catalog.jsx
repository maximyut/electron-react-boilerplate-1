import { useMemo, useState, memo } from "react";
import BasicTable from "./BasicTable";
import ProgressBar from "./ProgressBar";

const Catalog = memo(() => {
	const [catalog, setCatalog] = useState();
	const [current, setCurrent] = useState(0);
	const [total, setTotal] = useState();

	window.electronAPI.getCatalog((event, data) => {
		setCatalog(data);
	});
	window.electronAPI.getProgress((event, data) => {
		setCurrent(data.current);
		if (!total) {
			setTotal(data.total);
		}
	});

	const percentage = useMemo(() => {
		// Вычисление дорогостоящей функции
		const result = Math.round((current / total) * 100);
		console.log(result);
		if (result) {
			return result;
		}
		return 0;
	}, [current, total]);
	console.log("render catalog");

	if (catalog) {
		return <BasicTable catalog={catalog} />;
	}
	return <ProgressBar current={percentage} />;
});

export default Catalog;
