// adventure.js
// client-side code for adventure AJAX demo

$(function() {  // setup local scope
	/*
    var getPlayers = function() {
		$.getJSON("/getContents", function(currentPlayer) {
			$('#currPlayer').html(currentPlayer.playername);
		}
	}	*/
    
    var getRoom = function() {
		$.getJSON("/getContents", function(room) {
			var exits;
			$('#title').html(room.title);
			$('#description').html(room.description);
			if (room.activity) {
				$('#activity').html(room.activity);
			} else {
				$('#activity').html("");
			}
			$('.exits').remove();
			room.roomExits.forEach(function(theExit) {
				$('#exitList').append(
					'<button type="button" id="' + theExit +
					'" class="btn btn-default exits">'
					+ theExit + '</button>');
				$('#'+theExit).on('click', function() {
					$.post("/doAction", {action: "move",
							 room: theExit}, getRoom);
				});
			});
			
		});	
    }
	getRoom();
	// getPlayers();
}); // finish setting up local scope (call function defined)
