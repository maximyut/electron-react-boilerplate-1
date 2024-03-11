import { useState } from "react";

export default function ConsoleBlock() {
	const [data, setData] = useState([]);
	window.electronAPI.getInfo((event, info) => {
		const obj = {
			date: new Date(),
			milliDate: Date.now(),
			text: info,
		};
		setData([...data, obj]);
	});

	return (
		<div style={{ maxHeight: "30%" }}>
			{data.map(({ date, milliDate, text }) => {
				const textClass = text.includes("Error") ? "text error" : "text";
				return (
					<div className="console-string" key={milliDate}>
						<div className="date">{date.toLocaleString()}:</div>
						<div className={textClass}>{text}</div>
					</div>
				);
			})}
		</div>
	);
}
