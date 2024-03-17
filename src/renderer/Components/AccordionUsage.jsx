import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function AccordionUsage({ title, children }) {
	return (
		<Accordion>
			<AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
				{title}
			</AccordionSummary>
			<AccordionDetails sx={{ overflow: "auto" }}>{children}</AccordionDetails>
		</Accordion>
	);
}
