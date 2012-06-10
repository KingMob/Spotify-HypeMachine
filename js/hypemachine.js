// Initialize the Spotify objects
var sp = getSpotifyApi(1),
	models = sp.require("sp://import/scripts/api/models"),
	views = sp.require("sp://import/scripts/api/views"),
	ui = sp.require("sp://import/scripts/ui");
	player = models.player,
	library = models.library,
	application = models.application;

var args = models.application.arguments;

// Init func to run when jQuery loaded
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
		oddEvenClass = rank % 2 === 0 ? "even" : "odd";

		return $('\
			<div id="section-track-' + songmap["mediaid"] + '" class="section section-track ' + oddEvenClass + '" >\
			<div class="section-player">\
			<span class="rank">' + (rank + 1) + '</span>\
			<h3 class="track_name">\
                <a class="artist" title="' + escape(songmap["artist"]) + ' - ' + escape(songmap["title"]) + ' - search Spotify for this song" onClick="spotifySearch(\'' + songmap["mediaid"] + '\', \'' + escape(songmap["artist"]) + '\', \'' + escape(songmap["title"]) + '\')">\
    				<span class="base-title">' + songmap["artist"] + ' - ' + songmap["title"] + '</span>\
    			</a>\
			</h3>\
			<button class="sp-button sp-primary search-spotify-button" onClick="spotifySearch(\'' + songmap["mediaid"] + '\', \'' + escape(songmap["artist"]) + '\', \'' + escape(songmap["title"]) + '\')">Search Spotify<br>for this track</button>\
			\
		    <div class="meta">\
		    	Search Hype Machine for: <a class="artist" title="' + songmap["artist"] + ' - search Hype Machine for this artist" href="http://hypem.com/artist/' + encodeURIComponent(songmap["artist"]) + '">' + songmap["artist"] + '</a><br>\
                    Posted by ' + songmap["posted_count"] + ' blogs • \
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
			var resultsHeader = $("<div>").addClass("single-song-result").append($("<span>").html("No matches found. Sorry!").addClass("single-song-result-text"));
			$('#search_results_' + mediaid).append(resultsHeader);
		}
	}
	else {
        addSearchResults(search.tracks, mediaid);
    }
}

function addSearchResults(tracks, mediaid){

	var resultsHeader = $("<div>").addClass("single-song-result").append($("<span>").html("Possible matches on Spotify:").addClass("single-song-result-text"));
	$('#search_results_' + mediaid).append(resultsHeader);

	tracks.forEach(function (track) {
		addSingleTrack(track, mediaid);
	});
}

function addSingleTrack(track, mediaid){
	var tempPlaylist = new models.Playlist();
	tempPlaylist.add(track);
	
	var playerView = new views.Player();
	playerView.track = null;
	playerView.context = tempPlaylist;

	var jqPlayer = $(playerView.node).addClass('sp-image-small');
	var playerText = $("<a>").html(trackInfo(track)).addClass('single-song-result-text single-song-result-trackname');
	playerText.click(function(){
		if(player.track == null || !player.playing || player.track.uri !== track.uri){
			player.play(track.uri, tempPlaylist);
		}
		else {
			player.playing = false;
		}
	})
	var container = $("<div>").addClass('single-song-result');
	container.append(jqPlayer).append(playerText);

	$('#search_results_' + mediaid).append(container);
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

function trackInfo(track){
	return track.artists[0].name.decodeForHTML() + " - " + track.name.decodeForHTML();
}