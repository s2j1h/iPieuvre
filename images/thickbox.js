/*
 * Thickbox 3.1 - One Box To Rule Them All.
 * By Cody Lindley (http://www.codylindley.com)
 * Copyright (c) 2007 cody lindley
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Modified by J.Raigneau for iPieuvre - sept 09
 *
*/
if(typeof thickox == 'undefined') {
	var thickox = 1;
	var tb_pathToImage = '../images/loadingAnimation.gif';
	
	// ADD THICKBOX TO HREF & AREA ELEMENTS THAT HAVE A CLASS OF .THICKBOX
	function tb_init(domChunk){
		$(domChunk)
			.click(function(){
				var t = this.title || this.name || null;
				var a = this.href || this.alt;
				var g = this.rel || false;
				var s= this.rev || '';
				tb_show(t,a,g,s);
				this.blur();
				return false;
			});
	}
	
	// FUNCTION CALLED WHEN THE USER CLICKS ON A THICKBOX LINK
	function tb_show(caption, url, imageGroup,source) {
		try {
			var queryString = url.replace(/^[^\?]+\??/,'');
			
			var params = $.extend({
				TB_class : 'thickbox',
				TB_bg : 'true'
			}, tb_parseQuery(queryString));
			
			// IF IE 6
			if (typeof document.body.style.maxHeight === 'undefined') {
				$('body','html').css({ height:'100%', width:'100%' });
				$('html').css('overflow', 'hidden');
				
				 // IFRAME TO HIDE SELECT ELEMENTS IN IE6
				if (document.getElementById('TB_HideSelect') === null) {
					$("body").append("<iframe id='TB_HideSelect'></iframe><div id='TB_overlay'></div><div id='TB_window' style='z-index:10002'></div>");
					$("#TB_overlay").click(tb_remove);
				}
			}else{//all others
				if(document.getElementById("TB_overlay") === null){
					$("body").append("<div id='TB_overlay' style='z-index:10000'></div><div id='TB_window' style='z-index:10002'></div>");
					$("#TB_overlay").click(tb_remove);
				}
			}
			
			if(params['TB_bg'] == 'true') {
				if(tb_detectMacXFF()) {
					// USE PNG OVERLAY SO HIDE FLASH
					$('#TB_overlay').addClass('TB_overlayMacFFBGHack');
				} else {
					// USE BACKGROUND AND OPACITY
					$('#TB_overlay').addClass('TB_overlayBG');
				}
			}
					
			if(caption === null) {
				caption = '';
			}
			
			// ADD LOADER TO THE PAGE
			$('body').append('<div id="TB_load" style="z-index:10001"><img src="'+imgLoader.src+'" /></div>');

			// SHOW LOADER
			$('#TB_load').show();
			
			
			$('#TB_overlay, #TB_window, #TB_load').addClass(params.TB_class);
			
			var baseURL;
			
			if(url.indexOf("?")!==-1){ //ff there is a query string involved
				baseURL = url.substr(0, url.indexOf("?"));
			} else { 
				baseURL = url;
			}

			var urlString = /\.jpg$|\.JPG\.jpeg$|\.png$|\.gif$|\.bmp$/;
			var urlType = baseURL.toLowerCase().match(urlString);
		
			if(urlType == '.jpg' || urlType == '.JPG'|| urlType == '.jpeg' || urlType == '.png' || urlType == '.gif' || urlType == '.bmp') {
				TB_nbImage = 1;
			
				TB_FirstCaption = '';
				TB_FirstURL = '';
				TB_FirstSource = '';
				
				TB_PrevCaption = '';
				TB_PrevURL = '';
				TB_PrevSource = '';
				
				TB_NextCaption = '';
				TB_NextURL = '';
				TB_NextSource = '';
				
				TB_LastCaption = '';
				TB_LastURL = '';
				TB_LastSource = '';
				
				TB_imageCount = '';
				TB_FoundURL = false;
				
				if(imageGroup) {
					TB_TempArray = $('a[rel='+imageGroup+']').get();
					TB_nbImage = TB_TempArray.length;
					
					$.each(TB_TempArray, function(TB_Counter) {
						var urlTypeTemp = this.href.toLowerCase().match(urlString);
						
						if(!TB_Counter) {
							TB_FirstCaption = this.title;
							TB_FirstURL = this.href;
							TB_FirstSource = this.rev;
						}
						
						if(TB_Counter == TB_TempArray.length-1) {
							TB_LastCaption = this.title;
							TB_LastURL = this.href;
							TB_LastSource = this.rev;
						}
						
						if(this.href == url) {
							TB_imageCount = 'Image '+(TB_Counter+1)+' sur '+(TB_TempArray.length);
							
							if(typeof TB_TempArray[TB_Counter-1] != 'undefined') {
								TB_PrevCaption = TB_TempArray[TB_Counter-1].title;
								TB_PrevURL = TB_TempArray[TB_Counter-1].href;
								TB_PrevSource = TB_TempArray[TB_Counter-1].rev; 
							}
													
							if(typeof TB_TempArray[TB_Counter+1] != 'undefined') {
								TB_NextCaption = TB_TempArray[TB_Counter+1].title;
								TB_NextURL = TB_TempArray[TB_Counter+1].href;
								TB_NextSource = TB_TempArray[TB_Counter+1].rev; 
							}
						}
					});
				}
		
				imgPreloader = new Image();
				imgPreloader.onload = function() {		
					imgPreloader.onload = null;
						
					// Resizing large images - orginal by Christian Montoya edited by me.
					var pagesize = tb_getPageSize();
					var x = pagesize[0] - 150;
					var y = pagesize[1] - 150;
					var imageWidth = imgPreloader.width;
					var imageHeight = imgPreloader.height;
					
					if (imageWidth > x) {
						imageHeight = imageHeight * (x / imageWidth); 
						imageWidth = x; 
						
						if (imageHeight > y) { 
							imageWidth = imageWidth * (y / imageHeight); 
							imageHeight = y; 
						}
					} else if (imageHeight > y) { 
						imageWidth = imageWidth * (y / imageHeight); 
						imageHeight = y;
						 
						if (imageWidth > x) { 
							imageHeight = imageHeight * (x / imageWidth); 
							imageWidth = x;
						}
					}
					// End Resizing
					
					TB_WIDTH = imageWidth + 30;
					TB_HEIGHT = imageHeight + 60;
		
					var content = '';
					content += '<div id="TB_ImageFull" style="position:relative;overflow:hidden;">';
					
					if(TB_nbImage > 1) {			
						content += '	<a id="TB_goPrev" alt="Image précédente" title="Image précédente" href="'+url+'" style="position:absolute;display:block;width:50%;height:100%;background:url(/api/pixel.gif) no-repeat;top:0;left:0;font-weight:bold;font-size:14px;text-decoration:none;">';
						content += '		<span style="position:absolute;padding:10px 5px;background:#FFF;display:none;color:#555;top:10%;left:15px;border:solid 1px;border-color:#CCC #666 #666 #FFF;">< PR&Eacute;C&Eacute;DENTE</span>';
						content += '	</a>';
						
						content += '	<a id="TB_goNext" alt="Image suivante" title="Image suivante" href="'+url+'" style="position:absolute;display:block;width:50%;height:100%;background:url(/api/pixel.gif) no-repeat;top:0;left:50%;font-weight:bold;font-size:14px;text-decoration:none;">';
						content += '		<span style="position:absolute;padding:10px 5px;background:#FFF;display:none;color:#555;top:10%;right:13px;border:solid 1px;border-color:#CCC #FFF #666 #CCC;">SUIVANTE ></span>';
						content += '	</a>';	
					}
					
					content += '	<div>';
					content += '		<img id="TB_Image" src="'+url+'" width="'+imageWidth+'" height="'+imageHeight+'" alt="'+caption+'"/>';
					content += '	</div>';
					
					content += '</div>';
					
					
					
					content += '<div style="overflow:hidden;height:33px;padding:0 15px">';
					
					content += '	<div id="TB_closeWindow" style="height:auto;padding:0;margin:0 0 0 10px;text-align:center;">';
					content += '		<p style="margin:0;padding:0;font-weight:bold;">'+TB_imageCount+'</p>';
					content += '		<a target="_blank" href="'+url+'" id="TB_realSizeButton" title="Agrandir (nouvelle fenêtre)">Agrandir</a>';
					content += '		/ <a href="#" id="TB_closeWindowButton" title="Fermer">Fermer</a>';
					content += '	</div>';
					content += 		caption;
					
					if(source) {
						content += ' - <span style="color:#666;font-style:italic"><i>'+source+'</i></span>';
					}
					
					content += '</div>';
		
					$('#TB_window').append(content); 		
					
					$('#TB_closeWindowButton').click(tb_remove);
					
					if(TB_nbImage > 1) {
						$('#TB_goPrev')
							.hover(function() {
								$(this).blur().find('span').show();
							}, function() {
								$(this).blur().find('span').hide();
							});
							
						$('#TB_goNext')
							.hover(function() {
								$(this).blur().find('span').show();
							}, function() {
								$(this).blur().find('span').hide();
							});
									
						/**
						 * Affiche la première image
						 */
						function goFirst() {
							tb_initWindow();
							tb_show(TB_FirstCaption, TB_FirstURL, imageGroup, TB_FirstSource);
							return false;	
						}
						
						/**
						 * Affiche l'image précédente
						 */					 					
						function goPrev(){
							//$(document).unbind('click', goPrev);
							tb_initWindow();
							tb_show(TB_PrevCaption, TB_PrevURL, imageGroup, TB_PrevSource);
							return false;	
						}	
						
						/**
						 * Affiche la prochaine image
						 */
						function goNext(){
							tb_initWindow();
							tb_show(TB_NextCaption, TB_NextURL, imageGroup, TB_NextSource);				
							return false;	
						}
							
						/**
						 * Affiche la dernière image
						 */
						function goLast() {
							tb_initWindow();
							tb_show(TB_LastCaption, TB_LastURL, imageGroup, TB_LastSource);
							return false;	
						}
						
						if(TB_PrevURL !== '') {
							new Image().src = TB_PrevURL;
							$('#TB_prev, #TB_goPrev').click(goPrev);
						} else {
							new Image().src = TB_LastURL;
							$('#TB_goPrev').click(goLast);
						}
						
						if(TB_NextURL !== '') {
							new Image().src = TB_NextURL;	
							$('#TB_next, #TB_goNext').click(goNext);
						} else {
							new Image().src = TB_FirstURL;
							$('#TB_goNext').click(goFirst);
						}
			
						document.onkeydown = function(e){ 	
							if (e == null) { // ie
								keycode = event.keyCode;
							} else { // mozilla
								keycode = e.which;
							}
							if(keycode == 27){ // close
								tb_remove();
							} else if(keycode == 39){ // display previous image
								if(!(TB_NextURL == "")){
									document.onkeydown = "";
									goNext();
								}
							} else if(keycode == 37){ // display next image
								if(!(TB_PrevURL == "")){
									document.onkeydown = "";
									goPrev();
								}
							}	
						};
					}
					
					tb_position();
					$("#TB_load").remove();
					$("#TB_ImageOff").click(tb_remove);
		            
		            TB_RESIZE = true;
		            TB_ImageFull_height = imageHeight+20;
		            $("#TB_ImageFull").css({height:TB_ImageFull_height+"px"});
		            
		            // FOR SAFARI USING CSS INSTEAD OF SHOW
					$('#TB_window').css('display', 'block'); 
	            };
				
				imgPreloader.src = url;
			} else {//code to show html
				var windowWidth = tb_getPageSize()[0];
				var windowHeight = tb_getPageSize()[1];
			
				if(!params['width']) {
					params['width'] = windowWidth;
				}
				
				if(!params['height']) {
					params['height'] = windowHeight;
				}
			
				TB_WIDTH = Math.min(params['width'], windowWidth)-30; //defaults to 630 if no paramaters were added to URL
				TB_HEIGHT = Math.min(params['height'], windowHeight)-30; //defaults to 440 if no paramaters were added to URL

				ajaxContentW = TB_WIDTH-30;
				ajaxContentH = TB_HEIGHT-45;
				
				if(url.indexOf('TB_iframe') != -1) { // EITHER IFRAME OR AJAX WINDOW
					urlNoQuery = url.split('TB_');
					$("#TB_iframeContent").remove();
					
					var content = '';
					
					if(params['modal'] != 'true'){ // IFRAME NO MODAL
						content += '<div id="TB_title">';
						content += '	<div id="TB_ajaxWindowTitle">'+caption+'</div>';
						content += '	<div id="TB_closeAjaxWindow">';
						content += '		<a href="#" id="TB_closeWindowButton" title="Fermer">fermer</a> ou Touche Echap';
						content += '	</div>';
						content += '</div>';
					} else { // IFRAME MODAL
						$('#TB_overlay').unbind();
					}
					
					content += '<iframe frameborder="0" hspace="0" src="'+urlNoQuery[0]+'" id="TB_iframeContent" name="TB_iframeContent'+Math.round(Math.random()*1000)+'" onload="tb_showIframe()" style="width:'+(ajaxContentW + 29)+'px;height:'+(ajaxContentH + 17)+'px;"> </iframe>';
					
					$('#TB_window').append(content);
				} else { // NOT AN IFRAME, AJAX
					if($('#TB_window').css('display') != 'block') {
						var content = '';
					
						if(params['modal'] != 'true'){ // AJAX NO MODAL
							content += '<div id="TB_title">';
							content += '	<div id="TB_ajaxWindowTitle"></div>';
							content += '	<div id="TB_closeAjaxWindow">';
							content += '		<a href="#" id="TB_closeWindowButton" title="Fermer">fermer</a> ou Touche Echap';
							content += '	</div>';
							content += '</div>';
							content += '<div id="TB_ajaxContent"></div>';
						} else { // AJAX MODAL
							content += '<div id="TB_ajaxContent" class="TB_modal"></div>';
							
							$('#TB_overlay').unbind();
						}
						
						$('#TB_window').append(content);	
					}
					
					$('#TB_ajaxContent')
						.width(ajaxContentW)
						.height(ajaxContentH)
						.find('#TB_ajaxWindowTitle').html(caption).end()
						.get(0).scrollTop = 0;
				}
				
				$('#TB_closeWindowButton').click(tb_remove);
			
				if(url.indexOf('TB_inline') != -1) {	
					$("#TB_ajaxContent").append($('#' + params['inlineId']).children());
					$("#TB_window").unload(function () {
						$('#' + params['inlineId']).append( $("#TB_ajaxContent").children() ); // MOVE ELEMENTS BACK WHEN YOU'RE FINISHED
					});
					tb_position();
					$("#TB_load").remove();
					$("#TB_window").css({display:"block"}); 
				} else if(url.indexOf('TB_iframe') != -1) {
					tb_position();
					
					// SAFARI NEEDS HELP BECAUSE IT WILL NOT FIRE IFRAME ONLOAD
					if($.browser.safari){
						$("#TB_load").remove();
						$("#TB_window").css({display:"block"});
					}
				} else {
					$("#TB_ajaxContent").load(url += "&random=" + (new Date().getTime()),function(){ // TO DO A POST CHANGE THIS LOAD METHOD
						tb_position();
						$("#TB_load").remove();
						tb_init("#TB_ajaxContent a.thickbox");
						$("#TB_window").css({display:"block"});
					});
				}
			}
	
			if(!params['modal']){
				document.onkeyup = function(e){ 	
					if (e == null) { // ie
						keycode = event.keyCode;
					} else { // mozilla
						keycode = e.which;
					}
					if(keycode == 27){ // close
						tb_remove();
					}	
				};
			}
		} catch(e) {
			//nothing here
		}
	}
	
	/**
	 * helper functions below
	 */	 
	function tb_showIframe(){
		$('#TB_load').remove();
		$('#TB_window').css({ display : 'block' });
	}
	
	/**
	 * Supression de la thickbox en cours
	 */	 	
	function tb_remove() {
	 	$("#TB_imageOff").unbind("click");
		$("#TB_closeWindowButton").unbind("click");
		$("#TB_window").fadeOut("fast",function(){$('#TB_window,#TB_overlay,#TB_HideSelect').trigger("unload").unbind().remove();});
		$("#TB_load").remove();
		
		if (typeof document.body.style.maxHeight == "undefined") {//if IE 6
			$("body","html").css({height: "auto", width: "auto"});
			$("html").css("overflow","");
		}
		
		document.onkeydown = "";
		document.onkeyup = "";
		return false;
	}
	
	/**
	 * Positionne la thickbox en fonction de sa taille
	 * @return void
	 */
	function tb_position() {
		var $TB_window = $('#TB_window');
		
		var borderLeft = parseInt($TB_window.css('border-left-width'), 10);
		var borderRight = parseInt($TB_window.css('border-right-width'), 10);
		var width = TB_WIDTH+borderLeft+borderRight;
		
		$TB_window.css({
			marginLeft : '-'+parseInt((width/2), 10)+'px',
			width : TB_WIDTH+'px'
		});
		
		if(!(jQuery.browser.msie && jQuery.browser.version < 7)) { // TAKE AWAY IE6
			var borderTop = parseInt($TB_window.css('border-top-width'), 10);
			var borderBottom = parseInt($TB_window.css('border-bottom-width'), 10);
			var height = TB_HEIGHT+borderTop+borderBottom;
		
			$TB_window.css({
				marginTop : '-'+parseInt((height/2), 10)+'px'
			});
		}
	}
	
	function tb_parseQuery ( query ) {
	   var Params = {};
	   if ( ! query ) {return Params;}// return empty object
	   var Pairs = query.split(/[;&]/);
	   for ( var i = 0; i < Pairs.length; i++ ) {
	      var KeyVal = Pairs[i].split('=');
	      if ( ! KeyVal || KeyVal.length != 2 ) {continue;}
	      var key = unescape( KeyVal[0] );
	      var val = unescape( KeyVal[1] );
	      val = val.replace(/\+/g, ' ');
	      Params[key] = val;
	   }
	   return Params;
	}
	
	function tb_getPageSize(){
		var de = document.documentElement;
		var w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
		var h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
		arrayPageSize = [w,h];
		return arrayPageSize;
	}
	
	function tb_detectMacXFF() {
	  var userAgent = navigator.userAgent.toLowerCase();
	  if (userAgent.indexOf('mac') != -1 && userAgent.indexOf('firefox')!=-1) {
	    return true;
	  }
	}
		
	function tb_initWindow() {
		$('#TB_window').remove();
		$('body').append('<div id="TB_window" style="z-index:10002"></div>'); 
	}
					
	// ON PAGE LOAD CALL TB_INIT
	$(document).ready(function(){
		tb_init('a.thickbox, area.thickbox, input.thickbox'); // PASS WHERE TO APPLY THICKBOX
		imgLoader = new Image(); // PRELOAD IMAGE
		imgLoader.src = tb_pathToImage;
	});
}
