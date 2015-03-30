$(document).ready(function(){


/****************************************
 	Setup variables
 ***************************************/
	var docWidth = $(".wrapper").width();
	var docHeight = $(".wrapper").height();
	var tileWidth = 100;
	var tileHeight = 100;
	var maxCols = Math.floor(docWidth/tileWidth);
	$(".wrapper").width(maxCols*tileWidth);
	var maxHeight = Math.floor(docHeight/tileHeight);
	var tiles = [];
	var resize_handle_html = '<span class="gs-resize-handle gs-resize-handle-both"></span>';
		// Define a widget
	var header1 = ''; 
	var header2 = '';
	var header3 = '';
	var contents = '';
	var optionContents = '';
	header1 += '<div class="tile-panel panel-default">';
	header1 += ' <div class="tile-panel-heading">';
	header1 += '  <div class="panel-header-title text-center">';
	header1 += '    <button type="button" class="btn btn-default btn-xs options" style="float:left;">';
	header1 += '     <span class="fa fa-cog" aria-label="Options"></span>';
	header1 += '    </button>';
	header1 += '    <button type="button" class="btn btn-default btn-xs remove"  style="float:right;">';
	header1 += '     <span class="fa fa-times" aria-label="Close"></span>';
	header1 += '    </button>';
	header1 += '     <p style="text-align: center">';
		// Widget Name
	header2 += '     <p>';
	header2 += '   </div>';
	header2 += '  </div>';
	header2 += ' </div>';
	header2 += ' <div class="tile-panel-body" data-direction="horizontal" data-mode="slid">';
		// Widget Contents
	contents += '  <p>The path of the righteous man is beset on all sides by the iniquities of the selfish and the tyranny of evil men.</p>';
	header3 += ' </div>';
	header3 += '</div>';
	var dragStartX = 0;
    var dragStartY = 0;
    var dragStartSizeX = 0;
    var dragStartSizeY = 0;
    var dragStartId = '';
    var dragStartOffset = {
      top: 0,
      left: 0
    };
    var widgetMargins = 1;
    var resizeStartSizeX = 0;
    var resizeStartSizeY = 0;
    var resizeStartX = 0;
    var resizeStartY = 0;
    var resizeDir = '';

	//i = cols, j = rows
	var board = new Array(maxCols);
	//setup the empty board
	for (var i = board.length - 1; i >= 0; i--) {
		board[i] = new Array(maxHeight);
		for (var j = board[i].length - 1; j >= 0; j--) {
			board[i][j] = {
				occupied: 0,
				tile: ''
			};
		}
	}
/****************************************
 	End setup variables
 ***************************************/
	
	//set the window creation buttons
	$('.slide-btn').each(function(){
	    $(this).click(function(){
	    	var name = $(this).attr('id');
	      	if($('#' + name + '_window').length == 0) {
				var new_tile = '<li id="' + name + '_window" class="tile">' + header1 + name + header2 + contents + header3 +'</li>';
				add_tile(new_tile, name+'_window');
			}
	    });
	});




	/**
	 * Creates a new tile window and rearranges all the other tiles to make room 
	 * html-> the content of the tile
	 * id-> the name for the new tile to take
	 * callback-> an optional function to pass that will be called with add_tile is done
	 */
	function add_tile(html, id, callback){
		$('.tile-holder').append(html);
		var w = $('#'+id);
		$(w).css({'display': 'none'});

		$(w).draggable({
			//containment: '.tile-board',
			helper: 'clone',
			start: function(event, ui){

				ui.helper.addClass('ui-draggable-dragging-no-transition');
				ui.helper.animate({
					'opacity':'0.5',
					'z-index':10,
					'width':'20%',
					'height':'20%',
				});
			},
			stop: function(event, ui){
				
				var pos = grid_from_offset(ui.position);
				dragFixup(pos.col, pos.row);
				$(ui.helper).css({
					'opacity':'1.0',
					'z-index':1
				});
			},
			cursorAt: {
				left:200, 
				top:15
			}, 
		});

		$(w).resizable({
			handles: 'n, w, e, s', 
			animate: true,
			animateDuration: 'fast',
			animateEasing: 'easeOutQuint',
			// containment: '.tile-holder',
			helper: 'ui-resizable-helper',
			grid: [tileWidth, tileHeight],
			start: function(event, ui){
				resizeStartX = parseInt(ui.element.attr('col'));
				resizeStartSizeX = parseInt(ui.element.attr('sizex'));
				resizeStartY = parseInt(ui.element.attr('row'));
				resizeStartSizeY = parseInt(ui.element.attr('sizey'));
			},
			resize: function(event, ui){

			},
			stop: function(event, ui){
				resizeFixup(ui);
			}
		});

		$(w).find('.ui-resizable-n').mousedown(function(){
			resizeDir = 'n';
		});
		$(w).find('.ui-resizable-s').mousedown(function(){
			resizeDir = 's';
		});
		$(w).find('.ui-resizable-e').mousedown(function(){
			resizeDir = 'e';
		});
		$(w).find('.ui-resizable-w').mousedown(function(){
			resizeDir = 'w';
		});

		tiles.push($(w).attr('id'));

	 	//Setup the live tile for the options menu
	 	$(w).find('.live-tile').liveTile({ direction:'horizontal' });

		//Stop the body from being able to drag
		$(w).find('.tile-panel-body').mousedown(function (event) {
			event.stopPropagation();
		});

		$(w).find('.tile-panel-heading').mousedown(function(event){
			dragStartId = w[0].id;
			var grid = $('#' + dragStartId);
			dragStartX = parseInt(grid.attr('col'));
			dragStartY = parseInt(grid.attr('row'));
			dragStartSizeX = parseInt(grid.attr('sizex'));
			dragStartSizeY = parseInt(grid.attr('sizey'));
			dragStartOffset = grid.offset();
		});

		$(w).find('.remove').click(function(e) {
			$('#'+id).remove();
			for (var i = tiles.length - 1; i >= 0; i--) {
				if(tiles[i] == id){
					tiles.splice(i, 1);
					break;
				}
			};
			positionFixup();
		});

		$(w).find('.options').click(function(e) {

		});
		
		positionFixup();
		if($('body').attr('class') == 'night'){
			$(w).find('.tile-panel-body').css({
	          'background-color': '#0C1021;',
	          'border-color': '#00f;',
	          'color': '#fff'
	        });
		}
		$(w).fadeIn();
		if(callback != null)
			callback();
		return w;
	};


	/**
	 * A recursive function to fix windows adjacent to windows being dragged up
	 * moved -> an set of windows already moved
	 * dir -> the direction it moved. up, down, right, left
	 * diff -> the amount of grid spaces the window resized
	 * side -> the side of the window being resized. n, s, e, w (the side this call should resize, not the original window)
	 * id -> the id of the window this call should resize
	 */

	 function recursiveResize(moved, dir, diff, side, id){
	 	var curWindow = $('#'+id);
	 	var x = parseInt(curWindow.attr('col'));
	 	var y = parseInt(curWindow.attr('row'));
	 	var sizex = parseInt(curWindow.attr('sizex'));
	 	var sizey = parseInt(curWindow.attr('sizey'));
	 	if(dir == 'up'){
	 		if(side == 'n'){
	 			var adj = new Set();
		 		for (var i = x; i < x + sizex; i++) {
					 adj.add(board[i-1][y - 2].tile);
				};
				//check the base case-> all windows have been moved
				var done = true;
				moved.add(id);
				adj.forEach(function(item){
					if(!moved.has(item)){
						done = false;
					}
				}, moved);
				curWindow.attr({
					'row':y-diff,
					'sizey':sizey+diff
				});
				curWindow.css({
					'top':(y-diff)*tileHeight-40,
					'height':(sizey+diff)*tileHeight
				});
				update_board(id);
				if(done == true){
					//base case, done resizing
					return;
				} else {
					//we need to keep resizing
					recursiveResize(moved, 'up', diff, 's', adj.values().next().value);
				}
	 		}
	 		else if(side =='s'){
	 			var adj = new Set();
		 		for (var i = x; i < x + sizex; i++) {
					 adj.add(board[i-1][y + sizey - 1].tile);
				};
				//check the base case-> all windows have been moved
				moved.add(id);
				var done = true;
				adj.forEach(function(item){
					if(!moved.has(item)){
						done = false;
					} else {
						adj.delete(item);
					}
				}, moved);
				curWindow.attr({
					'sizey':sizey-diff
				});
				curWindow.css({
					'height':(sizey-diff)*tileHeight
				});
				update_board(id);
				//is the window being completely obscured?
				if(parseInt(curWindow.attr('sizey')) <= 0){
					$.when(curWindow.fadeOut()).then(function(){
 						curWindow.remove();
	 				});
	 				for (var i = tiles.length - 1; i >= 0; i--) {
						if(tiles[i] == id){
							tiles.splice(i, 1);
							break;
						}
					};
				}
				if(done == true){
					//base case, all windows have been resized
					return; 
				} else {
					//we need to keep resizeing 
					recursiveResize(moved, 'up', diff, 'n', adj.values().next().value);
				}
	 		} else {
	 			//error
	 			return
	 		}
	 	}
	 	else if(dir == 'down'){
	 		if(side == 'n'){
	 			var adj = new Set();
		 		for (var i = x; i < x + sizex; i++) {
					 adj.add(board[i-1][y - 2].tile);
				};
				//check the base case-> all windows have been moved
				var done = true;
				moved.add(id);
				adj.forEach(function(item){
					if(!moved.has(item)){
						done = false;
					}
				}, moved);
				curWindow.attr({
					'row':y-diff,
					'sizey':sizey+diff
				});
				curWindow.css({
					'top':(y-diff)*tileHeight-40,
					'height':(sizey+diff)*tileHeight
				});
				update_board(id);
				if(done == true){
					//base case, done resizing
					return;
				} else {
					//we need to keep resizing
					recursiveResize(moved, 'down', diff, 's', adj.values().next().value);
				}
	 		}
	 		else if(side =='s'){
	 			var adj = new Set();
		 		for (var i = x; i < x + sizex; i++) {
					 adj.add(board[i-1][y + sizey - 1].tile);
				};
				//check the base case-> all windows have been moved
				var done = true;
				moved.add(id);
				adj.forEach(function(item){
					if(!moved.has(item)){
						done = false;
					} else {
						adj.delete(item);
					}
				}, moved);
				curWindow.attr({
					'sizey':sizey-diff
				});
				curWindow.css({
					'height':(sizey-diff)*tileHeight
				});
				update_board(id);
				//is the window being completely obscured?
				if(parseInt(curWindow.attr('sizey')) <= 0){
					$.when(curWindow.fadeOut()).then(function(){
 						curWindow.remove();
	 				});
	 				for (var i = tiles.length - 1; i >= 0; i--) {
						if(tiles[i] == id){
							tiles.splice(i, 1);
							break;
						}
					};
				}
				if(done == true){
					//base case, all windows have been resized
					return; 
				} else {
					//we need to keep resizeing 
					recursiveResize(moved, 'down', diff, 'n', adj.values().next().value);
				}
	 		} else {
	 			//error
	 			return
	 		}
	 	}
	 	else if(dir == 'right'){
			if(side == 'e'){
				var adj = new Set();
		 		for (var i = y; i < y + sizey; i++) {
					 adj.add(board[x + sizex - 1][i - 1].tile);
				};
				var done = true;
				adj.forEach(function(item){
					if(!moved.has(item)){
						done = false;
					} else {
						adj.delete(item);
					}
				}, moved);
				curWindow.attr({
					'sizex':sizex-diff
				});
				curWindow.css({
					'width':(sizex-diff)*tileWidth,
				});
				update_board(id);
				//is the window being completely obscured?
				if(parseInt(curWindow.attr('sizex')) <= 0){
					$.when(curWindow.fadeOut()).then(function(){
 						curWindow.remove();
	 				});
	 				for (var i = tiles.length - 1; i >= 0; i--) {
						if(tiles[i] == id){
							tiles.splice(i, 1);
							break;
						}
					};
				}
				if(done == true){
					//base case, all windows have been resized
					return; 
				} else {
					//we need to keep resizeing 
					recursiveResize(moved, 'right', diff, 'w', adj.values().next().value);
				}
	 		}
	 		else if(side =='w'){
	 			var adj = new Set();
		 		for (var i = y; i < y + sizey; i++) {
					 adj.add(board[x - 2][i - 1].tile);
				};
				var done = true;
				adj.forEach(function(item){
					if(!moved.has(item)){
						done = false;
					} else {
						adj.delete(item);
					}
				}, moved);
				curWindow.attr({
					'col':x-diff,
					'sizex':sizex+diff
				});
				curWindow.css({
					'width':(sizex+diff)*tileWidth,
					'left':(x-diff)*tileWidth-92
				});
				update_board(id);
				//is the window being completely obscured?
				if(parseInt(curWindow.attr('sizex')) <= 0){
					$.when(curWindow.fadeOut()).then(function(){
 						curWindow.remove();
	 				});
	 				for (var i = tiles.length - 1; i >= 0; i--) {
						if(tiles[i] == id){
							tiles.splice(i, 1);
							break;
						}
					};
				}
				if(done == true){
					//base case, all windows have been resized
					return; 
				} else {
					//we need to keep resizeing 
					recursiveResize(moved, 'right', diff, 'e', adj.values().next().value);
				}
	 		} else {
	 			//error
	 			return
	 		}
	 	}
	 	else if(dir == 'left'){
	 		if(side == 'e'){

	 		}
	 		else if(side =='w'){

	 		} else {
	 			//error
	 			return
	 		}
	 	} else {
	 		//error
	 		return
	 	}
	 }





	/**
	 * Fixes the position of adjacent tiles after a resize event
	 * ui -> the ui element from the resize event
	 */
	 //TODO: if the n handle of the top element is pulled, move it back. same for w of left, s of bottom, e of right
	 function resizeFixup(ui){
	 	var resizeId = ui.element.attr('id');
	 	//which direction did it resize?
	 	if(resizeDir == 'n'){
	 		var virt_adj = new Set();
	 		for (var i = resizeStartX; i < resizeStartX + resizeStartSizeX; i++) {
				if(board[i-1][resizeStartY-2].tile != resizeId){
					virt_adj.add(board[i-1][resizeStartY-2].tile);
				}
			};
	 		//did it go up or down?
	 		var diff = virtical_location(ui.originalPosition.top, 0) - virtical_location(ui.helper.position().top, 0);
	 		$(ui.element).attr({
	 			'row':parseInt(ui.element.attr('row'))-diff,
	 			'sizey':parseInt(ui.element.attr('sizey'))+diff
	 		});
	 		var moved = new Set();
	 		moved.add(resizeId);
	 		if(diff < 0){
	 			//it moved down
	 			virt_adj.forEach(function(item){
					recursiveResize(moved, 'down', diff, 's', item);
	 			});
	 		} 
	 		else if(diff > 0){
	 			//it moved up
	 			virt_adj.forEach(function(item){
	 				recursiveResize(moved, 'up', diff, 's', item);
	 			});
	 		} else {
	 			//it didnt move
	 			//TODO: the right and bottom sides are being set to size-2 for some reason
	 			ui.element.css({
	 				'top': ui.originalPosition.top,
	 				'left': ui.originalPosition.left,
	 				'width': ui.originalSize.width,
	 				'height': ui.originalSize.height
	 			});
	 			return;
	 		}
	 	}
	 	if(resizeDir == 's'){
	 		var virt_adj = new Set();
	 		for (var i = resizeStartX; i < resizeStartX + resizeStartSizeX; i++) {
				if(board[i-1][resizeStartY + resizeStartSizeY - 1].tile != resizeId){
					virt_adj.add(board[i-1][resizeStartY + resizeStartSizeY].tile);
				}
			};
	 		//did it go up or down?
	 		var diff = virtical_location(ui.originalPosition.top, ui.originalSize.height) - virtical_location(ui.helper.position().top, ui.helper.height());
	 		var moved = new Set();
	 		moved.add(resizeId);
	 		if( diff < 0){
	 			//it moved down
	 			virt_adj.forEach(function(item){
	 				recursiveResize(moved, 'down', diff, 'n', item);
	 			});
	 		} 
	 		else if(diff > 0){
	 			//it moved up
	 			virt_adj.forEach(function(item){
	 				recursiveResize(moved, 'up', diff, 'n', item);
	 			});
	 		} else {
	 			//it didnt move
	 			ui.element.css({
	 				'top': ui.originalPosition.top,
	 				'left': ui.originalPosition.left,
	 				'width': ui.originalSize.width,
	 				'height': ui.originalSize.height
	 			});
	 			return;

	 		}
	 	} 
	 	if(resizeDir == 'e'){
	 		var horz_adj = new Set();
	 		for (var i = resizeStartY; i < resizeStartY + resizeStartSizeY; i++) {
				if(board[resizeStartX + resizeStartSizeX - 1][i-1].tile != resizeId){
					horz_adj.add(board[resizeStartX + resizeStartSizeX - 1][i-1].tile);
				}
			};
			//did it go right or left?
			var diff = horizontal_location(ui.originalPosition.left, ui.originalSize.width) - horizontal_location(ui.helper.position().left, ui.helper.width());
			var moved = new Set();
			moved.add(resizeId);
	 		if( diff < 0){
	 			//it moved right
	 			horz_adj.forEach(function(item){
	 				recursiveResize(moved, 'right', diff, 'w', item);
	 			});
	 		} 
	 		else if(diff > 0){
	 			//it moved left
	 			horz_adj.forEach(function(item){
	 				recursiveResize(moved, 'left', diff, 'w', item);
	 			});
	 		} else {
	 			//it didnt move
	 		}
	 	} 
	 	if(resizeDir == 'w'){
	 		var horz_adj = new Set();
	 		for (var i = resizeStartY; i < resizeStartY + resizeStartSizeY; i++) {
				if(board[resizeStartX - 2][i-1].tile != resizeId){
					horz_adj.add(board[resizeStartX - 2][i-1].tile);
				}
			};
	 		//did it go right or left?
	 		var diff = horizontal_location(ui.originalPosition.left,0) - horizontal_location(ui.helper.position().left, 0)
	 		if( diff < 0){
	 			//it moved right
	 			horz_adj.forEach(function(item){
	 				recursiveResize(moved, 'right', diff, 'e', item);
	 			});
	 		} 
	 		else if(diff > 0){
	 			//it moved left
	 			horz_adj.forEach(function(item){
	 				recursiveResize(moved, 'left', diff, 'e', item);
	 			});
	 		} else {
	 			//it didnt move
	 		}
	 	}
	 }

	/**
	* Fixes the positions for all windows
	*/
	function positionFixup(){
		for (var i = tiles.length - 1; i >= 0; i--) {
			var layout = returnBalanced(maxCols, maxHeight);
			var t = $('#'+tiles[i]);
			t.attr({
				'row': layout[tiles.length-1][i].row(maxHeight),
				'col': layout[tiles.length-1][i].col(maxCols),
				'sizex': layout[tiles.length-1][i].sizex(maxCols),
				'sizey': layout[tiles.length-1][i].sizey(maxHeight)
			});
			var tile_offset = offset_from_location(parseInt(t.attr('row')), parseInt(t.attr('col')));
			t.css({
				"top": tile_offset.top,
				"left":tile_offset.left,
				"width":t.attr('sizex')*tileWidth,
				"height":t.attr('sizey')*tileHeight});
			update_board(tiles[i]);
		};
	}


	/**
	 * Updates the board to match the tile
	 * id -> the id of the tile to update the board info for
	 */
	function update_board(id){
		var t = $('#'+id);
		for (var k = parseInt(t.attr('col'))-1; k < parseInt(t.attr('col'))+parseInt(t.attr('sizex'))-1; k++) {
			for (var j = parseInt(t.attr('row'))-1; j < parseInt(t.attr('row'))+parseInt(t.attr('sizey'))-1; j++) {
				board[k][j].occupied = 1;
				board[k][j].tile = id;
			};
		};
	}


	/**
	* Gives the offset of the tile from row and col
	* row -> the row of the tile
	* col -> the col of th tile
	*/
	function offset_from_location(row, col){
		var offset = $('.tile-board').offset();
		offset.left += (col-1)*tileWidth;
		offset.top += (row-1)*tileHeight;
		return offset;
	}

	/**
	* Fixes the window positions after a drag event
	* col, row -> the ending col and row of the dragged element
	*/
	function dragFixup(col, row) {

		if(col < 0 || col > maxCols || row < 0 || row > maxHeight){
			$('.ui-draggable-dragging').remove();
	    	return;
		}
	    var targetId = board[col-1][row-1].tile;
	    var targetX = parseInt($('#'+targetId).attr('col'));
	    var targetY = parseInt($('#'+targetId).attr('row'));
	    var targetSizeX = parseInt($('#'+targetId).attr('sizex'));
	    var targetSizeY = parseInt($('#'+targetId).attr('sizey'));
	    var targetGrid = $('#'+targetId);
	    var startGrid = $('#'+dragStartId);
	    if(targetId == dragStartId) {
	      var targetOffset = offset_from_location(row,col);
	      $('#'+targetId).css({
	      	'top':dragStartOffset.top,
	      	'left':dragStartOffset.left,
	      	'height':dragStartSizeY*tileHeight,
	      	'width':dragStartSizeX*tileWidth
	      });
	    } else {
	      var startOffset = offset_from_location(dragStartSizeY, dragStartSizeX);
	      var targetOffset = offset_from_location(targetY, targetX);
	      startGrid.attr({
	        'col': targetGrid.attr('col'),
	        'row': targetGrid.attr('row'),
	        'sizex': targetGrid.attr('sizex'),
	        'sizey': targetGrid.attr('sizey')
	      });
	      startGrid.css({
	      	'top':targetOffset.top,
	      	'left':targetOffset.left,
	      	'width':parseInt(startGrid.attr('sizex'))*tileWidth,
	      	'height':parseInt(startGrid.attr('sizey'))*tileHeight
	      });
	      update_board(dragStartId);

	      targetGrid.attr({
	        'col': dragStartX,
	        'row': dragStartY,
	        'sizex': dragStartSizeX,
	        'sizey': dragStartSizeY
	      });
	      targetGrid.css({
	      	'top':dragStartOffset.top,
	      	'left':dragStartOffset.left,
	      	'width':parseInt(targetGrid.attr('sizex'))*tileWidth,
	      	'height':parseInt(targetGrid.attr('sizey'))*tileHeight
	      });
	      update_board(targetId);
	    }
	}


	/**
	 * Returns the row and col of an element from its offset
	 * pos -> the position of the object
	 */
	function grid_from_offset(pos){
		var location = {
			col: Math.floor(pos.left/tileWidth) + 1,
			row: Math.floor(pos.top/tileHeight) + 1
		}
		return location;
	}

	/**
	 * Returns the col from the position and size of an element
	 * x -> the horizontal position of the object
	 * sizex -> the horizontal size of the object
	 */
	function horizontal_location(x, sizex){
		if(((x+sizex)/tileWidth)%1 >= 0.5){
			return Math.ceil((x+sizex)/tileWidth)+1;
		} else {
			return Math.floor((x+sizex)/tileWidth)+1;
		}
	}

	/**
	 * Returns the row from the position and size of an element
	 * y -> the horizontal position of the object
	 * sizey -> the horizontal size of the object
	 */
	function virtical_location(y, sizey){
		if(((y+sizey)/tileHeight)%1 >= 0.5){
			return Math.ceil((y+sizey)/tileHeight)+1
		} else {
			return Math.floor((y+sizey)/tileHeight)+1;
		}
	}
});

