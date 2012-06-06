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
		// console.log(event);
		updatePlayer(player.track);
	}); 

});

function spotifySearch(mediaid, artistTerm, trackTerm, conjunction, continueSearchIfEmpty){
	if(typeof conjunction === "undefined"){
		conjunction = "AND";
	}
	if(typeof continueSearchIfEmpty === "undefined"){
		continueSearchIfEmpty = true;
	}

	var searchTerm = "\"" + unescape(artistTerm) + "\" " + conjunction + " \"" + unescape(trackTerm) + "\"";
	// console.log("Search term: " + searchTerm);

    var search = new models.Search(searchTerm,
    	{
    		"pageSize": 4,
    		"searchPlaylists": false,
    		"searchAlbums": false
    	});
    search.localResults = models.LOCALSEARCHRESULTS.APPEND;
    
    $('#search_results_' + mediaid).empty();

    search.observe(models.EVENT.CHANGE, function(search){processSearch(search, mediaid, artistTerm, trackTerm, continueSearchIfEmpty);});
    search.appendNext(); 
}

function processSearch(search, mediaid, artistTerm, trackTerm, continueSearchIfEmpty){
	if(search.totalTracks === 0){
		if(continueSearchIfEmpty){
			spotifySearch(mediaid, artistTerm, trackTerm, "OR", false);
		}
		else{
			$('#search_results_' + mediaid).append($('<p>No matches found. Sorry!</p>'));
		}
	}
	else {
        addSearchResults(search.tracks, mediaid);
    }
}

function addSearchResults(tracks, mediaid){
	var tempPlaylist = new models.Playlist();
	tracks.forEach(function (track) {
		tempPlaylist.add(track);
	});
	var playlistView = new views.List(tempPlaylist);

	$('#search_results_' + mediaid).append(playlistView.node);
}


function updatePlayer(track){
	if(track === null || player.track.data.isAd){
		var artistName = "";
		var trackName = "";
		$("#playerFav").removeClass("fav-on").addClass("fav-off");
	}
	else{
		var artistName = track.album.artist.name.decodeForHTML();
		var trackName = track.name.decodeForHTML();
		updateStarred(track.starred);
	}
	$("#player-nowplaying-artist").html(artistName).attr("href", "spotify:search:artist:" + artistName);
	$("#player-nowplaying-track").html(trackName).attr("href", "spotify:search:track:" + trackName);
}


function togglePlayPause(){
	$("#playerPlay").toggleClass("paused");
	player.playing = !player.playing;
}

function toggleStarred(){
	player.track.starred = !player.track.starred;
	updateStarred(player.track.starred);
}

function updateStarred(starred){
	var playerStar = $("#playerFav");
	if(starred){
		playerStar.removeClass("fav-off").addClass("fav-on");
	}
	else{
		playerStar.removeClass("fav-on").addClass("fav-off");
	}
}