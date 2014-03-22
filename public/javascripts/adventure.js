// adventure.js
// client-side code for adventure AJAX demo

$(function() {  // setup local scope
    
    var getRoom = function() {
		$.getJSON("/getContents", function(room) {
			var exits;
			$('#title').text(room.title);
			$('#description').text(room.description);
			if (room.activity) {
				$('#activity').text(room.activity);
			} else {
				$('#activity').text("");
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
}); // finish setting up local scope (call function defined)
