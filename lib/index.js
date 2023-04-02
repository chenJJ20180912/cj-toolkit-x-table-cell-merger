// 默认的表格合并选项
const defaultTableMergeOptions = {
    mergeColumns: [],
    mergeColumnsRelations: {},
    horizontalColumns: [],
    disabled: false,
    splitter: "$$",
    mergeEmpty: false,
    getRowKey(rowData) {
        return rowData.id;
    },
    judgeValueEquals(cur, next, tableCellMerger, vertical) {
        const curVal = cur.val;
        const nextVal = next.val;
        const { mergeEmpty } = tableCellMerger.options;
        if (mergeEmpty) {
            return curVal === nextVal;
        }
        return (curVal !== "" &&
            nextVal !== "" &&
            curVal !== undefined &&
            nextVal !== undefined &&
            curVal === nextVal);
    }
};
/**
 * 表格合并器
 */
export class TableCellMerger {
    setOptions(option) {
        this._options = Object.assign({}, this.defaultTableMergeOptions, option);
        return this;
    }
    // 进行合并
    mergeCell(data) {
        if (this._disabled()) {
            return;
        }
        const cellMap = {};
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
    _mergeByVertical(data, cellMap) {
        for (let i = 0; i < data.length; i++) {
            const cur = data[i];
            const next = data[i + 1];
            const keys = this.mergeColumns;
            const rowKey = this._getRowKey(cur);
            keys.forEach((key) => {
                var _a;
                const curCellVal = cur[key];
                const nextCellVal = next === null || next === void 0 ? void 0 : next[key];
                const cellKey = this._getCellKey(rowKey, key);
                let curCellMerge = cellMap[cellKey];
                if (!curCellMerge) {
                    curCellMerge = cellMap[cellKey] = {
                        colspan: 1,
                        rowspan: 1
                    };
                }
                if (next &&
                    this._judgeValueEquals({ rowData: cur, prop: key, val: curCellVal }, { rowData: next, prop: key, val: nextCellVal }, true)) {
                    // 判断是否需要向上判断
                    let parentKey = this.mergeColumnsRelations[key];
                    while (parentKey) {
                        // 比较ParentKey
                        const curParentCellVal = cur[parentKey];
                        const nextParentCellVal = next === null || next === void 0 ? void 0 : next[parentKey];
                        if (this._judgeValueEquals({ rowData: cur, prop: parentKey, val: curParentCellVal }, { rowData: next, prop: parentKey, val: nextParentCellVal }, true)) {
                            parentKey = this.mergeColumnsRelations[parentKey];
                        }
                        else {
                            return;
                        }
                    }
                    // 合并
                    const nextCellKey = this._getCellKey(next, key);
                    const _pre_v = (_a = curCellMerge._pre_v) !== null && _a !== void 0 ? _a : curCellMerge;
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
    _mergeByHorizontal(data, cellMap) {
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
                                if (this._judgeValueEquals({ rowData, prop: preKey, val: preVal }, { rowData, prop: curKey, val: curVal }, false)) {
                                    // 合并
                                    let _pre_h = cellMap[preKey];
                                    if (_pre_h) {
                                        _pre_h = _pre_h._pre_h || _pre_h;
                                    }
                                    else {
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
    getCellMergeInfo(rowData, prop) {
        const cellKey = this._getCellKey(rowData, prop);
        return (this.cellMap[cellKey] || {
            colspan: 1,
            rowspan: 1
        });
    }
    _getCellKey(rowKeyOrData, prop) {
        if (typeof rowKeyOrData === "object") {
            rowKeyOrData = this._getRowKey(rowKeyOrData);
        }
        return rowKeyOrData + "$$" + prop;
    }
    _getRowKey(rowData) {
        return this.options.getRowKey(rowData);
    }
    _judgeValueEquals(cur, next, vertical) {
        return this.options.judgeValueEquals(cur, next, this, vertical);
    }
    // 是否运行计算
    _disabled() {
        const disabled = this.options.disabled;
        if (typeof disabled === "function") {
            return disabled();
        }
        return disabled;
    }
    _getHorizontalColumns() {
        const horizontalColumns = this.options.horizontalColumns || [];
        const data = [];
        const lst = [];
        horizontalColumns.forEach((item) => {
            if (Array.isArray(item)) {
                data.push(item);
            }
            else {
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
    get cellMap() {
        return this._cellMap || {};
    }
    set cellMap(value) {
        this._cellMap = value;
    }
    get options() {
        return this._options || {};
    }
}
