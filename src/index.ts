// 横向合并组
export declare  type HorizontalColumns = string[];
// 表格行数据对象类型
export declare  type TableRowData = Record<string, any>;

export declare interface TableMergeDisabledFn {
    (): boolean;
}

export declare  type TableMergeDisabled = boolean | TableMergeDisabledFn;

export declare interface TableCellOption {
    rowspan: number; // 行合并
    colspan: number; // 列合并
    _pre_v?: TableCellOption; // 垂直方向的前一个cell
    _pre_h?: TableCellOption; // 横向方向的前一个cell
}

// 合并数据的配置
export declare interface TableCellMergeOptions {
    mergeColumns?: string[]; // 合并的列
    mergeColumnsRelations?: Record<string, string>; // 父子列关系
    horizontalColumns?: HorizontalColumns | HorizontalColumns[]; //  横向合并组
    disabled?: TableMergeDisabled; //是否禁止计算
    splitter?: string; // 分隔符
    getRowKey?(rowData: TableRowData): string; // 获取当前数据的组件
    mergeEmpty?: boolean; // 合并空字符串 和 undefined
    judgeValueEquals?(
        cur: CellValueWrapper,// 当前值
        next: CellValueWrapper,// 下一个值
        tableCellMerger: TableCellMerger,// 单元格合并管理器
        vertical: boolean// 纵向合并
    ): boolean;
}

//  单元格值比较对象
export declare interface CellValueWrapper {
    rowData: TableRowData; // 当前行数据
    prop: string; // 当前比较的属性
    val: any; // 当前cell的值
}

// 默认的表格合并选项
const defaultTableMergeOptions: TableCellMergeOptions = {
    mergeColumns: [],
    mergeColumnsRelations: {},
    horizontalColumns: [],
    disabled: false,
    splitter: "$$",
    mergeEmpty: false, // 默认不合并空
    getRowKey(rowData: TableRowData): string {
        return rowData.id;
    },
    judgeValueEquals(
        cur: CellValueWrapper,
        next: CellValueWrapper,
        tableCellMerger: TableCellMerger,
        vertical: boolean
    ): boolean {
        const curVal = cur.val;
        const nextVal = next.val;
        const {mergeEmpty} = tableCellMerger.options;
        if (mergeEmpty) {
            return curVal === nextVal;
        }
        return (
            curVal !== "" &&
            nextVal !== "" &&
            curVal !== undefined &&
            nextVal !== undefined &&
            curVal === nextVal
        );
    }
};

/**
 * 表格合并器
 */
export class TableCellMerger {
    // 合并数据的配置
    private _options: TableCellMergeOptions;

    private _cellMap: Record<string, TableCellOption>;

    setOptions(option: TableCellMergeOptions) {
        this._options = Object.assign({}, this.defaultTableMergeOptions, option);
        return this;
    }

    // 进行合并
    mergeCell(data: TableRowData[]) {
        if (this._disabled()) {
            return;
        }
        const cellMap: Record<string, TableCellOption> = {};
        // 纵向合并
        this._mergeByVertical(data, cellMap);
        // 横向合并
        this._mergeByHorizontal(data, cellMap);
        // 去掉Map 中的value属性
        Object.keys(cellMap).forEach(key => {
            const val = cellMap[key];
            if (val) {
                delete val._pre_h;
                delete val._pre_v;
            }
        });
        this.cellMap = cellMap;
        return this;
    }

    /**
     * 纵向合并
     */
    private _mergeByVertical(
        data: TableRowData[],
        cellMap: Record<string, TableCellOption>
    ) {
        for (let i = 0; i < data.length; i++) {
            const cur = data[i];
            const next = data[i + 1];
            const keys = this.mergeColumns;
            const rowKey = this._getRowKey(cur);
            keys.forEach((key) => {
                const curCellVal = cur[key];
                const nextCellVal = next?.[key];
                const cellKey = this._getCellKey(rowKey, key);
                let curCellMerge = cellMap[cellKey];
                if (!curCellMerge) {
                    curCellMerge = cellMap[cellKey] = {
                        colspan: 1,
                        rowspan: 1
                    };
                }
                if (
                    next &&
                    this._judgeValueEquals(
                        {rowData: cur, prop: key, val: curCellVal},
                        {rowData: next, prop: key, val: nextCellVal},
                        true
                    )
                ) {
                    // 判断是否需要向上判断
                    let parentKey = this.mergeColumnsRelations[key];
                    while (parentKey) {
                        // 比较ParentKey
                        const curParentCellVal = cur[parentKey];
                        const nextParentCellVal = next?.[parentKey];
                        if (
                            this._judgeValueEquals(
                                {rowData: cur, prop: parentKey, val: curParentCellVal},
                                {rowData: next, prop: parentKey, val: nextParentCellVal},
                                true
                            )
                        ) {
                            parentKey = this.mergeColumnsRelations[parentKey];
                        } else {
                            return;
                        }
                    }
                    // 合并
                    const nextCellKey = this._getCellKey(next, key);
                    const _pre_v = curCellMerge._pre_v ?? curCellMerge;
                    cellMap[nextCellKey] = {
                        colspan: 0,
                        rowspan: 0,
                        _pre_v
                    };
                    _pre_v.rowspan++;
                }
            });
        }
    }

