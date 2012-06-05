// Initialize the Spotify objects
var sp = getSpotifyApi(1),
	models = sp.require("sp://import/scripts/api/models"),
	views = sp.require("sp://import/scripts/api/views"),
	ui = sp.require("sp://import/scripts/ui");
	player = models.player,
	library = models.library,
	application = models.application;

var args = models.application.arguments;

$(document).ready(function(){
	updatePlayer(player.track);

	if(args.length === 0){
		$["JSON_URI"] = "http://hypem.com/playlist/popular/noremix/json/1/data.js";
	}
	else{
		$["JSON_URI"] = args[0];
	}
	$.getJSON($["JSON_URI"], function(data) {
		var items = [];

		$(".loading").remove();

		$.each(data, function(rank, songmap) {
			$("#content-left").append(trackHTML(rank, songmap));
		});
	});

	function trackHTML(key, songmap){
		if(key === "version") {
			return "";
		}
		rank = parseInt(key);
		oddEvenStr = rank % 2 === 0 ? "even" : "odd";

		return $('\
			<div id="section-track-' + songmap["mediaid"] + '" class="section section-track ' + oddEvenStr + '" >\
			<div class="section-player">\
			<span class="rank">' + (parseInt(rank) + 1) + '</span>\
			<div class="track-info"> </div>\
			<h3 class="track_name">\
                <a class="artist" title="' + escape(songmap["artist"]) + ' - ' + escape(songmap["title"]) + ' - search Spotify for this song" onClick="spotifySearch(\'' + songmap["mediaid"] + '\', \'' + escape(songmap["artist"]) + '\', \'' + escape(songmap["title"]) + '\')">\
    				<span class="base-title">' + songmap["artist"] + ' - ' + songmap["title"] + '</span>\
    			</a>\
			</h3>\
			\
		    <div class="meta">\
		    	Search Hype Machine for: <a class="artist" title="' + songmap["artist"] + ' - search Hype Machine for this artist" href="http://hypem.com/artist/' + encodeURIComponent(songmap["artist"]) + '">' + songmap["artist"] + '</a>\
		        <span class="buy">\
                    Posted by ' + songmap["posted_count"] + ' blogs • \
		        </span>\
		    </div>\
		    \
	        <p>\
				<a class="blog-fav-off" title="See other tracks posted by this blog" href="http://hypem.com/blog/' + encodeURIComponent(songmap["sitename_first"]) + '/' + songmap["siteid_first"] + '">' + songmap["sitename_first"] + '</a>: \
				\
				"' + songmap["description"] + '"\
				<a class="readpost" href="' + songmap["posturl_first"] + '" title="Read this post: ' + songmap["artist"] + ' - ' + songmap["title"] + '">\
				\
				\
				<span style="background:url(' + songmap["thumb_url"] + ');"></span>\
				</a>\
        	</p>\
        	<div id="search_results_' + songmap["mediaid"] + '"></div>\
    		<div class="act_info" style=""></div>\
			</div>\
			</div>');
	}

	player.observe(models.EVENT.CHANGE, function(event) {
		console.log(event.data.curtrack);
		updatePlayer(player.track);
	}); 
});

function updatePlayer(track){
	if(track === null || player.track.data.isAd){
		var artistName = "";
		var trackName = "";
	}
	else{
		var artistName = track.album.artist.name.decodeForHTML();
		var trackName = track.name.decodeForHTML();
	}
	$("#player-nowplaying-artist").html(artistName).attr("href", "spotify:search:artist:" + artistName);
	$("#player-nowplaying-track").html(trackName).attr("href", "spotify:search:track:" + trackName);
}


function spotifySearch(mediaid, artistTerm, trackTerm){
	// var searchTerm = "artist:'" + artistTerm + "' track:'" + trackTerm + "'";
	var searchTerm = unescape(artistTerm) + " " + unescape(trackTerm);
	console.log("Media ID: " + mediaid);
	console.log("Search term: " + searchTerm);

    var search = new models.Search(searchTerm,
    	{
    		"pageSize": 4,
    		"searchPlaylists": false,
    		"searchAlbums": false
    	});
    search.localResults = models.LOCALSEARCHRESULTS.APPEND;
    
    var searchResultsHTML = $('#search_results_' + mediaid);
    searchResultsHTML.empty();

    search.observe(models.EVENT.CHANGE, function() {
    	if(search.totalTracks === 0 && artistTerm !== "" && trackTerm !== ""){
			searchResultsHTML.append($('<li>No direct matches found. Sorry!</li>'));
			spotifySearch(mediaid, artistTerm, "");
			spotifySearch(mediaid, "", trackTerm);
    	}
    	else {
            search.tracks.forEach(function (track) {
                var URIArray = track.uri.split(":");
                var id = URIArray[URIArray.length-1];

                var a = $('<a>').attr("href", track.uri).addClass("creator");
                a.html(track.artists[0].name.decodeForHTML() + " - " + track.name.decodeForHTML());
                var shareButton = $('<button id="share_' + id + '" class="sp-button icon" value="' + id + '"><span class="share"></span>Share</button>');
                shareButton.click(function(data){
                	console.log('share_' + id);
                	console.log($("#share_" + id).get(0).getClientRects()[0]);
                	application.showSharePopup($("#share_" + id).get(0), track.uri);
                });
                // link.append(a);
                searchResultsHTML.append($('<li>').append(a).append(shareButton));
            });
        }
    });

    search.appendNext(); 
}

function shareButton(mediaid, contentURI){
	var element = document.create()
}

function togglePlayPause(){
	$("#playerPlay").toggleClass("paused");
	player.playing = !player.playing;
}