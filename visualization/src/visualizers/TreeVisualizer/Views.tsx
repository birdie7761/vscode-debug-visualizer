import { observer, disposeOnUnmount } from "mobx-react";
import { observable, autorun, computed, action, runInAction } from "mobx";
import * as React from "react";
import * as classNames from "classnames";
import { Rectangle, Point } from "../../utils/Point";
import { SvgLine } from "../../utils/SvgElements";
// import "./style.scss";

export class TreeViewModel<TData = unknown> {
	private started = true;
	start() {
		this.started = true;
		this.updateOffsets();
	}
	stop() {
		this.started = false;
	}

	private version = 0;
	private lastUpdateVersion = -1;

	@observable public root: TreeNodeViewModel<TData> | undefined = undefined;

	public invalidateOffsets() {
		this.version++;
	}

	@action
	public updateOffsets() {
		if (!this.started) {
			return;
		}
		if (!this.root) {
			return;
		}
		if (this.lastUpdateVersion === this.version) {
			return;
		}

		this.lastUpdateVersion = this.version;
		console.log("update");
		this.root.updateOffsets();
	}

	public get marked(): TreeNodeViewModel<TData>[] {
		const result = new Array<TreeNodeViewModel<TData>>();
		function recurse(node: TreeNodeViewModel<TData>) {
			if (node.isMarked) {
				result.push(node);
			}
			for (const c of node.children) {
				recurse(c);
			}
		}
		if (this.root) {
			recurse(this.root);
		}
		return result;
	}

	@observable selected: TreeNodeViewModel<TData> | undefined = undefined;

	@action public select(current: TreeNodeViewModel<TData> | undefined) {
		if (this.selected === current) {
			return;
		}
		if (this.selected) {
			this.selected.isSelected = false;
		}
		if (current) {
			current.isSelected = true;
		}
		this.selected = current;
	}

	@action public toggleSelect(current: TreeNodeViewModel<TData>) {
		if (this.selected === current) {
			this.select(undefined);
		} else {
			this.select(current);
		}
	}

	private selectOnHoverEnabled = false;
	private selectedBeforeHover:
		| TreeNodeViewModel<TData>
		| undefined = undefined;

	@action public handleHoverEvent(
		current: TreeNodeViewModel<TData> | undefined
	) {
		if (this.selectOnHoverEnabled) {
			if (current) {
				this.select(current);
			} else {
				this.select(this.selectedBeforeHover);
			}
		}
	}

	setSelectOnHover(enable: boolean) {
		if (this.selectOnHoverEnabled === enable) {
			return;
		}

		if (enable) {
			this.selectedBeforeHover = this.selected;
		} else if (!this.selected) {
			this.select(this.selectedBeforeHover);
		}

		this.selectOnHoverEnabled = enable;
	}
}

let i = 0;

export class TreeNodeViewModel<TData = unknown> {
	public parent: TreeNodeViewModel<TData> | null = null;

	constructor(
		public readonly treeViewModel: TreeViewModel<TData>,
		public readonly id: string | undefined,
		public readonly name: string,
		public readonly value: string | undefined,
		public readonly emphasizedValue: string | undefined,
		public readonly children: TreeNodeViewModel<TData>[],
		public readonly data: TData
	) {}

	@observable expanderOffsetRect: Rectangle | undefined = undefined;
	private expanderDiv: HTMLDivElement | null = null;

	@action.bound
	setExpanderDiv(div: HTMLDivElement | null) {
		this.expanderDiv = div;
		this.treeViewModel.invalidateOffsets();
	}

	@observable public expanded: boolean = false;
	@observable public isMarked: boolean = false;
	@observable public isSelected: boolean = false;

	@action
	public toggleExpanded() {
		this.expanded = !this.expanded;
		this.treeViewModel.invalidateOffsets();
	}

	@computed public get isChildOrThisMarked(): boolean {
		if (this.isMarked) return true;
		return this.children.some(c => c.isChildOrThisMarked);
	}

	@computed public get isChildOrThisSelected(): boolean {
		if (this.isSelected) return true;
		return this.children.some(c => c.isChildOrThisSelected);
	}

