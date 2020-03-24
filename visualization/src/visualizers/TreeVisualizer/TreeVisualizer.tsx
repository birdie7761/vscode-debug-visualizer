import {
	TreeViewModel,
	TreeNodeViewModel,
	TreeView,
	TreeWithPathView,
} from "./Views";
import {
	ExtractedData,
	isCommonDataType,
	TreeNode,
} from "@hediet/debug-visualizer-data-extraction";
import {
	Visualizer,
	VisualizationCollector,
	asVisualizationId,
} from "../../Visualizer";
import * as React from "react";

export class TreeVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { tree: true })) {
			collector.addVisualization({
				id: asVisualizationId("tree"),
				name: "Tree",
				priority: 100,
				render() {
					const m = createTreeViewModelFromTreeNodeData(data.root);
					return <TreeWithPathView model={m} />;
				},
			});
		}
	}
}

export function createTreeViewModelFromTreeNodeData<TData>(
	root: TreeNode<TData>
): TreeViewModel<TData> {
	const m = new TreeViewModel<TData>();
	m.root = recurse(root, m);
	return m;

	function recurse(
		node: TreeNode<TData>,
		viewModel: TreeViewModel<TData>
	): TreeNodeViewModel<TData> {
		const children: TreeNodeViewModel<TData>[] = node.children.map(c =>
			recurse(c, viewModel)
		);
		const model = new TreeNodeViewModel<TData>(
			viewModel,
			node.id,
			node.name,
			node.value,
			node.emphasizedValue,
			children,
			node.data
		);
		model.isMarked = !!node.isMarked;
		for (const c of children) {
			c.parent = model;
		}
		return model;
	}
}
