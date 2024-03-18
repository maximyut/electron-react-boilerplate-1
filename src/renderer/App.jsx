import { MemoryRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";

import { Container } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import AccordionUsage from "./Components/AccordionUsage";
import ConsoleBlock from "./Components/Console";

import Catalog from "./Components/Catalog";

function StartPage() {
	return (
		<Grid container direction="column" spacing={2} sx={{ height: "100%" }} wrap="nowrap">
			<Grid xs={12} flexGrow={7} flexShrink={7}>
				<Catalog />
			</Grid>
			<Grid xs={12} flexGrow={3} flexShrink={3}>
				<AccordionUsage title="Консоль">
					<ConsoleBlock />
				</AccordionUsage>
			</Grid>
		</Grid>
	);
}

export default function App() {
	return (
		<Container maxWidth={false} sx={{ height: "100vh", padding: 2, maxHeight: "100vh" }}>
			<Router>
				<Routes>
					<Route path="/" element={<StartPage />} />
				</Routes>
			</Router>
		</Container>
	);
}
