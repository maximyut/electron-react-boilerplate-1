import Store from "electron-store";

const schema = {
	config: {
		type: "object",
		properties: {
			h1: {
				type: "boolean",
				default: false,
			},
			title: {
				type: "boolean",
				default: false,
			},
			description: {
				type: "boolean",
				default: false,
			},

			breadcrumbs: {
				type: "boolean",
				default: false,
			},
			page2: {
				type: "boolean",
				default: false,
			},
			page3: {
				type: "boolean",
				default: false,
			},
			domains: {
				type: "array",
				items: {
					type: "string",
					format: "url",
				},
			},
		},
		required: ["h1", "title", "description", "page2"],
	},
	stopParsing: {
		type: "boolean",
		default: false,
	},
	pausedElement: {
		type: "number",
		default: 0,
	},
	pages: {
		type: "array",
		items: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: {
						type: "number",
					},
				},
			},
		},
	},
};

const defaults = {
	config: {
		h1: false,
		title: false,
		description: false,
		breadcrumbs: false,
		page2: false,
		page3: false,
	},
	stopParsing: false,
	pausedElement: 0,
	pages: [],
};

const store = new Store({ defaults, schema });
store.clear()
export default store;
