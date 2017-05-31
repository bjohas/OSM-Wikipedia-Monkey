// * First version written for tampermonkey here: https://github.com/bjohas/OSM-Wikipedia-Monkey
// * The organisation of the code below is based on [[en:MediaWiki:Gadget-metadata.js]]
// * To learn more about this script, visit https://www.mediawiki.org/wiki/User:Bjohas/OSMgadget
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
                /*
        var counter = 0;
        if (am.get("counter")) {
            counter = parseInt(am.get("counter"));
            counter++;
        }
        am.put("counter",counter);
        console.log(counter); */
        am.configureMenu();
        if (am.getb('active')) {
            ap.addBasicsResult = am.addBasics(); //checks for types visible from article page
            if (ap.addBasicsResult) {
                console.log("getOSMData");
                am.getOSMData(ap.addBasicsResult);
		/* // Moved this down - only make ths request when the OSM request is done, otherwise issue with results ordering.
                if (ap.addBasicsResult.wikidata) {
                    console.log("osm.wikipedia.link");
                    am.getLinkData(ap.addBasicsResult);
                }
		*/
            }
        } else {
        }
    };

    am.configureMenu = function() {
	var attachhere;
        var attachdiv;
        var attachinmenu;
	// Set up main area
        attachhere = document.getElementById('siteNotice');
        attachdiv = document.createElement("div");
        attachdiv.setAttribute('style', 'border: solid 1px blue; padding: 5px; text-align: left;');
        attachdiv.id = "WikipediaOSM3005";
        if (am.getb('active')) {
            attachhere.appendChild(attachdiv);
            var basics = document.createElement("div");
	    basics.id = "WikipediaOSM3005_basics";
            attachdiv.appendChild(basics);	   
	    var results = document.createElement("div");
	    results.id = "WikipediaOSM3005_results_element";
	    results.setAttribute('style', 'border: solid 1px green; padding: 5px; text-align: left; display: none;');
            attachdiv.appendChild(results);	   
	    var mapframe = document.createElement("iframe");
	    mapframe.id = "WikipediaOSM3005_map_element";
	    mapframe.style = "display: none";
	    mapframe.width = document.getElementById("WikipediaOSM3005").offsetWidth-15; // should read the width of the inner div really...
	    mapframe.height = 400;
	    attachdiv.appendChild(mapframe);
	};
        // Set up switch - try to attach to menu
        var attachheremenu = document.getElementById('p-tb');
        if (!attachheremenu) {
            if (!am.getb('active')) {
		attachhere.appendChild(attachdiv);
	    };
            attachinmenu = false;
	    attachdiv = document.createElement("div");
        } else {
            attachinmenu = true;
            var ul = attachheremenu.getElementsByTagName('ul')[0];
            attachhere = ul;
            attachdiv = document.createElement("li");
        }
        attachdiv.id = "WikipediaOSM3005_menu";
        var input = document.createElement("input");
        input.type = "checkbox";
        input.id = "checkbox";
        input.checked = am.getb('active');
        input.onclick = function() { console.log(this.checked); am.put('active', this.checked); location.reload();} ;
        attachdiv.appendChild(input);
        attachdiv.appendChild(am.ahref("WikipediaOSM3005_menu_onoff","OSMgadget","Check/uncheck button to enable/disable. (Reloads page.) Click link for help.","https://www.mediawiki.org/wiki/User:Bjohas/OSMgadget"));
        attachhere.appendChild(attachdiv);
    };

    am.addBasics = function () {
        // Fetch page title
        var attachdiv = document.getElementById('WikipediaOSM3005_basics');
        am.addText(attachdiv,"Wikipedia-OSM: ");
        var title = document.getElementById('firstHeading').innerHTML;
        var wp = title;
        title = encodeURI(title);
        var lang = window.location.href;
        lang = lang.replace(/\..*/,"").replace(/.*\//,"");
        var coordspan = document.getElementById('coordinates');
        wp = lang+":"+wp;
        var wd;
        try {
            // Fetch wikidata
            wd = document.getElementById('t-wikibase').getElementsByTagName("a")[0].href;
            wd = wd.replace(/.*\//,"");
            am.addText(attachdiv,""+wd);
        } catch(err) {
            am.addText(attachdiv,"No wikidata!");
        }
	var querystart = encodeURIComponent("[out:json][timeout:25];");
	var outrel = encodeURIComponent('relation["wikipedia"="'+wp+'"]; relation["wikidata"="'+wd+'"]; out bb;');
        var overpassquery = encodeURIComponent(
            '(node["wikipedia"="'+wp+'"];way["wikipedia"="'+wp+'"];relation["wikipedia"="'+wp+'"];'+
            'node["wikidata"="'+wd+'"]; way["wikidata"="'+wd+'"]; relation["wikidata"="'+wd+'"];'+
            "); out meta qt; ");
        var outskel = encodeURIComponent(" >; out meta qt; "+
					 "{{style:\nnode {color: blue;}\nway { color: green;}\nrelation {color:pink; fill-opacity: 0;} }}");
//					 "{{style: node, way, relation { text: name; }\nnode {color: blue;}\nway { color: green;}\nrelation {color:pink; fill-opacity: 0;} }}");
	var overpassmap = querystart + outrel + overpassquery + outskel;
	overpassmap = querystart + outrel + overpassquery + outskel;
	overpassquery = querystart + overpassquery;
        var coord = [0,0];
        var coord_ = [0,0];
        var coord2 = "";
        var coord3 = "";
        var link = "";
        var OSMExtension = "";
        try {
            // Fetch coordinates
            if (document.getElementsByClassName("geo") && document.getElementsByClassName("geo")[0]) {
                coord2 = document.getElementsByClassName("geo")[0].innerHTML;
                coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
                coord2 = coord2.replace(/,+/,",");
                coord = coord2.split(",");
                console.log("(coord-method-1a-ok)");
            } else if (document.getElementsByClassName("geo-default") && document.getElementsByClassName("geo-default").length>0) {
                var span = document.getElementsByClassName("geo-default")[0];
                coord2 =span.innerHTML;
                coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
                coord2 = coord2.replace(/,+/,",");
                coord = coord2.split(",");
                console.log("(coord-method-1b-ok)");
            } else if (document.getElementsByClassName("geo-nondefault") && document.getElementsByClassName("geo-nondefault").length > 0) {
                var span2 = document.getElementsByClassName("geo-nondefault")[0];
                coord2 =span2.innerHTML;
                coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
                coord2 = coord2.replace(/,+/,",");
                coord = coord2.split(",");
                console.log("(coord-method-1c-ok)");
            } else {
                console.log("(coord-method-1-fail)");
                coord = "";
                coord2 = "";
            }
        } catch(err) {
            console.log("Unable to retrieve coordinates from wikipage (method 1). "+err);
            am.addText(attachdiv," (coords!)");
        }
        try {
            // Also coordinates from link to geohack tools.wmflabs.org/geohack/geohack.php?....params=40.4865_N_8.7698_E_.....
            var lk = "";
            var lks;
            var j = 0;
            if (coordspan) {
                lks = coordspan.getElementsByTagName("a");
                for (j = 0; j < lks.length; j++){
                    if (lks[j].href.match(/geohack/g) === null) {
                    } else {
                        lk = lks[j].href;
                    }
                }
                if (lk === "") {
                    console.log("(coord-method-2b-fail)");
                } else {
                    coord3 = encodeURI(lk.replace(/.*params=/,"").replace(/\&.*/,""));
                    console.log("(coord-method-2a-ok)");
                }
            } else {
                lks = document.getElementsByTagName("a");
                lk = "";
                for (j = 0; j < lks.length; j++){
                    if (lks[j].href.match(/geohack/g) === null) {
                    } else {
                        lk = lks[j].href;
                    }
                }
                if (lk === "") {
                    console.log("(coord-method-2b-fail)");
                } else {
                    coord3 = encodeURI(lk.replace(/.*params=/,"").replace(/\&.*/,""));
                    console.log("(coord-method-2b-ok)");
                }
            }
            coord3 = coord3.replace(/_N_/,",").replace(/_E_.*/,"");
            if (coord3.match(/_/g)) {
                console.log("Discarding coords from geohack: "+coord3);
                coord3="";
            }
            coord_ = coord3.split(",");
        } catch(err) {
            console.log("Unable to retrieve coordinates from wikipage (method 2). "+err);
            am.addText(attachdiv," (coords!)");
        }
	if (coord2 !== "" && coord3 !== "") {
//	    am.addText(attachdiv,", dual coord: "+coord3,1);
	    if (coord[0] != coord_[0]) {
		am.addHTML(attachdiv," <b style=\"background-color: pink;\">(mismatch/WP lat: "+am.distance(parseFloat(coord[0]),parseFloat(coord[1]),parseFloat(coord_[0]),parseFloat(coord_[1])) + "m)</b>");
	    }
	    if (coord[1] != coord_[1]) {
		am.addHTML(attachdiv," <b style=\"background-color: pink;\">(mismatch/WP lon: "+am.distance(parseFloat(coord[0]),parseFloat(coord[1]),parseFloat(coord_[0]),parseFloat(coord_[1])) + "m)</b>");
        }
	}
	if (coord2 === "" && coord3 !== "") {
	    coord = coord_;
	}
        try {
            // Create links
	    //	    var mystyle = "border: 1px solid blue; border-bottom: 1px solid white; margin-left: 3px; padding-left: 3px;padding-right: 3px;";
	    var mystyle = "border: 1px solid purple; background: lightgrey; margin-left: 3px; padding-left: 3px;padding-right: 3px;";
            attachdiv.appendChild(am.ahref("WikipediaOSM3005_results","No results","Show/hide results (if any). Setting is remembered.","javascript:",0,mystyle));
	    attachdiv.appendChild(am.ahref("WikipediaOSM3005_map","No map","Show/hide map (if available). Setting is remembered.","javascript:",0,mystyle));
	    am.toggle("WikipediaOSM3005_results","results",true);
	    var op_results_control = document.getElementById("WikipediaOSM3005_results");
	    op_results_control.innerHTML = "show results";
	    op_results_control.onclick = function() { am.toggle(this.id,"results"); return false; };
	    am.toggle("WikipediaOSM3005_map","map",true);
// OpenStreetMap.org - area
            OSMExtension = "?zoom=18&mlat="+coord[0]+"&mlon="+coord[1];
            link = "http://www.openstreetmap.org/"+OSMExtension;
            attachdiv.appendChild(am.ahref("mylinkidOSM"," (OSM)","View area in OSM",link));
// OpenStreetMap.org - iD - edit area
            // link = "http://www.openstreetmap.org/#map=17/"+coord[0]+"/"+coord[1];
            // link = "http://www.openstreetmap.org/edit#map=17/"+coord[0]+"/"+coord[1];
            link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord[0]+"&mlon="+coord[1]; // +"&lang="+lang+"&wikidata="+wd+"&wikipedia="+lang+":"+title;
            attachdiv.appendChild(am.ahref("mylinkidID"," (iD)","Edit area with iD",link));
// JOSM - add node
            link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+encodeURIComponent("name="+encodeURIComponent(title)+encodeURI("|source=wikipedia|wikidata="+wd+"|wikipedia=")+lang+":"+encodeURIComponent(title));
            attachdiv.appendChild(am.ahref("mylinkidJOSM"," (JOSM)","Add node with JOSM",link,1));
// Overpass-turbo - map
            link = "https://overpass-turbo.eu/map.html?Q="+overpassmap;
            attachdiv.appendChild(am.ahref("mylinkidMAP"," (overpass-map)","View overpass interactive map for wikidata:"+wd,link));
	    // Overpass-api - data
            link = "http://overpass-api.de/api/interpreter?data="+overpassquery;
            attachdiv.appendChild(am.ahref("mylinkidJSON"," (overpass-json)","View overpass json data for wikidata:"+wd,link));
            // link = "http://localhost:50808/hello?title="+lang+":"+title+"&coord="+coord2+"&geohack="+coord3+"&wikidata="+wd;
            // attachdiv.appendChild(am.ahref("mylinkid"," (local)","You need a local server for this.",link));
// Help link
            attachdiv.appendChild(am.ahref("reportIssue"," (HELP)","Report an issue and make suggestions for this Gadget.","https://www.mediawiki.org/wiki/User:Bjohas/OSMgadget"));
        } catch(err) {
            am.addText(attachdiv," (error: No links!)");
	    console.log(err);
        }
        link = "https://overpass-api.de/api/interpreter?data="+overpassquery;
        var hascoords = 1;
        if (coord2 === '' && coord3 === '') {
            hascoords = 0;
        }
        return {"link": link, "OSMExtension": OSMExtension, "coord":coord, "hascoords":hascoords, "wikidata" : wd};
    };

    am.getOSMData = function (obj) {
        var attachdiv = document.getElementById('WikipediaOSM3005_results_element');
	if (!attachdiv) {
	    console.log("attachiv undefined");
	}
	am.addHTML(attachdiv,"<b>Overpass:</b> ");
	var myspan = document.createElement('span');
        var mytext = document.createTextNode(" ... Fetching data from overpass (should only take a sec) ... ");
        myspan.id = "temporary";
        myspan.appendChild(mytext);
        attachdiv.appendChild(myspan);
        var link = "";
        if (obj.hascoords==1) {
            am.addText(attachdiv,"Wikipedia_page_coords=(");
            var OSMExtension = "?zoom=18&mlat="+obj.coord[0]+"&mlon="+obj.coord[1];
            link = "http://www.openstreetmap.org/"+OSMExtension;
            attachdiv.appendChild(am.ahref("mylinkidOSM",obj.coord[0]+","+obj.coord[1],"View area in OSM",link));
            am.addText(attachdiv,"); ",1);
        } else {
            am.addText(attachdiv,"Wikipedia_page_coords not available.",1);
        }
        try {
                                $.ajax({
            url: obj.link,
            async: true,
            dataType: "text",
            success: function(responseText) {
                            try {
                    // console.log(responseText);
                    // alert(response.responseText);
                    var op = JSON.parse(responseText);
                    if (op) {
                        myspan.innerHTML = '';
                        var ol = document.createElement("ol");
			if (op.elements.length>0) {
			    //  results have come in, so map can be launched.
			    am.launchmap();
			}
                        for (var j = 0; j < op.elements.length; j++){
                            var li = document.createElement("li");
                            var matchno = j+1;
                            var id = op.elements[j].id;
                            var type = op.elements[j].type;
			    li.id = type + id;
                            var haswp = "";
                            if (op.elements[j].tags.wikipedia) {
                                haswp = "WP";
                            }
                            var haswd ="";
                            if (op.elements[j].tags.wikidata) {
                                haswd = "WD";
                            }
                            link = "http://www.openstreetmap.org/"+type+"/"+id;
                            var linkID = "http://www.openstreetmap.org/edit?"+type+"="+id;
                            // For the first result, amend the earlier links:
                            if (j===0) {
                                document.getElementById('mylinkidOSM').href = link + obj.OSMExtension;
                                // document.getElementById('mylinkidOSM').text = " (OSM/"+type+id+")";
                                document.getElementById('mylinkidOSM').text = " (OSM+)";
				document.getElementById('mylinkidOSM').target = "_new";
                                document.getElementById('mylinkidOSM').title = "View object on OSM.org.";
                                document.getElementById('mylinkidID').href = linkID;
                                document.getElementById('mylinkidID').text = " (iD+)";
				document.getElementById('mylinkidID').target = "_new";
                                document.getElementById('mylinkidID').title = "Edit object with iD.";
                            } 
                            am.addText(li," "+haswp+haswd+". ");
                            var factor = 0.005;
                            var left = parseFloat(obj.coord[1]) - factor;
                            var right = parseFloat(obj.coord[1]) + factor;
                            var bottom = parseFloat(obj.coord[0]) - factor;
                            var top = parseFloat(obj.coord[0]) + factor;
                            var pos = "right="+right+"&left="+left+"&top="+top+"&bottom="+bottom;
                            // load_and_zoom - would also load area:
                            // link = "http://127.0.0.1:8111/load_and_zoom?"+pos+"&new_layer=false&select="+type+id;
                            var link = "http://127.0.0.1:8111/load_object?objects="+type+id+"&new_layer=false";
                            if (j===0) {
                                document.getElementById('mylinkidJOSM').href = link ;
                                document.getElementById('mylinkidJOSM').text = " (JOSM+)" ;
				document.getElementById('mylinkidJOSM').target = "_new";
                                document.getElementById('mylinkidJOSM').title = "Load object with JSON." ;
                            }
                            li.appendChild(am.formatosm(op.elements[j],{"compare": obj.hascoords, "wikidata": obj.wikidata,
									"lat":obj.coord[0],"lon":obj.coord[1]}));
                            ol.appendChild(li);
                        }
                        attachdiv.appendChild(ol);
                        if (op.elements.length === 0) {
                            am.addText(attachdiv,"No OSM object! Check data for osm.wikidata.link below for potential matches. ",1);
                            // Remove the above elements, as they won't work:
                            document.getElementById("mylinkidJSON").outerHTML = " (overpass-JSON)";
                            document.getElementById("mylinkidMAP").outerHTML = " (overpass-map)";
                        } else {
                            if (obj.hascoords === 0) {
                                am.addText(attachdiv,"",1);
                                am.addText(attachdiv,"The wikipedia/wikidata entry has no coordinates, but is linked to an OSM object. Please do not copy coordinates from OSM to wikipedia/wikidata.",1);                        
                            }
                        }
                    } else {
                        am.addText(attachdiv," Sorry, the overpass request has failed (no data).",1);
                    }
                } catch(err) {
                    console.log("getOSM data error xmlhttp: "+err);
                    am.addText(attachdiv," Sorry, the overpass request has failed. If you've loaded a lot of pages, you may be over quota - try reloading this page.");
                    attachdiv.appendChild(am.ahref("checkStatus"," You can check your API status here","Check overpass API status.","http://overpass-api.de/api/status"));
                    am.addText(attachdiv,"",1);
                }
                if (obj.wikidata) {
                    console.log("osm.wikipedia.link");
                    am.getLinkData(obj);
                }
            }
        });
        } catch(err) {
            console.log("getOSM error in domain request: "+err);
        }
        return 1;
    };


    am.launchmap = function() {
	try {
	    // Load map if element is visible:	
	    if (document.getElementById("WikipediaOSM3005_map_element").style.display == "block") {
		var mapframe = document.getElementById("WikipediaOSM3005_map_element");
		if (!mapframe.src || mapframe.src === '') {
		    mapframe.src = document.getElementById("mylinkidMAP").href;
		};
	    }
	    // Enable map control:
	    var op_map_control = document.getElementById("WikipediaOSM3005_map");
	    op_map_control.onclick = function() {
		var mapframe = document.getElementById("WikipediaOSM3005_map_element");
		if (!mapframe.src || mapframe.src === '') {
		    mapframe.src = document.getElementById("mylinkidMAP").href;
		};
		am.toggle(this.id,"map"); return false;
	    };
	} catch (err) {
	    console.log("Error restoring map: "+err);
	}
    };
    
    am.getLinkData = function (obj) {
	var wikidata = obj.wikidata;
        var apiurl = "https://osm.wikidata.link/api/1/item/"+wikidata;
	var attachdiv = document.getElementById('WikipediaOSM3005_results_element');
	am.addHTML(attachdiv,"<b>Matcher:</b> ");
        attachdiv.appendChild(am.ahref("osmwplinksite","osm.wikidata.link","Go to osm.wikidata.link","https://osm.wikidata.link"));
        attachdiv.appendChild(am.ahref("osmwplinkAPI"," (query) ","API url: "+apiurl,apiurl));
        // Search by title
        var title = document.getElementById('firstHeading').innerHTML;
        var link = "https://osm.wikidata.link/search?q="+title;
        attachdiv.appendChild(am.ahref("mylinkOSMWIKIPEDIA"," (search:"+title+")","Search for title on osm.wikidata.link",link));
        link = "https://osm.wikidata.link/search?q="+wikidata;
        attachdiv.appendChild(am.ahref("mylinkOSMWIKIDATA"," (connect:"+wikidata+")","Use osm.wikidata.link to make connection from WD to OSM.",link));
        var myspan = document.createElement('span');
        var mytext = document.createTextNode(" ... Retrieving additional matches from osm.wikipedia.link (please be patient) ... ");
        myspan.id = "temporary";
        myspan.appendChild(mytext);
        attachdiv.appendChild(myspan);
        am.addText(attachdiv,"",1);
        try {
                                $.ajax({
            url: apiurl,
            async: true,
            dataType: "text",
            success: function(responseText) {
                            try {
                    var op = JSON.parse(responseText);
                    if (op) {
                        myspan.innerHTML = '';
                        var wdlat = 0;
                        var wdlon = 0;
                        var wdhasll = 0;
                        if (op.wikidata.lat) {
                            am.addText(attachdiv,"Wikidata_coords=(");
                            var OSMExtension = "?zoom=18&mlat="+op.wikidata.lat+"&mlon="+op.wikidata.lon;
                            link = "http://www.openstreetmap.org/"+OSMExtension;
                            attachdiv.appendChild(am.ahref("mylinkidOSM",op.wikidata.lat+","+op.wikidata.lon,"View area in OSM",link));
                            am.addText(attachdiv,"); ");
                            wdlat = op.wikidata.lat;
                            wdlon = op.wikidata.lon;
                            wdhasll = 1;
			    if (obj.hascoords) {
				var distance = am.distance(parseFloat(obj.coord[0]),parseFloat(obj.coord[1]),wdlat,wdlon);
				am.addText(attachdiv,"d(WD,WP)="+distance+"m");
				var maxd = 300;
				if (distance>maxd) {
				    am.addHTML(attachdiv,", <b style=\"background-color: pink;\">DISTANCE > "+maxd+"m</b>"+
					       " (Please check/amend wikipedia/wikidata coordinates.)");
				}
			    }
			    am.addText(attachdiv,"",1);
                        } else {
                            am.addText(attachdiv,"Wikidata_coords not available.",1);
                        }
                        if (op.found_matches) {
                            var existing = 0;
                            var nonexisting = 0;
                            var querystr = "";
                            var querystrRel = "";
                            var ol = document.createElement("ol");
                            var li = "";
                            for (var j = 0; j < op.osm.length; j++){
                                if (op.osm[j].type == "relation") {
                                    querystrRel = querystrRel + op.osm[j].type + "(" + op.osm[j].id + ");\n";
                                } else {
                                    querystr = querystr + op.osm[j].type + "(" + op.osm[j].id + ");\n";
                                }
				var liid = op.osm[j].type + op.osm[j].id;
				var duplicate = false;
				if (document.getElementById(liid)) {
				    li = document.getElementById(liid);
				    am.addText(li,"",1);
				    am.addHTML(li,"<b>Matcher result (existing):</b> ");
				    duplicate = true;
//				    console.log("Entry exists.");
				} else {
                                    li = document.createElement("li");				   
				    li.id = op.osm[j].type + op.osm[j].id;
				    am.addHTML(li,"<b>Matcher result (new):</b> ");
//				    console.log("Entry does not exist.");
				};
                                li.appendChild(am.formatosm(op.osm[j],{"compare":wdhasll,"lat":wdlat,"lon":wdlon,"wikidata":wikidata}));
				if (!duplicate) 
                                    ol.appendChild(li);
                                if (op.osm[j].existing) {
                                    existing++;
                                } else {
                                    nonexisting++;
                                }
                            }
                            attachdiv.appendChild(ol);
                            if (op.osm.length > 0) {
                                var overpassquery = encodeURIComponent("[out:json][timeout:25];\n"+
                                                                       "("+querystr+querystrRel+");\nout meta; >; out skel qt; "+
                                                                       "("+querystrRel+");\nout bb;\n"+
                                                                       "{{style: node, way, relation { text: name; }\nnode {color: blue;}\nway { color: green;}\nrelation {color:pink; fill-opacity: 0;} }}");
                                link = "http://overpass-turbo.eu/map.html?Q="+overpassquery;
                                attachdiv.appendChild(am.ahref("myresultsMAPall","(overpass-map with all results)","View overpass interactive map for all results,link)",link));
                                link = "http://overpass-turbo.eu/?Q="+overpassquery;
                                attachdiv.appendChild(am.ahref("myresultsOPQall","(overpass-turbo query)","View overpass ide for all results,link)",link));
                                am.addText(attachdiv," If you cannot see all results, it may be that objects over overlapping.",1);
                            }
                            am.addText(attachdiv,"There are "+existing+" OSM objects that are already linked to this wikidata item. There are "+nonexisting+" potential matches.",1);
                            am.addText(attachdiv," RECOMMENDATION: ");
                            if (existing === 0) {
                                am.addText(attachdiv," Given that there is no connection yet, ");
                                link = "https://osm.wikidata.link/search?q="+wikidata;
                                attachdiv.appendChild(am.ahref("mylinkOSMWIKIDATA"," click here to use osm.wikidata.link to make one.","Use osm.wikidata.link to make connection from WD to OSM.",link));
                                am.addText(attachdiv," Alternatively you can use the iD/JOSM links above. ");
                            } else if (existing === 1) {
                                am.addText(attachdiv," Given that there is exactly one connection, it may well be ok. Use the above links to check. ");
                            } else {
                                am.addText(attachdiv," Given that there is more than one connection, you may want to use the above links to check tagging. ");
                            }
                            am.addText(attachdiv,"",1);

                        } else {
                            if (op.error) {
                                am.addText(attachdiv,"The query returned no results, with error message: '"+op.error+"'. ",1);
                                if (op.error === "no coordinates") {
                                    am.addText(attachdiv,"RECOMMENDATION: add the coordinates to the wikidata item.");
                                }
                            } else {
				if (op.response == 'ok') 
                                    am.addText(attachdiv,"The query did not find any results (no errors). ",1);
				else
				    am.addText(attachdiv,"The query returned no results, with message: "+op.response+". ",1);
				am.addText(attachdiv,"QSM query parameters: "+JSON.stringify(op.search).replace(/","/g,'", "'));
                            }
                        }
                    }
                } catch(err) {
                    am.addText(attachdiv,"Sorry, the query has failed (error in parse).");
                    console.log("Parse error xmlhttp: "+err+ "JSON: "+responseText);
                }
            }
        });
        } catch (err) {
            am.addText(attachdiv,"Sorry, the query has failed (error in response).");
            am.addText(attachdiv,"API did not respond.");
            console.log("API error xmlhttp: "+err);
        }
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

    am.formatosm = function (osm, extra) {
        var element = document.createElement('span');
        var type= osm.type;
        var id = osm.id;
        var text =  "";
        var wikidata = "";
        if (extra) {
            if (extra.wikidata) {
                wikidata = extra.wikidata;
            }
        }
        var color = "white";
        switch(osm.type) {
            case "node":
                color = "blue";
                break;
            case "way":
                color = "green";
                break;
            case "relation":
                color = "purple";
                break;
            default:

        }
        if (osm.tags) {
            if (osm.tags.name) {
                text = text + "" + osm.tags.name + "";
                element.innerHTML = "<b style=\"color: "+color+";\">"+text+"</b>. ";
                //                text = ". ";
            }
            if (osm.tags.wikidata) {
                if (osm.tags.wikidata != wikidata) {
                    element.innerHTML += " <b style=\"background-color: pink;\">WIKIDATA TAG MISMATCH!</b>";
                } else {
                    element.innerHTML += " <i style=\"background-color: lightgreen;\">wikidata match!</i> ";
                }
            }
        }
        text = "";
        text = text + osm.type+osm.id;
        var textelement = document.createTextNode(text);
        element.appendChild(textelement);
        var mlatmlon = "";
        if (extra.compare) {
            if (extra.compare==1) {
                mlatmlon = "?mlat="+extra.lat+"&mlon="+extra.lon;
            }
         }
        var link = "http://www.openstreetmap.org/"+type+"/"+id+mlatmlon;
        element.appendChild(am.ahref("mylinkidOSMx"," (OSM)","View object on OSM",link));
        link = "http://www.openstreetmap.org/edit?"+type+"="+id;
        element.appendChild(am.ahref("mylinkidOSMx"," (iD)","Edit object in iD",link));
        link = "http://127.0.0.1:8111/load_object?objects="+type+id+"&new_layer=false";
        element.appendChild(am.ahref("mylinkidJOSMx"," (JOSM,","Load object with JOSM (same layer)",link,1));
        link = "http://127.0.0.1:8111/load_object?objects="+type+id+"&new_layer=false&addtags=wikidata="+wikidata;
        element.appendChild(am.ahref("mylinkidJOSMxEdit"," add) ","Add wikidata to with JOSM (same layer)",link,1));
        text = "(";
        var distance = 0;
        var lat = "";
        var lon = "";
        if (osm.center) {
            text = text + "C: ";
            lat = osm.center.lat;
            lon = osm.center.lon;
        } else if (osm.lat) {
            lat = osm.lat;
            lon = osm.lon;
        }
        if (lat !== "") {
            text = text +lat+","+lon;
        }
        if (osm.existing) {
            text = text + "; "+osm.existing;
        }
        text += ")";
        textelement = document.createTextNode(text);
        element.appendChild(textelement);
        if (extra.compare && lat !== "") {
	    text = "";
            if (extra.compare==1) {
                distance = am.distance(lat,lon,parseFloat(extra.lat),parseFloat(extra.lon));
                // text = text +", "+lat+" "+lon+", "+extra.lat+" "+extra.lon+", d=" + distance;
                text = text + ", d=" + distance + "m";
                var maxd = 300;
                if (distance>maxd) {
                    text = text + ", <b style=\"background-color: pink;\">DISTANCE > "+maxd+"m</b> (Please/check amend wikipedia/wikidata coordinates.)";
                }
                if (osm.distance) {
                    text = text + ", "+osm.distance+"m";
                }
            }
            element.innerHTML += text;
	    text = "";
	}
         element.appendChild(document.createElement('br'));
        text = JSON.stringify(osm.tags);
        text = text.replace(/","/g,'", "');
        textelement = document.createTextNode(text);
        element.appendChild(textelement);
        return element;
    };

    am.addText = function(obj,text,br) {
        obj.appendChild(document.createTextNode(text));
        if (br == 1) {
            obj.appendChild(document.createElement('br'));
        }
    };

    am.addHTML = function(obj,text,br) {
	var myspan = document.createElement('span');
        myspan.innerHTML = text;	   
        obj.appendChild(myspan);
    };
    
    am.ahref = function (id, text, title, href, onclick, style) {
        var a = document.createElement("a");
        a.appendChild(document.createTextNode(text));
        a.id = id;
        a.title = title;
        a.href = href;
	if (style) {
	    a.style = style;
	}
        if (onclick) {
            if (onclick==1) {
                /*
                // Block href from doing anyhing
                a.href = "javascript:(function() { return false; }());";
                // a.href = "";
                // This works but only for the uppper box, strangely not for the lower box...
                a.onclick = function() { opencloseWin(href); return false; };
                // a.addEventListener("click", amyfunc, false );
                */
                // This works for both:
                a.href = "javascript:(function() {  var myWindow = window.open(\""+href+"\", \"_new\"); setTimeout(function() { myWindow.close(); }, 1000); return false; }());";
            }
        }
        return a;
    };
/*
function(){ opencloseWin(href); return false;}
*/
    function myfunc() {
        alert('hello');
        return false;
    }

    function opencloseWin(url) {
        var myWindow;
        try {
            myWindow = window.open(url, "_new");
        } catch (err) {
            console.log(err);
        }
        setTimeout(function() {
            myWindow.close();
        }, 1000);
        return false;
    }

    am.distance = function(lat, lon, lat2, lon2) {
//        console.log(lat, lon, lat2, lon2);
        var pi = Math.PI;
        var rad = pi/180.0;
        var dx = (lon - lon2)*rad * Math.cos((lat + lat2)/2*rad);
//        console.log(dx);
        var dy = (lat - lat2)*rad ;
//        console.log(dy);
        var dd = Math.pow(Math.pow(dx,2) + Math.pow(dy,2),0.5) * 6371.0 * 1000.0;
//        console.log(dd);
        return Math.round(dd);
    };

    am.put = function(a,b){
         var unsafeWindow=this.unsafeWindow||window;
         unsafeWindow.localStorage.setItem('WPOSM3005_'+a,b);
     };

    am.get = function(a){
        var unsafeWindow=this.unsafeWindow||window;
        return unsafeWindow.localStorage.getItem('WPOSM3005_'+a);
    };

    am.getb = function(a) {
        var x = am.get(a);
        if (x === null)
            return true;
        return (  (x == "false")  ?  false  :  true  );
    };

    am.toggle = function (id,text,restore) {
	var el = id+"_element";
	var element = document.getElementById(el);
	var controller = document.getElementById(id);
	var state = element.style.display;
	if (restore==true) {
	    state = am.get(el);
	    if (state == "block") {
		element.style.display = "block";
		controller.innerHTML = "hide "+text;
	    } else {
		element.style.display = "none";
		controller.innerHTML = "show "+text;
	    }
	} else {
	    if (state == "block") {
		element.style.display = "none";
		controller.innerHTML = "show "+text;
	    } else {
		element.style.display = "block";
		controller.innerHTML = "hide "+text;
	    }
	}
	am.put(el,element.style.display);
	return false;
    };
    
	return wposmObj;
}());
$(wposm.init);