	@computed public get isParentOrThisSelected(): boolean {
		if (this.isSelected) return true;
		if (this.parent) return this.parent.isParentOrThisSelected;
		return false;
	}

	get path(): string[] {
		const result = new Array<string>();
		let c: TreeNodeViewModel = this;
		while (c.parent) {
			result.unshift(c.id || c.name);
			c = c.parent;
		}
		if (result.length === 0) {
			result.push("root");
		}
		return result;
	}

	updateOffsets() {
		for (const c of this.children) {
			c.updateOffsets();
		}

		if (!this.expanderDiv) {
			return;
		}
		const newRect = Rectangle.ofSize(
			new Point(this.expanderDiv.offsetLeft, this.expanderDiv.offsetTop),
			new Point(
				this.expanderDiv.offsetWidth,
				this.expanderDiv.offsetHeight
			)
		);
		if (
			!this.expanderOffsetRect ||
			!newRect.equals(this.expanderOffsetRect)
		) {
			this.expanderOffsetRect = newRect;
		}
	}
}

const isValidFunctionName = (function() {
	var validName = /^[$A-Z_][0-9A-Z_$]*$/i;
	var reserved = {
		abstract: true,
		boolean: true,
		// ...
		with: true,
	} as any;
	return function(s: string) {
		// Ensure a valid name and not reserved.
		return validName.test(s) && !reserved[s];
	};
})();

@observer
export class TreeWithPathView extends React.Component<{
	model: TreeViewModel;
}> {
	render() {
		const model = this.props.model;
		return (
			<div className="component-TreeWithPathView">
				<div className="part-path">
					<span>
						{model.selected ? (
							<span>
								{model.selected.path.reduce((acc, v) => {
									acc = acc.slice();
									function add() {
										acc.push(
											<span
												className="part-path-item"
												key={acc.length}
											>
												{v}
											</span>
										);
									}
									if (isValidFunctionName(v)) {
										if (acc.length > 0) {
											acc.push(
												<span key={acc.length}>.</span>
											);
										}
										add();
									} else {
										acc.push(
											<span key={acc.length}>[</span>
										);
										add();
										acc.push(
											<span key={acc.length}>]</span>
										);
									}

									return acc;
								}, new Array<React.ReactElement>())}
							</span>
						) : (
							"(Nothing Selected)"
						)}
					</span>
				</div>
				<div className="part-tree">
					<TreeView model={model} />
				</div>
			</div>
		);
	}
}

@observer
export class TreeView extends React.Component<{ model: TreeViewModel }> {
	componentWillUpdate(newProps: this["props"]) {
		newProps.model.stop();
	}

	componentWillMount() {
		this.props.model.stop();
	}

	componentDidUpdate() {
		this.props.model.start();
	}

	componentDidMount() {
		this.props.model.start();
	}

	render() {
		const model = this.props.model;
		return (
			<div
				tabIndex={0}
				className="component-TreeView"
				onKeyDown={e => {
					if (e.keyCode === 18) {
						// alt
						e.preventDefault();
						e.stopPropagation();
						model.setSelectOnHover(true);
					}
				}}
				onKeyUp={e => {
					if (e.keyCode === 18) {
						// alt
						e.preventDefault();
						e.stopPropagation();
						model.setSelectOnHover(false);
					}
				}}
			>
				{model.root && (
					<>
						<svg className="part-svg">
							<TreeNodeSvgView model={model.root} />
						</svg>
						<div className="part-node">
							<TreeNodeView model={model.root} />
						</div>
					</>
				)}
			</div>
		);
	}
}