    /**
     * 横向合并
     */
    private _mergeByHorizontal(
        data: TableRowData[],
        cellMap: Record<string, TableCellOption>
    ) {
        const horizontalColumns = this._getHorizontalColumns();
        if (horizontalColumns.length) {
            for (let i = 0; i < data.length; i++) {
                const rowData = data[i];
                const rowKey = this._getRowKey(rowData);
                horizontalColumns.forEach((group) => {
                    // 横向合并
                    if (group.length) {
                        group.reduce((pre, cur) => {
                            if (pre) {
                                const curKey = this._getCellKey(rowKey, cur);
                                const preKey = this._getCellKey(rowKey, pre);
                                const curVal = rowData[cur];
                                const preVal = rowData[pre];
                                let curCellMerge = cellMap[curKey];
                                if (!curCellMerge) {
                                    curCellMerge = cellMap[curKey] = {
                                        colspan: 1,
                                        rowspan: 1
                                    };
                                }
                                if (
                                    this._judgeValueEquals(
                                        {rowData, prop: preKey, val: preVal},
                                        {rowData, prop: curKey, val: curVal},
                                        false
                                    )
                                ) {
                                    // 合并
                                    let _pre_h = cellMap[preKey];
                                    if (_pre_h) {
                                        _pre_h = _pre_h._pre_h || _pre_h;
                                    } else {
                                        _pre_h = cellMap[preKey] = {
                                            colspan: 1,
                                            rowspan: 1
                                        };
                                    }
                                    curCellMerge._pre_h = _pre_h;
                                    curCellMerge.colspan = curCellMerge.rowspan = 0;
                                    _pre_h.colspan++;
                                }
                            }
                            return cur;
                        });
                    }
                });
            }
        }
    }

    // 获取合并信息
    getCellMergeInfo(rowData: TableRowData, prop: string) {
        const cellKey = this._getCellKey(rowData, prop);
        return (
            this.cellMap[cellKey] || {
                colspan: 1,
                rowspan: 1
            }
        );
    }

    private _getCellKey(
        rowKeyOrData: string | TableRowData,
        prop: string
    ): string {
        if (typeof rowKeyOrData === "object") {
            rowKeyOrData = this._getRowKey(rowKeyOrData);
        }
        return rowKeyOrData + "$$" + prop;
    }

    protected _getRowKey(rowData: TableRowData) {
        return this.options.getRowKey(rowData);
    }

    private _judgeValueEquals(cur: CellValueWrapper, next: CellValueWrapper, vertical: boolean) {
        return this.options.judgeValueEquals(cur, next, this, vertical);
    }

    // 是否运行计算
    private _disabled() {
        const disabled = this.options.disabled;
        if (typeof disabled === "function") {
            return disabled();
        }
        return disabled;
    }

    private _getHorizontalColumns(): string[][] {
        const horizontalColumns = this.options.horizontalColumns || [];
        const data: string[][] = [];
        const lst: string[] = [];
        horizontalColumns.forEach((item) => {
            if (Array.isArray(item)) {
                data.push(item);
            } else {
                lst.push(item);
            }
        });
        if (lst.length) {
            data.push(lst);
        }
        return data;
    }

    /**
     * 获取默认的表格合并options
     */
    get defaultTableMergeOptions() {
        return defaultTableMergeOptions;
    }

    get mergeColumnsRelations() {
        return this.options.mergeColumnsRelations || {};
    }

    get mergeColumns() {
        return this.options.mergeColumns || [];
    }

    private get cellMap() {
        return this._cellMap || {};
    }

    private set cellMap(value: Record<string, TableCellOption>) {
        this._cellMap = value;
    }

    get options() {
        return this._options || {};
    }
}
