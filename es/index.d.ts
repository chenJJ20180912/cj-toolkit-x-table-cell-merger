export declare type HorizontalColumns = string[];
export declare type TableRowData = Record<string, any>;
export declare interface TableMergeDisabledFn {
    (): boolean;
}
export declare type TableMergeDisabled = boolean | TableMergeDisabledFn;
export declare interface TableCellOption {
    rowspan: number;
    colspan: number;
    _pre_v?: TableCellOption;
    _pre_h?: TableCellOption;
}
export declare interface TableCellMergeOptions {
    mergeColumns?: string[];
    mergeColumnsRelations?: Record<string, string>;
    horizontalColumns?: HorizontalColumns | HorizontalColumns[];
    disabled?: TableMergeDisabled;
    splitter?: string;
    getRowKey?(rowData: TableRowData): string;
    mergeEmpty?: boolean;
    judgeValueEquals?(cur: CellValueWrapper, // 当前值
    next: CellValueWrapper, // 下一个值
    tableCellMerger: TableCellMerger, // 单元格合并管理器
    vertical: boolean): boolean;
}
export declare interface CellValueWrapper {
    rowData: TableRowData;
    prop: string;
    val: any;
}
/**
 * 表格合并器
 */
export declare class TableCellMerger {
    private _options;
    private _cellMap;
    setOptions(option: TableCellMergeOptions): this;
    mergeCell(data: TableRowData[]): this;
    /**
     * 纵向合并
     */
    private _mergeByVertical;
    /**
     * 横向合并
     */
    private _mergeByHorizontal;
    getCellMergeInfo(rowData: TableRowData, prop: string): TableCellOption;
    private _getCellKey;
    protected _getRowKey(rowData: TableRowData): string;
    private _judgeValueEquals;
    private _disabled;
    private _getHorizontalColumns;
    /**
     * 获取默认的表格合并options
     */
    get defaultTableMergeOptions(): TableCellMergeOptions;
    get mergeColumnsRelations(): Record<string, string>;
    get mergeColumns(): string[];
    private get cellMap();
    private set cellMap(value);
    get options(): TableCellMergeOptions;
}
