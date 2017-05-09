/** _____________________________________________________________________________
 * First version written for tampermonkey here: https://github.com/bjohas/OSM-Wikipedia-Monkey
 * The organisation of the code below is based on [[en:MediaWiki:Gadget-metadata.js]]
 * To learn more about this script, visit https://www.mediawiki.org/wiki/User:Bjohas/OSMgadget
 */
window.wposm = (function () {
	var wposmObj = {
	    props: {},
	    methods: {}
	},
        //internal shortcuts
        ap = wposmObj.props,
        am = wposmObj.methods;

	wposmObj.init = function () {
	    // console.log("hello");
	    if (!$("#siteSub").length || //incompatible skin
                mw.config.get("wgNamespaceNumber") !== 0 || //non-mainspace page
                (mw.config.get("wgAction") !== "view" && mw.config.get("wgAction") !== "purge") || //non-read action
                mw.util.getParamValue("printable") || //printable page
                mw.config.get("wgPageName") === "Main_Page" //Main Page
                ) {
		return; //Don't run the script under any of these conditions.
	    }
	    ap.addBasicsResult = am.addBasics(); //checks for types visible from article page
	    if (ap.addBasicsResult) { 
		// console.log("getOSMData");
		am.getOSMData(ap.addBasicsResult);
	    }
	}

	am.addBasics = function () {
	    // Fetch page title
	    var attachhere = document.getElementById('siteNotice');
	    var attachdiv = document.createElement("div");
	    attachdiv.setAttribute('style', 'border: solid 1px blue; padding: 5px;');
	    attachdiv.appendChild(document.createTextNode("Wikipedia->OSM Link: "));
	    attachdiv.id = "attachdiv";
	    attachhere.appendChild(attachdiv);
	    attachdiv = document.getElementById('attachdiv');
	    var title = document.getElementById('firstHeading').innerHTML;
	    var wp = title;
	    title = encodeURI(title);
	    var lang = window.location.href;
	    lang = lang.replace(/\..*/,"").replace(/.*\//,"");
	    var coordspan = document.getElementById('coordinates');
	    wp = lang+":"+wp;
	    // Search by title
	    link = "https://osm.wikidata.link/search?q="+title;
	    attachdiv.appendChild(am.ahref("mylinkOSMWIKIDATA"," (osm.wikidata.link)","Search on osm.wikidata.link",link));
	    link = "http://overpass-turbo.eu/map.html?Q="+overpassquery + outskel;
	    // Obtain wikidata
	    var wd;
	    try {
		// Fetch wikidata
		wd = document.getElementById('t-wikibase').getElementsByTagName("a")[0].href;
		wd = wd.replace(/.*\//,"");
		attachdiv.appendChild(document.createTextNode("; "+wd));
	    } catch(err) {
		attachdiv.appendChild(document.createTextNode("; no wikidata!"));
	    }
	    var overpassquery = encodeURIComponent(
						      "[out:json][timeout:25];"+
						         '(node["wikipedia"="'+wp+'"];way["wikipedia"="'+wp+'"];relation["wikipedia"="'+wp+'"];'+
						         'node["wikidata"="'+wd+'"]; way["wikidata"="'+wd+'"]; relation["wikidata"="'+wd+'"];'+ 
						      "); out meta; ");
	    var outskel = encodeURIComponent(" >; out skel qt; ");
	    var coord;
	    var coord2;
	    var coord3;
	    var link;
	    var OSMExtension = "";
	    try {
		// Fetch coordinates
		var span = document.getElementsByClassName("geo-default")[0];
		coord2 = document.getElementsByClassName("geo")[0].innerHTML;
		coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
		coord2 = coord2.replace(/,+/,",");
		coord = coord2.split(",");
		// Also coordinates from link to geohack tools.wmflabs.org/geohack/geohack.php?....params=40.4865_N_8.7698_E_.....
		var lks = coordspan.getElementsByTagName("a");
		var lk = "";
		for (var j = 0; j < lks.length; j++){
		    if (lks[j].href.match(/geohack/g) === null) {
		    } else {
			lk = lks[j].href;
		    }
		}
		coord3 = encodeURI(lk.replace(/.*params=/,"").replace(/\&.*/,""));
	    } catch(err) {
		attachdiv.appendChild(document.createTextNode(" (coords!)"));
	    }
	    try {
		// Create links
		OSMExtension = "?zoom=18&mlat="+coord[0]+"&mlon="+coord[1];
		link = "http://www.openstreetmap.org/"+OSMExtension;
		attachdiv.appendChild(am.ahref("mylinkidOSM"," (OSM)","View area in OSM",link));
		// link = "http://www.openstreetmap.org/#map=17/"+coord[0]+"/"+coord[1];
		// link = "http://www.openstreetmap.org/edit#map=17/"+coord[0]+"/"+coord[1];
		link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord[0]+"&mlon="+coord[1]+"&lang="+lang+"&wikidata="+wd+"&wikipedia="+lang+":"+title;
		attachdiv.appendChild(am.ahref("mylinkidID"," (iD)","Edit area wth iD",link));
		link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+"name="+title+encodeURI("|source=wikipedia|wikidata="+wd+"|wikipedia=")+lang+":"+title;
		attachdiv.appendChild(am.ahref("mylinkidJOSM"," (JOSM)","Add node with JOSM",link));
		link = "http://overpass-turbo.eu/map.html?Q="+overpassquery+outskel;
		attachdiv.appendChild(am.ahref("mylinkidMAP"," (overpass-map)","View overpass interactive map for wikidata:"+wd,link));
		link = "http://overpass-api.de/api/interpreter?data="+overpassquery;
		attachdiv.appendChild(am.ahref("mylinkidJSON"," (overpass-json)","View overpass json data for wikidata:"+wd,link));
		// link = "http://localhost:50808/hello?title="+lang+":"+title+"&coord="+coord2+"&geohack="+coord3+"&wikidata="+wd;
		// attachdiv.appendChild(am.ahref("mylinkid"," (local)","You need a local server for this.",link));
	    } catch(err) {
		attachdiv.appendChild(document.createTextNode(" (links!)"));
	    }
	    link = "https://overpass-api.de/api/interpreter?data="+overpassquery;
	    return {"link": link, "OSMExtension": OSMExtension, "coord":coord};
	};

	am.getOSMData = function (obj) {
	    $.ajax({
		    url: obj.link,
		    async: true,
		    dataType: "text",
		    success: function(responseText) {
			try {
			    // console.log(responseText);
			    // alert(response.responseText);
			    var op = JSON.parse(responseText);
			    for (var j = 0; j < op.elements.length; j++){
				var id = op.elements[j].id;
				var type = op.elements[j].type;
				var haswp = "";
				if (op.elements[j].tags.wikipedia) {
				    haswp = "WP";
				}
				var haswd ="";
				if (op.elements[j].tags.wikidata) {
				    haswd = "WD";
				}
				link = "http://www.openstreetmap.org/"+type+"/"+id;
				// At least for the first link, rather than appending, we could replace the earlier link.
				if (j===0) {
				    document.getElementById('mylinkidOSM').href = link + obj.OSMExtension;
				    attachdiv.appendChild(document.createTextNode(" "+haswp+haswd));
				} else {
				    attachdiv.appendChild(am.ahref("mylinkidOSMx"," "+haswp+haswd+","+type+"/"+id,"View object "+j+" on OSM",link));
				}
				var factor = 0.005;
				var left = parseFloat(obj.coord[1]) - factor;
				var right = parseFloat(obj.coord[1]) + factor;
				var bottom = parseFloat(obj.coord[0]) - factor;
				var top = parseFloat(obj.coord[0]) + factor;
				var pos = "right="+right+"&left="+left+"&top="+top+"&bottom="+bottom;
				link = "http://127.0.0.1:8111/load_and_zoom?"+pos+"&new_layer=false&select="+type+id;
				if (j===0) {
				    document.getElementById('mylinkidJOSM').href = link ;
				} else {
				    attachdiv.appendChild(am.ahref("mylinkidJOSMx"," (JOSM) ","Edit object "+j+" with JOSM",link));
				}
			    }
			    if (op.elements.length === 0) {
				attachdiv.appendChild(document.createTextNode("; No OSM object!"));
				// Remove the above elements, as they won't work:
				//document.getElementById("mylinkidJSON").outerHTML = "";
				//document.getElementById("mylinkidMAP").outerHTML = "";
				document.getElementById("mylinkidJSON").outerHTML = " (overpass-JSON)";
				document.getElementById("mylinkidMAP").outerHTML = " (overpass-map)";
				// Better strategy would be to just remove the links, so the line doesn't shift about.
				//document.getElementById('mylinkidJSON').href = link ;
				//document.getElementById('mylinkidMAP').href = link ;
			    }
			} catch(err) {
			    console.log("error xmlhttp: "+err);
			}
		    }
		});
	    return 1;
	};

	/**
	 * Decodes all HTML entities in the string provided.
	 */
	am.decodeEntities = function (str) {
	    var t = document.createElement("textarea");
	    t.innerHTML = str;
	    return t.value;
	};

	am.ahref = function (id, text, title, href) {
	    var a = document.createElement("a");
	    a.appendChild(document.createTextNode(text));
	    a.id = id;
	    a.title = title;
	    a.href = href;
	    return a;
	}


	return wposmObj;
    }());

/**
 * Initializes the script on page load
 */
$(wposm.init);

