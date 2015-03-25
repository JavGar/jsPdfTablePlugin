/** ====================================================================
 * jsPDF table plugin
 * Copyright (c) 2014 Nelli.Prashanth,https://github.com/Prashanth-Nelli
 * MIT LICENSE
 * ====================================================================
 */

( function(jsPDFAPI) {

		var data = [];
		var dim = [];
		var columnCount;
		var rowCount;
		var width;
		var heigth;
		var fdata = [];
		var sdata = [];
		var SplitIndex = [];
		var cSplitIndex = [];
		var indexHelper = 0;
		var heights = [];
		var fontSize;
		var jg;
		var tabledata = [];
		var xOffset;
		var yOffset;
		var iTexts;
		var start;
		var end;
		var ih;
		var lengths;
		var row;
		var obj;
		var value;
		var nlines;
		var nextStart;
		var propObj = {};
		var pageStart = 0;

		// Inserts Table Head row

		jsPDFAPI.insertHeader = function(data) {
			var rObj = {};
			var hObj = {};
			rObj = data[0];
			for (var key in rObj) {
				hObj[key] = key;
			}
			data.unshift(hObj);
		};

		// intialize the dimension array, column count and row count

		jsPDFAPI.initPDF = function(data, marginConfig, firstpage) {

			dim = [];

			dim[0] = marginConfig.xstart;

			if (firstpage) {
				dim[1] = marginConfig.tablestart;
			} else {
				dim[1] = marginConfig.ystart;
			}

			dim[2] = this.internal.pageSize.width - marginConfig.xstart - 20 - marginConfig.marginright;
			dim[3] = 250;
			dim[4] = marginConfig.ystart;
			dim[5] = marginConfig.marginright;
			dim[6] = marginConfig.xOffset || 5;
			dim[7] = marginConfig.yOffset || 5;

			columnCount = this.calColumnCount(data);
			rowCount = data.length;
			width = dim[2] / columnCount;
			height = dim[2] / rowCount;
			dim[3] = this.calrdim(data, dim);
		};

		//draws table on the document

		jsPDFAPI.drawTable = function(table_DATA, marginConfig) {
			fdata = [], sdata = [];
			SplitIndex = [], cSplitIndex = [], indexHelper = 0;
			heights = [];
			//this.setFont("times", "normal");
			fontSize = this.internal.getFontSize();
			if (!marginConfig) {
				marginConfig = {
					xstart : 20,
					ystart : 20,
					tablestart : 20,
					marginright : 20,
					xOffset : 10,
					yOffset : 10
				}
			} else {
				propObj = {
					xstart : 20,
					ystart : 20,
					tablestart : 20,
					marginright : 20,
					xOffset : 10,
					yOffset : 10
				}
				for (var key in propObj) {
					if (!marginConfig[key]) {
						marginConfig[key] = propObj[key];
					}
				}
			}
			pageStart = marginConfig.tablestart;
			xOffset = marginConfig.xOffset;
			yOffset = marginConfig.yOffset;
			this.initPDF(table_DATA, marginConfig, true);
			if ((dim[3] + marginConfig.tablestart) > (this.internal.pageSize.height)) {
				jg = 0;
				cSplitIndex = SplitIndex;
				cSplitIndex.push(table_DATA.length);
				for (var ig = 0; ig < cSplitIndex.length; ig++) {
					tabledata = [];
					tabledata = table_DATA.slice(jg, cSplitIndex[ig]);
					this.insertHeader(tabledata);
					this.pdf(tabledata, dim, true, false);
					pageStart = marginConfig.ystart;
					this.initPDF(tabledata, marginConfig, false);
					jg = cSplitIndex[ig];
					if ((ig + 1) != cSplitIndex.length) {
						this.addPage();
					}
				}
			} else {
				this.insertHeader(table_DATA)
				this.pdf(table_DATA, dim, true, false);
			}
			return nextStart;
		};

		//calls methods in a sequence manner required to draw table

		jsPDFAPI.pdf = function(table, rdim, hControl, bControl) {
			columnCount = this.calColumnCount(table);
			rowCount = table.length;
			rdim[3] = this.calrdim(table, rdim);
			width = rdim[2] / columnCount;
			height = rdim[2] / rowCount;
			this.drawRows(rowCount, rdim, hControl);
			this.drawColumns(columnCount, rdim);
			nextStart = this.insertData(rowCount, columnCount, rdim, table, bControl);
			return nextStart;
		};

		//inserts text into the table

		jsPDFAPI.insertData = function(iR, jC, rdim, data, brControl) {
			// xOffset = 10;
			// yOffset = 10;
			y = rdim[1] + yOffset;
			for ( i = 0; i < iR; i++) {
				obj = data[i];
				x = rdim[0] + xOffset;
				for (var key in obj) {
					if (key.charAt(0) !== '$') {
						if (obj[key] !== null) {
							cell = obj[key].toString();
						} else {
							cell = '-';
						}
						cell = cell + '';
						if (((cell.length * fontSize) + xOffset) > (width)) {
							iTexts = cell.length * fontSize;
							start = 0;
							end = 0;
							ih = 0;
							if ((brControl) && (i === 0)) {
								this.setFont(this.getFont().fontName, "bold");
							}
							for ( j = 0; j < iTexts; j++) {
								end += Math.floor(2 * width / fontSize) - Math.ceil(xOffset / fontSize);
								this.text(x, y + ih, cell.substring(start, end));
								start = end;
								ih += fontSize;
							}
						} else {
							if ((brControl) && (i === 0)) {
								this.setFont("times", "bold");
							}
							this.text(x, y, cell);
						}
						x += rdim[2] / jC;
					}
				}
				this.setFont("times", "normal");
				y += heights[i];
			}
			return y;
		};

		//calculates no.of based on the data array

		jsPDFAPI.calColumnCount = function(data) {
			var obj = data[0];
			var i = 0;
			for (var key in obj) {
				if (key.charAt(0) !== '$') {++i;
				}
			}
			return i;
		};

		//draws columns based on the caluclated dimensions

		jsPDFAPI.drawColumns = function(i, rdim) {
			var x = rdim[0];
			var y = rdim[1];
			var w = rdim[2] / i;
			var h = rdim[3];

			for (var j = 0; j < i; j++) {
				this.rect(x, y, w, h);
				x += w;
			}
		};

		//calculates dimensions based on the data array and returns y position for further editing of document

		jsPDFAPI.calrdim = function(data, rdim) {
			var row = 0;
			var x = rdim[0];
			var y = rdim[1];
			lengths = [];
			for (var i = 0; i < data.length; i++) {
				var obj = data[i];
				var length = 0;
				for (var key in obj) {
					if (obj[key] !== null) {
						if (length < obj[key].length) {
							lengths[row] = obj[key].length;
							length = lengths[row];
						}
					}
				}++row;
			}
			heights = [];
			for (var i = 0; i < lengths.length; i++) {
				if ((lengths[i] * (fontSize)) > (width - rdim[5])) {
					nlines = Math.ceil((lengths[i] * (fontSize)) / width);
					heights[i] = (nlines) * (fontSize / 2) + rdim[6] + 10;
				} else {
					heights[i] = (fontSize + (fontSize / 2)) + rdim[6] + 10;
				}
			}
			value = 0;
			indexHelper = 0;
			SplitIndex = [];
			for (var i = 0; i < heights.length; i++) {
				value += heights[i];
				indexHelper += heights[i];
				if (indexHelper > (this.internal.pageSize.height - pageStart)) {
					SplitIndex.push(i);
					indexHelper = 0;
					pageStart = rdim[4] + 30;
				}
			}
			return value;
		};

		//draw rows based on the length of data array

		jsPDFAPI.drawRows = function(i, rdim, hrControl) {

			var x = rdim[0];
			var y = rdim[1];
			var w = rdim[2];
			var h = rdim[3] / i;

			for (var j = 0; j < i; j++) {
				if (j === 0 && hrControl) {
					this.setFillColor(182, 192, 192);
					//colour combination for table header
					this.rect(x, y, w, heights[j], 'F');
				} else {
					this.setDrawColor(0, 0, 0);
					//colour combination for table borders you
					this.rect(x, y, w, heights[j]);
				}
				y += heights[j];
			}
		};

		//converts table to json

		jsPDFAPI.tableToJson = function(id) {

			var table = document.getElementById(id);
			var keys = [];
			var rows = table.rows;
			var noOfRows = rows.length;
			var noOfCells = table.rows[0].cells.length;
			var i = 0;
			var j = 0;
			var data = [];
			var obj = {};

			for ( i = 0; i < noOfCells; i++) {
				keys.push(rows[0].cells[i].textContent);
			}

			for ( j = 0; j < noOfRows; j++) {
				obj = {};
				for ( i = 0; i < noOfCells; i++) {
					try {
						obj[keys[i]] = rows[j].cells[i].textContent.replace(/^\s+|\s+$/gm, '');
					} catch(ex) {
						obj[keys[i]] = '';
					}
				}
				data.push(obj);
			}
			return data.splice(1);
		};

	}(jsPDF.API));

