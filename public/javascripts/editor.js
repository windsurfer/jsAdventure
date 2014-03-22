$(function(){	
	$("#loadRoom").on("click",function(){  
	    
	   	var radios = document.getElementsByName("theRooms");
    
		for (var i = 0; i < radios.length; i++) {       
			if (radios[i].checked) {
				
				$.ajax({	method: 'GET', 
							url: '/getContents', 
							data: { roomValue: radios[i].value }
				}).done(function(room) {
					$('#roomName').html(room.name);
					$('#description').html(room.description);
					if (room.activity) {
						$('#activity').html(room.activity);
					} else {
						$('#activity').html("");
					}
					
					var exits = [];
					room.roomExits.forEach(function(theExit) {
						exits.push(theExit);
					});
					$('#exits').html(exits.join(", "));			
					
				}); // end of .done() callback function
			break;
			} // end of if statement
		} // end of for loop 
	}); // end of loadRoom button .on(click)
	
	
	
	
	$("#saveButton").on("click",function(){
		$.ajax({	method: 'POST',
					url: '/saveRoom',
					data: {	roomName: $('#roomName').val(),
							roomDesc: $('#description').val(),
							roomActv: $('#activity').val(),
							roomExit: $('#exits').val()
						}
				})
	}); // end of saveButton .on(click)
}); // end of main function
