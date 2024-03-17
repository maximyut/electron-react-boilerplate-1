/* eslint-disable react/prop-types */
import * as React from "react";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Checkbox from "@mui/material/Checkbox";

export default function ConfigForm({ config, onConfigChange }) {
	const handleChange = (event) => {
		onConfigChange({
			[event.target.name]: event.target.checked,
		});
	};

	React.useEffect(() => {
		if (config.page3 && !config.page2) {
			onConfigChange({
				page2: true,
			});
		}
	}, [config, onConfigChange]);

	// const { gilad, jason, antoine } = config;

	return (
		<Box sx={{ display: "flex" }}>
			<FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
				<FormLabel component="legend">Выберите нужные вам параметры</FormLabel>
				<FormGroup>
					{Object.keys(config).map((key) => {
						if (typeof config[key] === "boolean") {
							let label,
								disabled,
								helperText = "*";
							if (key === "breadcrumbs") {
								label = "Хлебные крошки";
							} else {
								label = key;
							}

							if (key === "page2" && config.page3) {
								disabled = true;
							}

							switch (key) {
								case "h1":
									helperText += "Сбор тега H1.";
									break;
								case "title":
									helperText += "Сбор заголовка страницы.";
									break;
								case "description":
									helperText += "Сбор описания страницы.";
									break;
								case "breadcrumbs":
									helperText += `Сбор навигации ("хлебных крошек") со страницы при возможности. `;
									break;
									{
										/* case "page2":
									helperText += "Сбор заголовка страницы";
									break;
								case "page3":
									helperText += "Сбор описания страницы";
									break; */
									}
								default:
									label = key;
									helperText = "";
							}

							return (
								<div key={key}>
									<FormControlLabel
										control={
											<Checkbox
												checked={config[key]}
												onChange={handleChange}
												name={key}
												disabled={disabled}
											/>
										}
										label={label}
									/>
									<FormHelperText variant="outlined">{helperText}</FormHelperText>
								</div>
							);
						}
					})}
				</FormGroup>
			</FormControl>
		</Box>
	);
}
