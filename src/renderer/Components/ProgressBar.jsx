import * as React from "react";
import PropTypes from "prop-types";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const LinearProgressWithLabel = React.memo(({ current }) => {
	return (
		<Box sx={{ display: "flex", alignItems: "center" }}>
			<Box sx={{ width: "100%", mr: 1 }}>
				<LinearProgress variant="determinate" value={current} />
			</Box>
			<Box sx={{ minWidth: 35 }}>
				<Typography variant="body1" color="text.secondary">{`${current}%`}</Typography>
			</Box>
		</Box>
	);
});

LinearProgressWithLabel.propTypes = {
	/**
	 * The value of the progress indicator for the determinate and buffer variants.
	 * Value between 0 and 100.
	 */
	current: PropTypes.number.isRequired,
	// total: PropTypes.number.isRequired,
};

export default function ProgressBar({ current }) {
	return (
		<Box sx={{ width: "100%" }}>
			<LinearProgressWithLabel current={current} />
		</Box>
	);
}

ProgressBar.propTypes = {
	/**
	 * The value of the progress indicator for the determinate and buffer variants.
	 * Value between 0 and 100.
	 */
	current: PropTypes.number.isRequired,
	// total: PropTypes.number.isRequired,
};
