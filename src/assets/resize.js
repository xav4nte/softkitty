
$(function(){
	$(".left-panel").resizable({
		handleSelector: ".resizer",
		resizeHeight: true,
		ghost: true,
		handles: 'w, e'
	  });
	 
	  $(".top-panel").resizable({
		handleSelector: ".resizer-horizontal",
		resizeWidth: false,
		handles: 'n, s'
	  });
	
	$('#filtermodal').on('shown.bs.modal', () =>{
		$('#filter').focus();
		console.log('set focus');
        $('#filter').get(0).select();
	})
})
