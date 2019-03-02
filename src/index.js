import '../style/index.scss';

const kIsHeaderSymbol = Symbol('TableRow::isHeader');

export class TableRow {
    constructor(columns = 1, height = 20, className = 'darionco_table_view_row') {
        this.mElement = document.createElement('div');
        this.mElement.className = className;
        this.mElement.style.height = `${height}px`;
        this.mElement.style.lineHeight = `${height}px`;
        this.mCells = [];
        this[kIsHeaderSymbol] = false;

        for (let i = 0; i < columns; ++i) {
            const el = document.createElement('div');
            el.className = 'darionco_table_view_cell';
            el.style.width = '100px';
            this.mElement.appendChild(el);
            this.mCells.push(el);
        }
    }

    get element() {
        return this.mElement;
    }

    get isHeader() {
        return this[kIsHeaderSymbol];
    }

    getCell(cell) {
        return this.mCells[cell];
    }

    setCellWidth(cell, width) {
        this.mCells[cell].style.width = `${width}px`;
    }

    setContent(cell, content) {
        if (content instanceof HTMLElement) {
            while (this.mCells[cell].lastChild) {
                this.mCells[cell].removeChild(this.mCells[cell].lastChild);
            }
            this.mCells[cell].appendChild(content);
        } else {
            this.mCells[cell].innerText = content;
        }
    }
}

export class TableView {
    constructor(columnCount = 1, rowCount = 0, rowHeight = 20, rowProvider) {
        this.mParent = null;
        this.mRunHot = false;
        this.mColumnCount = columnCount;
        this.mRowCount = rowCount;
        this.mRowHeight = rowHeight;
        this.mContainer = document.createElement('div');
        this.mHeader = document.createElement('div');
        this.mScrollable = document.createElement('div');
        this.mContent = document.createElement('div');
        this.mRowContainer = document.createElement('div');
        this.mRowProvider = rowProvider;
        this.mIndexedRows = {};
        this.mReusableRows = [];

        this.mMinIndex = 0;
        this.mMaxIndex = -1;
        this.mRowsPadding = 30;

        this.mUpdateStateBound = this._updateState.bind(this);
        this.mHandleScrollBound = this._handleScroll.bind(this);

        this.mContainer.className = 'darionco_table_view_container';
        this.mHeader.className = 'darionco_table_view_header_container';
        this.mScrollable.className = 'darionco_table_view_scrollable';
        this.mContent.className = 'darionco_table_view_content';
        this.mRowContainer.className = 'darionco_table_view_row_container';
        this.mContent.style.height = `${this.mRowHeight * this.mRowCount}px`;

        this.mContainer.appendChild(this.mHeader);
        this.mContainer.appendChild(this.mScrollable);
        this.mScrollable.appendChild(this.mContent);
        this.mContent.appendChild(this.mRowContainer);
    }

    get rowCount() {
        return this.mRowCount;
    }

    set rowCount(value) {
        this.mRowCount = value;
    }

    get parent() {
        return this.mParent;
    }

    set parent(value) {
        if (value !== this.mParent) {
            if (this.mParent) {
                this.mParent.removeChild(this.mContainer);
            }
            this.mParent = value;
            if (this.mParent) {
                this.mParent.appendChild(this.mContainer);
                this._updateState();
                if (!this.mRunHot) {
                    this.mScrollable.addEventListener('scroll', this.mHandleScrollBound);
                }
            }
        }
    }

    get runHot() {
        return this.mRunHot;
    }

    set runHot(value) {
        const runHot = Boolean(value);
        if (runHot !== this.mRunHot) {
            this.mRunHot = runHot;
            if (this.mParent) {
                if (this.mRunHot) {
                    this.mScrollable.removeEventListener('scroll', this.mHandleScrollBound);
                    this._updateState();
                } else {
                    this.mScrollable.addEventListener('scroll', this.mHandleScrollBound);
                }
            }
        }
    }

    _handleScroll() {
        if (!this.mScrollTimeout) {
            this.mScrollTimeout = setTimeout(this.mUpdateStateBound, 100);
        }
    }

    _updateState() {
        const startPosition = Math.max(0, this.mScrollable.scrollTop - this.mRowHeight * this.mRowsPadding);
        const endPosition = Math.min(this.mRowHeight * this.mRowCount, this.mScrollable.scrollTop + this.mScrollable.clientHeight + this.mRowHeight * this.mRowsPadding);
        const startIndex = Math.floor(startPosition / this.mRowHeight);
        const endIndex = Math.min(this.mRowCount - 1, Math.floor(endPosition / this.mRowHeight));
        const rowStartPosition = startIndex * this.mRowHeight;

        if (startIndex !== this.mMinIndex || this.mMaxIndex !== endIndex) {
            this.mRowContainer.style.paddingTop = `${rowStartPosition}px`;

            if (startIndex > this.mMinIndex) {
                for (let i = this.mMinIndex; i < startIndex; ++i) {
                    if (this.mIndexedRows.hasOwnProperty(i)) {
                        const row = this.mIndexedRows[i];
                        this.mReusableRows.push(row);
                        delete this.mIndexedRows[i];
                    }
                }
            }

            if (endIndex < this.mMaxIndex) {
                for (let i = endIndex + 1; i <= this.mMaxIndex; ++i) {
                    if (this.mIndexedRows.hasOwnProperty(i)) {
                        const row = this.mIndexedRows[i];
                        this.mReusableRows.push(row);
                        delete this.mIndexedRows[i];
                    }
                }
            }

            for (let i = startIndex; i <= endIndex; ++i) {
                if (!this.mIndexedRows.hasOwnProperty(i)) {
                    let row;
                    if (this.mReusableRows.length) {
                        row = this.mReusableRows.pop();
                    } else {
                        row = new TableRow(this.mColumnCount, this.mRowHeight);
                    }
                    this.mRowProvider(row, i);
                    row.element.style.order = String(i);
                    this.mIndexedRows[i] = row;
                    if (!row.element.parentNode) {
                        this.mRowContainer.appendChild(row.element);
                    }
                }
            }

            if (this.mReusableRows.length) {
                for (let i = 0, n = this.mReusableRows.length; i < n; ++i) {
                    if (this.mReusableRows[i].element.parentNode) {
                        this.mRowContainer.removeChild(this.mReusableRows[i].element);
                    }
                }
            }

            this.mMinIndex = startIndex;
            this.mMaxIndex = endIndex;
        }

        this.mScrollTimeout = null;
        if (this.mParent && this.mRunHot) {
            requestAnimationFrame(this.mUpdateStateBound);
        }
    }
}
