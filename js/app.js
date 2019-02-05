// Initialize packages
import $ from 'jquery';
import _ from 'lodash';
import * as d3 from 'd3';

import { legendColor } from 'd3-svg-legend';
import d3Tip from "d3-tip";

window.$ = $;
window.jQuery = $;
window._ = _;
window.d3 = d3;
window.d3.legendColor = legendColor;
window.d3.tip = d3Tip;

const square = d3.selectAll("rect");
square.style("fill", "orange");

// interaction with definition clicks
window.slider1_speed = "500";
window.slider1_auto = "false";
window.slider1_hover = "true";

// API ID
const CLIENT_ID = 1 ; // replace

// Helper functions
const Utils = {
	colors: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a'],
	getAverage: function(arr) { return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length; },
	adder: function(a, b) { return a + b; },
	pitch: ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
	flattenData: function(arr) { return [].concat.apply([], arr); }
};

const App = {
	init: function() {
		App.bindEvents();
		var req = App.requestData();
	},
	bindEvents: function() {
		// Toggle definitions
		$('.image_slider_next').on("click", function(e) {
			e.preventDefault();
			$(this).next().fadeToggle();
		})
	},
	// Blank helper variables
	myToken: '',
	myPlaylists: [],
	requestData: function() {
		//// Auth section below from Spotify ////
		// Get the hash of the url
		const hash = window.location.hash
		.substring(1)
		.split('&')
		.reduce(function (initial, item) {
		  if (item) {
		    var parts = item.split('=');
		    initial[parts[0]] = decodeURIComponent(parts[1]);
		  }
		  return initial;
		}, {});
		window.location.hash = '';

		// Set token
		let _token = hash.access_token;

		const authEndpoint = 'https://accounts.spotify.com/authorize';

		// Replace with your app's client ID, redirect URI and desired scopes
		const redirectUri = 'https://spotify-viz.firebaseapp.com/'; // redirect: change to web url for hosted app
		const scopes = [
			// scopes needed for reading playlists of user
			'playlist-read-private',
			'playlist-read-collaborative'
		];

		// If there is no token, redirect to Spotify authorization
		if (!_token) {
		  window.location = `${authEndpoint}?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
		}

		if (_token) {
			App.myToken = _token;

		//// End of auth section from Spotify ////

			// Call rest of page if authorized only
			let params = {'offset': 0, 'limit': 10}; // Request top 10 playlists only - change to albums?
			var req = App.requestPlaylists(params);
			req.done(function(response) {
				// Once we get playlists, format playlists and get tracks and features
				App.playlistTracks(response);
			});

			return req;
		}

}, makeRequest: function(url, params, successFunction){

	// take in access token for generic request
	return	$.ajax({
			url: url,
			type: "GET",
			data: params,
			beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + App.myToken );}
	 });

}, requestPlaylists: function(params) {

	// request playlists
	return App.makeRequest('https://api.spotify.com/v1/me/playlists', params);

}, playlistTracks: function(response) {

	// format necessary variables from playlists
	var playlists = [];
	response.items.forEach(function(list) {
		if (list.tracks.total > 0) { // playlist must have at least one song
		 var pl = {'id': list.id,
						 'name': list.name,
						 'public': list.public,
						 'collaborative': list.collaborative
						 }
		  playlists.push(pl);
		 }
	 });
  App.myPlaylists = playlists;

	if (App.myPlaylists.length === 0) {
		// Exception for no playlists
		var emptyText = `<p class="title-desc">You have no playlists!</p>`
		$(".title-desc-holder").html(emptyText);
		return emptyText;
	} else {

			// Request tracks for each playlist
			var trackReqs = _.map(playlists, function(list) {
				return App.makeRequest(`https://api.spotify.com/v1/playlists/${list.id}/tracks`,
						 {limit:100, offset:0}); // Only first 100 tracks are shown for each playlist
			});

			$.when(...trackReqs).done( // Array of deferreds
				function(r1, r2, r3, r4, r5, r6, r7, r8, r9, r10) {

						var rawResponses = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10];
						var responseArr = rawResponses.filter(el => el) // remove undefined if less than 10 playlists

						// Format tracks and add tp playlist information
						var tracksArr = _.map(responseArr,function(r) {
																	var items =r[0].items;
																	return _.map(items, App.formatTrack);
																});

		        var pl = App.myPlaylists;
						pl.forEach(function(p,idx){
										p.tracks = tracksArr[idx];
										p.num_tracks = p.tracks.length;
										return p.tracks;
									});
					  App.myPlaylists = pl;

						// save track IDs to request features
		        var tracksId = _.map(tracksArr, function(t) {
																  return _.map(t, 'id').join(',')
																});

		        var featureReqs = _.map(tracksId, function(track_ids) {
							return App.makeRequest('https://api.spotify.com/v1/audio-features',
		 																					 {ids: track_ids});
						});

						var features = [];

						// Request features from tracks
						$.when(...featureReqs).then( // Array of deferred for each playlist
									function(f1, f2, f3, f4, f5, f6, f7, f8, f9, f10) {

										  var rawFeatures = [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10];
											var featureResponseArr = rawFeatures.filter(el => el) // remove undefined if less than 10 playlists

											// Format track features and add to playlist information
											var featuresArr = _.map(featureResponseArr,function(r) {
																						var feat = r[0].audio_features;
																						return _.map(feat, App.formatFeatures);
																					});

											// Calculate averages of features for each tracks and save for ease of use
									    var averageArr = _.map(featuresArr, App.tracksAverages);

		                  var pl = App.myPlaylists;
											pl.forEach(function(p, idx){
													 var trks = p.tracks;
													 trks.forEach(function(t) {
														 var feat = _.find(featuresArr[idx], {id: t.id});
														 t.features = feat;
														 return t;
													 })
													 p.tracks = trks;
													 p.averageFeatures = averageArr[idx];
													 return p;
											});
											App.myPlaylists = pl;

											// Finally, when playlists and tracks and features are requested,
											// Render each chart on the page
										  App.renderCharts(App.myPlaylists);
						 });
			});
 }

}, formatTrack: function(item) {
	 // format track information as needed
	 let formattedTrack = {
							 'id': item.track.id,
							 'name': item.track.name,
							 'popularity': item.track.popularity,
							 'duration_ms': item.track.duration_ms,
							 'artists': _.map(item.track.artists, 'name') // array of artists in case there are multiple
	 };
	 return formattedTrack;

}, formatFeatures: function(item) {
	// format track features information as needed
	if (item) {
	 var trackFeatures = {
		 'id': item.id,
		 'energy': item.energy,
		 'danceability': item.danceability,
		 'key': item.key,
		 'speechiness': item.speechiness,
		 'acousticness': item.acousticness,
		 'instrumentalness': item.instrumentalness,
		 'liveness': item.liveness,
		 'valence': item.valence,
		 'tempo': item.tempo,
		 'mode': item.mode
	 };
	 return trackFeatures;
 };
}, tracksAverages: function(tracksObject) {

	  var tracks = tracksObject.filter(el => el); // remove if no features information received
		var result = [];
		// Enforcing order for radar for viewability
		var metricKeys = ['speechiness','liveness',
											'acousticness','danceability',
											'energy','valence',
											'instrumentalness', 'mode']

		metricKeys.forEach(function(key) {
						var vals = tracks.map(f => f[key]);
						const avg = Utils.getAverage(vals);
						var averageObj = {metric: key,
															value: avg};
						result.push(averageObj);
		});

		return result;

}, renderCharts: function(playlists) {

	// render all charts on the page
	App.renderText(playlists);
	App.renderRadar(playlists);
	App.renderAster(playlists);
	App.renderPlatelet(playlists);
	App.renderScatter(playlists);
	App.renderHeat(playlists);
	App.renderForce(playlists);

}, renderText: function(playlists) {

	// Helper function average - ADD????
	// var add = function(a, b) { return a + b; }

	// calculate total time across tracks and playlists
	var totalMs = _.map(playlists, function(p) {
		return _.map(p.tracks,'duration_ms')
						 .reduce(Utils.adder, 0);
	    }).reduce(Utils.adder, 0);
	var totalTime = Math.round(totalMs/60000);

	// calculate total number of tracks and playlists
	var totalTracks = _.map(playlists, 'num_tracks').reduce(Utils.adder,0);
	var numPlaylists = playlists.length;

	// render summary statistics at the top
	$(".title-desc-holder").html(`<p class="title-desc">Analyzing & visualizing
															<b>${totalTime}</b> minutes of your
															<b>${totalTracks}</b> songs from your
															top <b>${numPlaylists}</b> playlists</p>`)

}, renderRadar: function(playlists) {

   // flatten average metrics
	 var data = playlists.map(function(p) {
		 var val = p.averageFeatures;
		 val.forEach(function(v) {
			  v.playlist = p.name });
		 return {key: p.name, values: val};
	 });

	 // set radar options
	 var radarChartOptions = {
			maxValue: 1, // set 100% as max
			wrapWidth: 60,
			levels: 5, // divide at 20% each
			roundStrokes: true,
			color: function(c) { return Utils.colors[c]; },
			axisName: "metric",
			areaName: "playlist",
			value: "value"
	 };

		// Render radar chart for average metrics on page
		RadarChart(".radarChart", data, radarChartOptions);

}, renderAster: function(playlists) {

	// helper average - REMOVE????
	// const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length; // move to utils

	var popularityArr = playlists.map(function(d, idx) {
		return {
			id     :  d.id,
			order  :  idx+1,
			color  :  Utils.colors[idx],
			weight :  d.num_tracks/Math.max(...playlists.map(d => d.num_tracks)), // weight by number of tracks in playlist
			score  :  Math.round(Utils.getAverage(_.map(d.tracks,'popularity')) * 100) / 100,
			width  :  d.num_tracks,
			label  :  d.name
		};
	});

	// render aster chart for popularity on page
	drawAster(".asterChart", popularityArr);

}, renderPlatelet: function(playlists) {

	// scale each platelet to minimum value
	var minValence = Math.min(...playlists.map(p => _.find(p.averageFeatures, {metric: 'valence'}).value));
	var valenceArr = _.map(playlists, function(d) {
		var val = _.find(d.averageFeatures, {metric: 'valence'}).value;
	  return {name: d.name,
	          valence: Math.round(val*100)/100,
	          transform: Math.pow(0.1+(val-minValence),2) // transform to accentuate differences
	        }
	});

  // render platelet chart for emotion on page
	drawPlatelet(".plateletChart", valenceArr, Utils.colors);

}, renderScatter: function(playlists) {

	// gather danceability data by track
	var tracksDance= playlists.map(function(d, idx){
	        var playlist = d.name;
	        var tr = d.tracks.map(function(t){
	            return {track: t.name,
	                    idx: idx,
	                    danceability: t.features.danceability,
	                    playlist: playlist};
	        });

	        return tr;
	    });

	var mergedDance = Utils.flattenData(tracksDance);

	// render scatter chart for dance on page
	drawScatter(".scatterChart", mergedDance, (function(c) { return Utils.colors[c]; }));

}, renderHeat: function(playlists) {

	// transform keys to major and minor
	var allKeys = [];
	Utils.pitch.forEach(function(p){
		allKeys.push(p+' major');
		allKeys.push(p+' minor');
	});

	var tracksKey = playlists.map(function(d, idx) {
			var keys = d.tracks.map(function(t) {
					var key = Utils.pitch[t.features.key];
					var getMode = function() {
						// map major/minor to mode
						if (t.features.mode === 0) {
							return `${key} minor`;
						}
						return `${key} major`
					}
					return getMode(key);
			});

			var keycount = [];

			// count number of tracks by key
			allKeys.forEach(function(k, kIndex) {
				var c = keys.filter(x => x==k).length;
				keycount.push({playlist: d.name,
						   idx: idx+1,
						   key: k,
							 keyIndex: kIndex,
						   value: c/d.num_tracks});
			});

			return keycount;
	});

	var mergedKeys = Utils.flattenData(tracksKey);

	// render heat map for keys on page
	drawHeat(".heatChart", mergedKeys);

}, renderForce(playlists) {

	// get energy information for each track
	var tracksEnergy = _.map(playlists, function(d, idx){
	        var playlist = d.name;
	        var tr = _.map(d.tracks, function(t){
	            return {track: t.name,
	                    energy: t.features.energy,
	                    playlist: playlist,
										  playlist_num: idx};
	        });
	        return tr;
	    });

	var mergedEnergy = Utils.flattenData(tracksEnergy);

	// render force chart for energy on page
	drawForce(".forceChart", mergedEnergy, mergedEnergy.length, function(c) { return Utils.colors[c]});

}
// end
};

$(document).ready(function() {
	// ready to go!
	App.init();
});
