import {
	DataExtractionResult,
	isExtractedData,
} from "@hediet/debug-visualizer-data-extraction";
import { FormattedMessage } from "../../contract";

export function parseEvaluationResultFromGenericDebugAdapter(
	resultText: string
):
	| { kind: "data"; result: DataExtractionResult }
	| { kind: "error"; message: FormattedMessage } {
	const jsonData = resultText.trim();

	let resultObj;
	try {
		try {
			let jsonData2;
			// Remove optionally enclosing characters.
			if (
				isEnclosedWith(jsonData, '"') ||
				isEnclosedWith(jsonData, "'")
			) {
				// In case of JavaScript: `"{ "kind": { ... }, "text": "some\ntext" }"`
				jsonData2 = jsonData.substr(1, jsonData.length - 2);
			} else {
				// Just in case no quoting is done.
				jsonData2 = jsonData;
			}
			resultObj = parseJson(jsonData2);
		} catch (e) {
			// in case of C++: `"{ \"kind\": { ... }, \"text\": \"some\\ntext\" }"`
			const str = parseJson(jsonData);
			// str is now `{ "kind": { ... }, "text": "some\ntext" }"`
			resultObj = parseJson(str);
			// result is now { kind: { ... }, text: "some\ntext" }
		}

		if (!isExtractedData(resultObj)) {
			return {
				kind: "error",
				message: {
					kind: "list",
					items: [
						"Evaluation result does not match ExtractedData interface.",
						{
							kind: "inlineList",
							items: [
								"Evaluation result was:",
								{
									kind: "code",
									content: JSON.stringify(
										resultObj,
										undefined,
										4
									),
								},
							],
						},
					],
				},
			};
		}
	} catch (e) {
		return {
			kind: "error",
			message: e.message,
		};
	}

	return {
		kind: "data",
		result: {
			availableExtractors: [],
			usedExtractor: {
				id: "generic" as any,
				name: "Generic",
				priority: 1,
			},
			data: resultObj,
		},
	};
}

function isEnclosedWith(str: string, char: string): boolean {
	return str.startsWith(char) && str.endsWith(char);
}

function parseJson(str: string) {
	try {
		return JSON.parse(str);
	} catch (error) {
		throw new FormattedError({
			kind: "list",
			items: [
				"Could not parse evaluation result as JSON:",
				error.message,
				{
					kind: "inlineList",
					items: [
						"Evaluation result was:",
						{
							kind: "code",
							content: str,
						},
					],
				},
			],
		});
	}
}

class FormattedError {
	constructor(public readonly message: FormattedMessage) {}
}