@observer
export class TreeNodeSvgView extends React.Component<{
	model: TreeNodeViewModel;
}> {
	render() {
		const model = this.props.model;
		if (
			!model.expanderOffsetRect ||
			model.children.length === 0 ||
			model.expanded
		) {
			return <g />;
		}

		function findLastExpanderOffset(
			predicate: (v: TreeNodeViewModel) => boolean
		): Rectangle | undefined {
			const all = model.children
				.filter(predicate)
				.map(c => c.expanderOffsetRect);
			const last = all[all.length - 1];
			return last;
		}

		const lastOffset = findLastExpanderOffset(() => true);
		const selectedOffset = findLastExpanderOffset(
			v => v.isChildOrThisSelected
		);
		const markedOffset = findLastExpanderOffset(v => v.isChildOrThisMarked);

		if (!lastOffset) {
			return <g />;
		}

		const start = model.expanderOffsetRect.center.add({ y: 10 });

		return (
			<g className="component-TreeNodeSvgView">
				{markedOffset && (
					<SvgLine
						className="path childOrThisMarked"
						start={start}
						end={new Point(start.x, markedOffset.center.y)}
					/>
				)}
				{selectedOffset && (
					<SvgLine
						className="path childOrThisSelected"
						start={start}
						end={new Point(start.x, selectedOffset.center.y)}
					/>
				)}
				<SvgLine
					className="path"
					start={start}
					end={new Point(start.x, lastOffset.center.y)}
				/>
				{model.children.map((c, idx) => {
					const end = c.expanderOffsetRect!.center.sub({ x: 5 });

					return (
						<g key={idx}>
							{c.isChildOrThisMarked && (
								<SvgLine
									className={classNames(
										"path",
										"childOrThisMarked"
									)}
									start={new Point(start.x, end.y)}
									end={end}
								/>
							)}
							<SvgLine
								className={classNames(
									"path",
									c.isChildOrThisSelected &&
										"childOrThisSelected"
								)}
								start={new Point(start.x, end.y)}
								end={end}
							/>
						</g>
					);
				})}
				{model.children.map((c, idx) => (
					<TreeNodeSvgView key={idx} model={c} />
				))}
			</g>
		);
	}
}

@observer
export class TreeNodeView extends React.Component<{
	model: TreeNodeViewModel;
}> {
	@action.bound
	private clickHandler() {
		this.props.model.treeViewModel.toggleSelect(this.props.model);
	}

	private handleMouseEnterOrLeave(enter: boolean) {
		this.props.model.treeViewModel.handleHoverEvent(
			enter ? this.props.model : undefined
		);
	}

	@observable
	private rootDiv: HTMLElement | null = null;
	@action.bound
	private setRootDiv(div: HTMLElement | null) {
		this.rootDiv = div;
	}

	@disposeOnUnmount
	private readonly _autorun = autorun(() => {
		if (this.props.model.isMarked && this.rootDiv) {
			this.rootDiv.scrollIntoView();
		}
	});

	public componentDidMount() {
		this.props.model.treeViewModel.updateOffsets();
	}

	public componentDidUpdate() {
		this.props.model.treeViewModel.updateOffsets();
	}

	public render(): JSX.Element {
		const model = this.props.model;
		const collapsed = model.expanded;
		console.log("render");
		return (
			<div
				className={classNames(
					"component-TreeNodeView",
					model.expanded && "collapsed",
					model.isMarked && "selected",
					model.isSelected && "hovered",
					model.isChildOrThisSelected &&
						!model.isSelected &&
						"childHovered",
					model.isParentOrThisSelected &&
						!model.isSelected &&
						"parentHovered"
				)}
				ref={this.setRootDiv}
			>
				<div
					className="part-header"
					onMouseOver={e => {
						this.handleMouseEnterOrLeave(true);
						e.stopPropagation();
					}}
					onMouseOut={e => {
						this.handleMouseEnterOrLeave(false);
						e.stopPropagation();
					}}
				>
					<div
						ref={model.setExpanderDiv}
						onClick={() => model.toggleExpanded()}
						className={classNames(
							"part-collapser",
							model.children.length > 0 &&
								"decorator-collapse-icon",
							!collapsed && "expanded"
						)}
					/>

					<span className="part-text" onClick={this.clickHandler}>
						{model.id && (
							<>
								<span className="part-id">{model.id}</span>
								<span>: </span>
							</>
						)}
						<span className="part-name">{model.name}</span>
						{model.value && (
							<span className="part-value">{model.value}</span>
						)}
						{model.emphasizedValue && (
							<span className="part-emphasized-value">
								{model.emphasizedValue}
							</span>
						)}
					</span>
				</div>

				{model.children.length > 0 && !model.expanded && (
					<div className="part-children">
						{model.children.map((c, idx) => (
							<TreeNodeView model={c} key={idx} />
						))}
					</div>
				)}
			</div>
		);
	}
}
