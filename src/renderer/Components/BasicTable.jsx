import { useCallback, useEffect, useRef, useState } from "react";
import { DataGrid, GridActionsCellItem, GridRowEditStopReasons, ruRU } from "@mui/x-data-grid";
import PropTypes from "prop-types";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from "@mui/material";

const useFakeMutation = () => {
	return useCallback(
		(user) =>
			new Promise((resolve, reject) => {
				setTimeout(() => {
					if (user.id?.trim() === "") {
						reject();
					} else {
						resolve(user);
					}
				}, 200);
			}),
		[],
	);
};

function computeMutation(newRow, oldRow) {
	if (newRow.id !== oldRow.id) {
		return `Name from '${oldRow.id}' to '${newRow.id}'`;
	}
	if (newRow.age !== oldRow.age) {
		return `Age from '${oldRow.age || ""}' to '${newRow.age || ""}'`;
	}
	return null;
}

// eslint-disable-next-line react/prop-types
function BasicTable({ catalog }) {
	const mutateRow = useFakeMutation();

	const [rows, setRows] = useState(catalog);
	const [rowModesModel, setRowModesModel] = useState({});
	const [snackbar, setSnackbar] = useState(null);
	const noButtonRef = useRef(null);
	const [promiseArguments, setPromiseArguments] = useState(null);

	const keys = Object.keys(catalog[0]);

	const handleDeleteClick = (id) => () => {
		setRows(rows.filter((row) => row.id !== id));
	};

	const handleRowEditStop = (params, event) => {
		if (params.reason === GridRowEditStopReasons.rowFocusOut) {
			event.defaultMuiPrevented = true;
		}
	};

	// const processRowUpdate = (newRow) => {
	// 	const updatedRow = { ...newRow, isNew: false };
	// 	setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
	// 	return updatedRow;
	// };

	const processRowUpdate = useCallback(
		(newRow, oldRow) =>
			new Promise((resolve, reject) => {
				const mutation = computeMutation(newRow, oldRow);
				if (mutation) {
					// Save the arguments to resolve or reject the promise later
					setPromiseArguments({ resolve, reject, newRow, oldRow });
				} else {
					resolve(oldRow); // Nothing was changed
				}
			}),
		[],
	);

	const handleRowModesModelChange = (newRowModesModel) => {
		setRowModesModel(newRowModesModel);
	};

	const handleCloseSnackbar = () => setSnackbar(null);

	const handleNo = () => {
		const { oldRow, resolve } = promiseArguments;
		resolve(oldRow); // Resolve with the old row to not update the internal state
		setPromiseArguments(null);
	};

	const handleYes = async () => {
		const { newRow, oldRow, reject, resolve } = promiseArguments;

		try {
			// Make the HTTP request to save in the backend
			const response = await mutateRow(newRow);
			setSnackbar({ children: "User successfully saved", severity: "success" });
			resolve(response);
			setPromiseArguments(null);
		} catch (error) {
			setSnackbar({ children: "Name can't be empty", severity: "error" });
			reject(oldRow);
			setPromiseArguments(null);
		}
	};

	const handleEntered = () => {
		// The `autoFocus` is not used because, if used, the same Enter that saves
		// the cell triggers "No". Instead, we manually focus the "No" button once
		// the dialog is fully open.
		// noButtonRef.current?.focus();
	};

	const renderConfirmDialog = () => {
		if (!promiseArguments) {
			return null;
		}

		const { newRow, oldRow } = promiseArguments;
		const mutation = computeMutation(newRow, oldRow);

		return (
			<Dialog maxWidth="xs" TransitionProps={{ onEntered: handleEntered }} open={!!promiseArguments}>
				<DialogTitle>Are you sure?</DialogTitle>
				<DialogContent dividers>{`Pressing 'Yes' will change ${mutation}.`}</DialogContent>
				<DialogActions>
					<Button ref={noButtonRef} onClick={handleNo}>
						No
					</Button>
					<Button onClick={handleYes}>Yes</Button>
				</DialogActions>
			</Dialog>
		);
	};

	const columns = [
		...keys.map((key) => {
			return { field: key, headerName: key, width: 200, editable: true };
		}),
		// {
		// 	field: "actions",
		// 	type: "actions",
		// 	headerName: "Actions",
		// 	width: 100,
		// 	cellClassName: "actions",
		// 	getActions: ({ id }) => {
		// 		return [
		// 			<GridActionsCellItem
		// 				icon={<DeleteIcon />}
		// 				label="Delete"
		// 				onClick={handleDeleteClick(id)}
		// 				color="inherit"
		// 			/>,
		// 		];
		// 	},
		// },
	];
	console.log(rows);
	return (
		<div style={{ width: "100%", height: "800px" }}>
			{renderConfirmDialog()}
			<DataGrid
				// editMode="cell"
				rows={rows}
				columns={columns}
				getRowHeight={() => "auto"}
				getEstimatedRowHeight={() => 200}
				initialState={{
					pagination: {
						paginationModel: { page: 0, pageSize: 25 },
					},
				}}
				pageSizeOptions={[10, 25, 50, 100]}
				localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
				rowModesModel={rowModesModel}
				onRowModesModelChange={handleRowModesModelChange}
				onRowEditStop={handleRowEditStop}
				processRowUpdate={processRowUpdate}
				slotProps={{
					toolbar: { setRows, setRowModesModel },
				}}
			/>
			{!!snackbar && (
				<Snackbar open onClose={handleCloseSnackbar} autoHideDuration={6000}>
					<Alert {...snackbar} onClose={handleCloseSnackbar} />
				</Snackbar>
			)}
		</div>
	);
}

export default BasicTable;
