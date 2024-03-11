import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import PropTypes from "prop-types";

function BasicTable({ catalog }) {
	const rows = catalog.map((item, i) => {
		return { id: i, ...item };
	});

	const keys = Object.keys(catalog[0]);
	const columns = keys.map((key) => {
		return { field: key, headerName: key };
	});

	return (
		<div style={{ height: 400, width: "100%" }}>
			<DataGrid
				rows={rows}
				columns={columns}
				initialState={{
					pagination: {
						paginationModel: { page: 0, pageSize: 25 },
					},
				}}
				pageSizeOptions={[5, 10, 25, 100]}
				checkboxSelection
			/>
		</div>
	);
}

export default BasicTable;
