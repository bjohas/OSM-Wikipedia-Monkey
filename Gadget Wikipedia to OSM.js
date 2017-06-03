// * First version written for tampermonkey here: https://github.com/bjohas/OSM-Wikipedia-Monkey
// * The organisation of the code below is based on [[en:MediaWiki:Gadget-metadata.js]]
// * To learn more about this script, visit https://www.mediawiki.org/wiki/User:Bjohas/OSMgadget
window.wposm = (function () {
    var wposmObj = {
        props: {
	    flowControl: 0,
	    addBasicsResult: "",
	    // number of api results
	    results: -1,
	    results_op: -1,
	    results_owl: -1,
	    results_op_2: -1,
	    // data retrieved from api queries
	    data_op: "",
	    data_owl: "",
	    data_op_2: "",
	    // wikipedia page title
	    title: "",
	    // wikipedia page language
	    lang: "",
	    // wikipedia page id = lang:title
	    wikipedia: "",
	    // coordinates obtained from wikipedia page
	    wikipedia_coord: [0,0],
	    has_wikipedia_coords: false,
	    // wikidata id
	    wikidata: "",
	    // coordinates obtained from wikidata
	    wikidata_coord: [0,0],
	    has_wikidata_coords: false,
	    // overpass API URIs - primary
	    overpassapi: "https://overpass-api.de/api",
	    // overpass API URIs - secondary
	    overpassapi2: "https://api.openstreetmap.fr/oapi",
	    // html elements saved for reference
	    overpassmapurl: "https://overpass-turbo.eu/map.html?Q=",
	    doc: [],
	    // default settings (adjusted through options menu)
	    defaults: {
		"mapheight": "400",
		"mapshow": "", //TODO: needs implementing
		"search_owl": "always", // values: false: never run; true: run if needed; always: always run
		"search3": "false", // Values: false: never; true: run in sequence, if needed; asap: run after 1st overpassquery, not after osm.wikidata.link
		"search3_radius": "1000",
		"search3_category": "historic=archaeological_site",
		"extra_josm_tags": "",
		"use_secondary_api": "false",
		"load_and_zoom": "false"
	    },
	    // timeout for JOSM links in ms.
	    linktimeout: 1000,
	    attachToSiteNotice: false
	},
        methods: {}
    },

	//TODO:	if (ap.defaults.load_and_zoom === 'true') - should also add a zoom for add_node (add separate link, or in one?)
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
        	am.initialiseDefault("use_secondary_api");
	am.initialiseDefault("mapheight");
	am.initialiseDefault("search_owl");
	am.initialiseDefault("search3");
	am.initialiseDefault("search3_radius");
	am.initialiseDefault("search3_category");
	am.initialiseDefault("extra_josm_tags");
	am.initialiseDefault("load_and_zoom");
        am.configureMenu();
        if (am.getb('active')) {
	    am.configureOptions();
            ap.addBasicsResult = am.addBasics(); //checks for types visible from article page
	    am.flowControl("overpass",ap.addBasicsResult);
        } else {
        }
    };

    // Unfinished:
    // control is returned here after each async query to execute the next stage (if needed)
    am.flowControl = function(stage,obj) {
	ap.flowControl++;
	console.log("flowControl: "+ap.flowControl+", stage="+stage);
	switch (ap.flowControl) {
	case 1:
	    break;
	case 2:
	    break;
	case 3:
	    break;
	}

	switch (stage) {
	case "overpass":	    
            if (obj) {
		// obj = ap.addBasicsResult = {"link": link, "OSMExtension": OSMExtension, "coord":coord, "hascoords":hascoords, "wikidata" : wd,"coordissues":coordissues};
                console.log("getOSMData");
                am.getOSMData(obj);
            }
	    break;
	case "overpass_done":
	    // First query (overpass) returns control here
	    if ((ap.defaults.search_owl === 'always' || (ap.defaults.search_owl === 'true' && ap.results_op === 0))) {
		if (obj.wikidata) {
		    console.log("osm.wikipedia.link");
		    am.flowControl("osm.wikidata.link",obj);
		    if (ap.defaults.search3 === 'asap' || ap.defaults.search3 === 'always-asap')
			am.flowControl("op_2",obj);
		} else {
		    console.log("Cannot run owl query without wikidata item.");
		    am.flowControl("op_2",obj);
		}
	    } else {
		am.flowControl("op_2",obj);
	    }
	    break;
	case "osm.wikidata.link":
	    // When this is called (manually or automatically), the search should run, as long as it hasn't run before
	    if (ap.results_owl == -1) {
		ap.results_owl = 0;
		am.getLinkData(obj);
	    } else {
		console.log("owl has already run. Won't run a 2nd time.");
	    }
	    break;
	case "osm.wikidata.link_done":
	    if ((ap.defaults.search3 === 'always' || ap.defaults.search3 === 'always-asap' || (ap.defaults.search3 === 'true' && ap.results_owl === 0))) {
		am.flowControl("op_2",obj);
	    }
	    break;
	case "op_2":
	    // When this is called (manually or automatically), the search should run, as long as it hasn't run before
	    if (ap.results_op_2 == -1) {
		ap.results_op_2 = 0;
		// Second query (osm.wikidata.link) returns control here
		// However, also can be called alone.
		if (ap.results === 0 || true) { // || other_conditions ) {
		    var arr2 = [];
		    // alert(ap.defaults.search3_category);
		    arr2 = ap.defaults.search3_category.split("|");
		    // console.log(arr2);
		    if (ap.data_owl)
			if (ap.data_owl.search)
			    if (ap.data_owl.search.criteria) {
				var arr = ap.data_owl.search.criteria;
				if (arr.length > 0) {
				    arr.forEach( function(str) {
					str = str.replace("Tag:","");
					str = str.replace("Key:","");
					str = str.replace("=","\"=\"");
					str = "\""+str+"\"";
					arr2.push(str);
				    } );
				}
			    }
		    // ap.search3_category = arr2;
		    if (ap.defaults.search3 === 'true')
			am.queryThree(obj,arr2);
		    else
			console.log("op_2 disabled");
		}
	    } else {
		console.log("op_2 has already run. Won't run a 2nd time.");
	    }
	    break;
	}
    };

    // Unfinished:
    // main links setting - rewrites text and target
    am.mainLinkControl = function(target) {
	switch (target) {
	case "wikipedia_coord":
	    break;
	case "OSMobject":
	    break;
	case "wikidata_coord":
	    break;
	}
    };

    am.configureMenu = function() {
        var attachdiv;
        var attachinmenu;
	var attachhere;
	var referenceNode;
	// Insert new elements
        attachdiv = document.createElement("div");
        attachdiv.setAttribute('style', 'border: solid 1px blue; padding: 5px; text-align: left;');
        attachdiv.id = "WikipediaOSM3005";	
	attachdiv.className = "mw-body-content";
	//attachdiv.className = "mw-content-ltr";
	if (ap.attachToSiteNotice) {
	    attachhere = document.getElementById('siteNotice');
	    attachhere.appendChild(attachdiv);
	} else {
	    referenceNode = document.getElementById('firstHeading');
	    // referenceNode = document.getElementById('bodyContent');
	}
	// Set up main area
        if (am.getb('active')) {
	    if (ap.attachToSiteNotice) {
		attachhere.appendChild(attachdiv)
	    } else {
		referenceNode.parentNode.insertBefore(attachdiv, referenceNode.nextSibling);
		//var hreferenceNode = document.getElementById('firstHeading');
		// hreferenceNode.appendChild(am.ahref("jumper","jump to content","jump to content","javascript:document.getElementById('mw-content-text').scrollIntoView();",0,"font-size: 10%;"));
	    }
	    // Controls
            var basics = document.createElement("div");
	    basics.id = "WikipediaOSM3005_basics";
            attachdiv.appendChild(basics);	   
	    // Results
	    var results = document.createElement("div");
	    results.id = "WikipediaOSM3005_results_element";
	    results.setAttribute('style', 'border: solid 1px green; padding: 5px; text-align: left; display: none;');
            attachdiv.appendChild(results);	   
	    // Map
	    var mapdiv = document.createElement("div");
	    mapdiv.style = "display: none; position: relative;";
	    mapdiv.id = "WikipediaOSM3005_map_element";
	    // Map iframe
	    var mapframe = document.createElement("iframe");
	    mapframe.id = "WikipediaOSM3005_map_element_map";
	    mapframe.style = "position: relative;  top: 0;  left: 0; width: 100%; ";
	    mapframe.width = document.getElementById("WikipediaOSM3005").offsetWidth-15; // should read the width of the inner div really...
	    if (am.get('mapheight')) {
		mapframe.height = parseInt(am.get('mapheight'));
	    } else {
		mapframe.height = parseInt(ap.default_mapheight);
	    }
	    mapdiv.appendChild(mapframe);
	    // Notification for map loading
	    var div = document.createElement("div");
	    var span = document.createElement("span");
	    // span.style = "background-color: yellow; text-decoration: italic;";
	    span.innerHTML = "Map will load automatically if queries return suitable data.";
	    span.id = "WikipediaOSM3005_map_span";
	    span.style = "position: absolute;  top: 0;  left: 0; padding: 30px;";
	    div.appendChild(span);
	    mapdiv.appendChild(div);
	    attachdiv.appendChild(mapdiv);
	    // Options
	    var options = document.createElement("div");
	    options.id = "WikipediaOSM3005_options_element";
	    options.setAttribute('style', 'border: solid 1px green; padding: 5px; text-align: left; display: none;');
	    attachdiv.appendChild(options);
	    ap.doc.options = options;
	};
	// Set up switch - try to attach to menu
        var attachheremenu = document.getElementById('p-tb');
	var attachdivmenu;
        if (!attachheremenu) {
            if (!am.getb('active')) {
		if (ap.attachToSiteNotice) 
		    attachhere.appendChild(attachdiv)
		else
		    referenceNode.parentNode.insertBefore(attachdiv, referenceNode.nextSibling);
		// referenceNode.parentNode.insertBefore(attachdiv, referenceNode.nextSibling);
		// attachhere.appendChild(attachdiv);
	    };
	    attachdivmenu = document.createElement("div");
	    attachdiv.appendChild(attachdivmenu);
            attachinmenu = false;
        } else {
            attachinmenu = true;
            var ul = attachheremenu.getElementsByTagName('ul')[0];
            attachdivmenu = document.createElement("li");
	    ul.appendChild(attachdivmenu);
        }
        attachdivmenu.id = "WikipediaOSM3005_menu";
        var input = document.createElement("input");
        input.type = "checkbox";
        input.id = "checkbox";
        input.checked = am.getb('active');
        input.onclick = function() { console.log(this.checked); am.put('active', this.checked); location.reload();} ;
        attachdivmenu.appendChild(input);
        attachdivmenu.appendChild(am.ahref("WikipediaOSM3005_menu_onoff","OSMgadget","Check/uncheck button to enable/disable. (Reloads page.) Click link for help.","https://www.mediawiki.org/wiki/User:Bjohas/OSMgadget"));
    };

    am.configureOptions = function() {
	am.addHTML(ap.doc.options,"<b>Options</b>");
	am.addText(ap.doc.options,"",1);
	am.addHTML(ap.doc.options,"<i>These options are expermental. They are saved in the browser, not your wkipedia account. Clicking outside the field saves the value. You'll need to reload the page for them to take effect. Options are strings and not validated - make sure you spell them right.</i><br>");
	// Extra tagging
	am.addHTML(ap.doc.options,"<b>Secondary API.</b> Should secondary api be used? Less timeouts, but data not always up to date. If you are mass tagging a lot of objects that have not been recently tagged, use '<b>true</b>'. If you are checking recently tagged objects, used '<b>false</b>'. Enter <b>true</b>/<b>false</b>.",1);	
	am.newInput(ap.doc.options,"use_secondary_api");
	// Map height
	am.addHTML(ap.doc.options,"<b>Height of map</b>",1);	
	am.newInput(ap.doc.options,"mapheight");
	// 3rd query
	am.addHTML(ap.doc.options,"<b>SECOND QUERY (osm.wikidata.link).</b> Run a osm.wikidata.link query to look for matches. Enter: <b>false</b>: never; <b>true</b>: run after 1st overpass query if needed; <b>always</b>: run always.",1);	
	am.newInput(ap.doc.options,"search_owl");
	// 3rd query
	am.addHTML(ap.doc.options,"<b>THIRD QUERY.</b> Run a 2nd overpass query to look for nearby objects. Enter: <b>false</b>: never; <b>true</b>: run after osm.wikidata.link (if needed); <b>asap</b>: run after 1st overpassquery, not after osm.wikidata.link; <b>always</b>: run even if there are no results; <b>always-asap</b>: combine both.",1);	
	am.newInput(ap.doc.options,"search_owl");
	// Radius
	am.addHTML(ap.doc.options,"<b>THIRD QUERY.</b> Radius for 3rd query in metres. (If you set this too large, your query may time out, especially in mode 'asap'. Recommended max 5000m.)",1);	
	am.newInput(ap.doc.options,"search3_radius");
	// Query terms
	am.addHTML(ap.doc.options,"<b>THIRD QUERY.</b> Extra query terms (for 3rd query), separate with '|'. (If you leave this empty, your query may time out, especially in mode 'asap'.)",1);	
	am.newInput(ap.doc.options,"search3_category");
	// Extra tagging
	am.addHTML(ap.doc.options,"<b>JOSM:</b> Tags to add when adding tags with JOSM, separate with '|'",1);	
	am.newInput(ap.doc.options,"extra_josm_tags");
	// Use load_and_zoom instead of load_object
	am.addHTML(ap.doc.options,"<b>JOSM:</b> When adding tags with JOSM, use load_and_zoom instead of load_object (where possible).",1);	
	am.newInput(ap.doc.options,"load_and_zoom");
	// Gadget on/off
	am.addText(ap.doc.options,"Use the menu item in left-hand menu to turn gadget on/off.",1);
	// save and close
	var mystyle = "border: 1px solid purple; background-color: lightgrey; margin-left: 3px; padding-left: 3px; padding-right: 3px;";
	am.addText(ap.doc.options," [",0,"display: none;");
        ap.doc.options.appendChild(am.ahref("WikipediaOSM3005_options_2"," save and close ","Save and close.","javascript:",0,mystyle));
	am.addText(ap.doc.options,"] ",0,"display: none;");
	var options_control = document.getElementById("WikipediaOSM3005_options_2");
	options_control.onclick = function() { am.toggle("WikipediaOSM3005_options","options"); return false; };
	// am.toggle("WikipediaOSM3005_options","options",true);
	return 1;
    };

    am.newInput = function (attach,id) {
	var input = document.createElement("input");
        input.type = "text";
        input.id = id;
	input.size = 100;
	if (am.get(input.id)) {
	    input.value = am.get(input.id);
	} else {
	    input.value = ap.defaults[id];
	    am.put(input.id,ap.defaults[id]);
	};
	input.onfocus = function () { this.style="background-color: yellow;";  };
	input.onblur = function () { ap.defaults[this.id] = this.value; am.put(this.id,this.value); this.style="background-color: white;"; console.log("assign: "+ap.defaults[this.id]); };
	attach.appendChild(input);
	am.addText(attach,"",1);	
	return 1;
    };
    
    am.initialiseDefault = function (id) {
	if (am.get(id) || am.get(id)=== '' ) {
	    ap.defaults[id] = am.get(id);
	} else {
	    am.put(id,ap.defaults[id]);
	};
	return 1;
    };
    
    am.addBasics = function () {
        // Fetch page title
        var attachdiv = document.getElementById('WikipediaOSM3005_basics');
	if (!ap.attachToSiteNotice) 
	    attachdiv.appendChild(am.ahref("jumper","Wikipedia","jump to article content","javascript:document.getElementById('mw-content-text').scrollIntoView();",0));
	else 
            am.addText(attachdiv,"Wikipedia");
	am.addText(attachdiv,"-OSM: ");	
        var title = document.getElementById('firstHeading').innerHTML;
        var wp = title;
	ap.title = title;
        title = encodeURI(title);
        var lang = window.location.href;
        lang = lang.replace(/\..*/,"").replace(/.*\//,"");
        var coordspan = document.getElementById('coordinates');
        wp = lang+":"+wp;
	ap.lang = lang;
	ap.wikipedia = wp;
        var wd;
        try {
            // Fetch wikidata
            wd = document.getElementById('t-wikibase').getElementsByTagName("a")[0].href;
            wd = wd.replace(/.*\//,"");
            am.addText(attachdiv,""+wd+" ");
        } catch(err) {
            am.addText(attachdiv,"(No wikidata!) ");
        }
	am.addText(attachdiv," (");
	am.addSpan(attachdiv,"results_op","-");
	am.addText(attachdiv,", ");
	am.addSpan(attachdiv,"results_owl","-");
	am.addSpan(attachdiv,"results_op_2","");
	am.addText(attachdiv,") ");
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
	overpassmap = ap.overpassmapurl + querystart + outrel + overpassquery + outskel;
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
                console.log("(coord-method-1a-ok: "+coord2+")");
		coord2 = coord2.replace(/<span class=\"elevation.*/,"");
                coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
                console.log("(coord-method-1a-ok: "+coord2+")");
                coord2 = coord2.replace(/,+/,",");
                coord = coord2.split(",");
                console.log("(coord-method-1a-ok: "+coord2+")");
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
                    console.log("(coord-method-2a-ok:"+coord3+")");
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
	    console.log("Method 2 coords: "+coord3);
            coord_ = coord3.split(",");
        } catch(err) {
            console.log("Unable to retrieve coordinates from wikipage (method 2). "+err);
            am.addText(attachdiv," (coords!)");
        }
	var coordissues = "";
	if (coord2 !== "" && coord3 !== "") {
//	    am.addText(attachdiv,", dual coord: "+coord3,1);
	    if (coord[0] != coord_[0]) {
		coordissues += " <b style=\"background-color: pink;\">(mismatch/WP lat: "+am.distance(parseFloat(coord[0]),parseFloat(coord[1]),parseFloat(coord_[0]),parseFloat(coord_[1])) + "m)</b>";
	    }
	    if (coord[1] != coord_[1]) {
		coordissues += " <b style=\"background-color: pink;\">(mismatch/WP lon: "+am.distance(parseFloat(coord[0]),parseFloat(coord[1]),parseFloat(coord_[0]),parseFloat(coord_[1])) + "m)</b>";
        }
	}
	if (coord2 === "" && coord3 !== "") {
	    coord = coord_;
	}
        try {
            // Create links
	    // The [,] are a workaround for iOS.
	    am.addText(attachdiv," [",0,"display: none;");
	    var mystyle = "border: 1px solid purple; background-color: lightgrey; margin-left: 3px; padding-left: 3px; padding-right: 3px;";
            attachdiv.appendChild(am.ahref("WikipediaOSM3005_results"," No results ","Show/hide results (if any). Setting is remembered.","javascript:",0,mystyle));
	    am.addText(attachdiv,"] [",0,"display: none;");
	    attachdiv.appendChild(am.ahref("WikipediaOSM3005_map"," No map ","Show/hide map (if available). Setting is remembered.","javascript:",0,mystyle));
	    am.addText(attachdiv,"] ",0,"display: none;");
	    // "Show/Hide results"
	    am.toggle("WikipediaOSM3005_results","results",true);
	    var op_results_control = document.getElementById("WikipediaOSM3005_results");
	    op_results_control.onclick = function() { am.toggle(this.id,"results"); return false; };
	    // "Show/Hide map"
	    am.toggle("WikipediaOSM3005_map","map",true);
	    var op_map_control = document.getElementById("WikipediaOSM3005_map");
	    op_map_control.onclick = function() { am.toggle(this.id,"map"); return false; };
	    // OpenStreetMap.org - area
            OSMExtension = "?zoom=18&mlat="+coord[0]+"&mlon="+coord[1];
            link = "http://www.openstreetmap.org/"+OSMExtension;
            attachdiv.appendChild(am.ahref("mylinkidOSM"," (OSM)","View area in OSM",link));
	    // OpenStreetMap.org - iD - edit 
              // link = "http://www.openstreetmap.org/#map=17/"+coord[0]+"/"+coord[1];
              // link = "http://www.openstreetmap.org/edit#map=17/"+coord[0]+"/"+coord[1];
            link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord[0]+"&mlon="+coord[1]; // +"&lang="+lang+"&wikidata="+wd+"&wikipedia="+lang+":"+title;
            attachdiv.appendChild(am.ahref("mylinkidID"," (iD)","Edit area with iD",link));
	    // JOSM - add node
            link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+encodeURIComponent("name="+encodeURIComponent(title)+encodeURI("|source=wikidata,wikipedia|wikidata="+wd+"|wikipedia=")+lang+":"+encodeURIComponent(title)+encodeURIComponent(am.getExtraJosmTags()));
	    var josmspan = document.createElement("span");
	    josmspan.id = "josmspan";
	    josmspan.appendChild(am.ahref("mylinkidJOSM"," (JOSM+node+tags)","Add node with JOSM",link,1));
	    attachdiv.appendChild(josmspan);
	    // Overpass-turbo - map
            link = overpassmap;
            attachdiv.appendChild(am.ahref("mylinkidMAP"," (overpass-map)","View overpass interactive map for wikidata:"+wd,link));
	    // Overpass-api - data
            link = ap.overpassapi + "/interpreter?data="+overpassquery;
            attachdiv.appendChild(am.ahref("mylinkidJSON"," (overpass-json)","View overpass json data for wikidata:"+wd,link));
              // link = "http://localhost:50808/hello?title="+lang+":"+title+"&coord="+coord2+"&geohack="+coord3+"&wikidata="+wd;
              // attachdiv.appendChild(am.ahref("mylinkid"," (local)","You need a local server for this.",link));
	    // Options control
	    am.addText(attachdiv," [",0,"display: none;");
            attachdiv.appendChild(am.ahref("WikipediaOSM3005_options"," show options ","Edit options.","",0,mystyle));
	    am.addText(attachdiv,"] ",0,"display: none;");
	    var options_control = document.getElementById("WikipediaOSM3005_options");
	    options_control.onclick = function() { am.toggle(this.id,"options"); return false; };
	    am.toggle("WikipediaOSM3005_options","options",true);
	    // Help link
            attachdiv.appendChild(am.ahref("reportIssue"," (?)","Report an issue and make suggestions for this Gadget.","https://www.mediawiki.org/wiki/User:Bjohas/OSMgadget"));
	    //if (!ap.attachToSiteNotice) 
	    //attachdiv.appendChild(am.ahref("jumper","(jump to content)","jump to content","javascript:document.getElementById('mw-content-text').scrollIntoView();",0,"font-size: 70%;"));
        } catch(err) {
            am.addText(attachdiv," (error: No links!)");
	    console.log(err);
        }
	var overpassapi = ap.overpassapi;
	if (ap.defaults.use_secondary_api === 'true') 
	    overpassapi = ap.overpassapi2;
	//console.log(overpassapi);
        link = overpassapi + "/interpreter?data="+overpassquery;
//	console.log(link);
        var hascoords = 1;
	ap.has_wikipedia_coords = true;
        if (coord2 === '' && coord3 === '') {
            hascoords = 0;
	    ap.has_wikipedia_coords = false;
	    // No coordinates - disable main OSM/iD/JOSM links. 
	    document.getElementById("mylinkidOSM").innerHTML = "<s>"+document.getElementById("mylinkidOSM").innerHTML+"</s>";
	    document.getElementById("mylinkidID").innerHTML = "<s>"+document.getElementById("mylinkidID").innerHTML+"</s>";
	    document.getElementById("mylinkidJOSM").innerHTML = " <s>(JSON)</s>";
        }
	ap.wikipedia_coord = coord;
	ap.wikidata = wd;
        return {"link": link, "OSMExtension": OSMExtension, "coord":coord, "hascoords":hascoords, "wikidata" : wd,"coordissues":coordissues};
    };

    am.getOSMData = function (obj) {
        var attachdiv = document.getElementById('WikipediaOSM3005_results_element');
	if (!attachdiv) {
	    console.log("attachiv undefined");
	}
	am.addHTML(attachdiv,"<b>Overpass:</b> ");
	var myspan = document.createElement('span');
        myspan.id = "temporary";
	am.addHTML(myspan,"<i style=\"background-color: yellow;\"> ... Fetching data from overpass (should only take a sec) ... </i>");
        attachdiv.appendChild(myspan);
        var link = "";
        if (obj.hascoords==1) {
            am.addText(attachdiv,"Wikipedia_page_coords=(");
            var OSMExtension = "?zoom=18&mlat="+obj.coord[0]+"&mlon="+obj.coord[1];
            link = "http://www.openstreetmap.org/"+OSMExtension;
            attachdiv.appendChild(am.ahref("mylinkidOSM",obj.coord[0]+","+obj.coord[1],"View area in OSM",link));
            am.addText(attachdiv,") ");
	    if (obj.coordissues)
		am.addHTML(attachdiv,obj.coordissues);
            am.addText(attachdiv,"; ",1);
        } else {
            am.addText(attachdiv,"Wikipedia_page_coords not available.",1);
        }
        try {
                                $.ajax({
            url: obj.link,
            async: true,
            dataType: "text",
            success: function(responseText) {
            		    myspan.innerHTML = '';
		    var op = undefined;
		    try {
			op = JSON.parse(responseText);
			ap.data_op = op;
		    } catch(err) {
			console.log("getOSM error in parse: "+err+";"+op);
		    }
		    if (op) {			
			try {
			    am.parseResponse(attachdiv,obj,op.elements);
			    ap.results_op = op.elements.length;
			    document.getElementById("results_op").innerHTML = ap.results_op;
			    if (op.elements.length === 0) {
				am.addHTML(attachdiv," <span style=\"background-color: yellow;\">No OSM object!</span> Check data for osm.wikidata.link below for potential matches.<br>");
				// Remove the above elements, as they won't work:
				document.getElementById("mylinkidJSON").outerHTML = " <s>(overpass-JSON)</s>";
				document.getElementById("mylinkidMAP").outerHTML = " <s>(overpass-map)</s>";
				document.getElementById("WikipediaOSM3005_map_span").innerHTML = "No map available. If possible, the map wll be updated with search results.";
				document.getElementById("WikipediaOSM3005_map").innerHTML = "No map";
			    } else {
				if (obj.hascoords === 0) {
				    // am.addText(attachdiv,"",1);
				    am.addText(attachdiv,"The wikipedia entry has no coordinates, but is linked to an OSM object. (Please do not copy coordinates from OSM to wikipedia/wikidata.)",1);                        
				}
			    }
			} catch(err) {
			    console.log("getOSM data error xmlhttp: "+err);
			    am.addText(attachdiv," Sorry, the overpass request has failed. If you've loaded a lot of pages, you may be over quota - try reloading this page.");
			    attachdiv.appendChild(am.ahref("checkStatus"," You can check your API status here","Check overpass API status.","http://overpass-api.de/api/status"));
			    am.addText(attachdiv,"",1);
			}
		    } else {
			am.addText(attachdiv," Sorry, the overpass request has failed (no data).",1);
		    }
		    am.flowControl("overpass_done",obj);
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
		var mapframe = document.getElementById("WikipediaOSM3005_map_element_map");
		if (!mapframe.src || mapframe.src === '') {
		    document.getElementById("WikipediaOSM3005_map_span").innerHTML = "";
		    mapframe.src = document.getElementById("mylinkidMAP").href;
		};
	    }
	    // Enable map control:
	    var op_map_control = document.getElementById("WikipediaOSM3005_map");
	    op_map_control.onclick = function() {
		var mapframe = document.getElementById("WikipediaOSM3005_map_element_map");
		if (!mapframe.src || mapframe.src === '') {
		    document.getElementById("WikipediaOSM3005_map_span").innerHTML = "";
		    mapframe.src = document.getElementById("mylinkidMAP").href;
		};
		am.toggle(this.id,"map"); return false;
	    };
	} catch (err) {
	    console.log("Error restoring map: "+err);
	}
    };

    am.updatemap = function (href) {
	// console.log("Map url = "+href);
	var mapframe = document.getElementById("WikipediaOSM3005_map_element_map");
	if (!mapframe.src || mapframe.src === '') {
	    mapframe.src = href;
	    document.getElementById("WikipediaOSM3005_map_span").innerHTML = "";
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
	am.addHTML(myspan,"<i style=\"background-color: yellow;\"> ... Retrieving additional matches from osm.wikipedia.link (please be patient) ... </i>");
        myspan.id = "temporary";
        attachdiv.appendChild(myspan);
        am.addText(attachdiv,"",1);
        try {
                                          $.ajax({
		      url: apiurl,
		      async: true,
		      dataType: "text",
		      success: function(responseText) {
		                          myspan.innerHTML = '';
		    try {
			var op = JSON.parse(responseText);
			ap.data_owl = op;
		    } catch(err) {
			am.addText(attachdiv,"Sorry, the query has failed (error in parse).");
			console.log("Parse error xmlhttp: "+err+ "JSON: "+responseText);
		    }	
		    if (op) {
			if (op.error) {
			    am.addHTML(attachdiv,"<span style=\"background-color: yellow;\">No results.</span> ");
                            am.addText(attachdiv,"The query returned no results, with error message: '"+op.error+"'. ",1);
                            if (op.error === "no coordinates") {
				if (ap.has_wikipedia_coords) {
				    am.addText(attachdiv,"RECOMMENDATION: Use wikipedia coordinates to add coordinates to the wikidata item.");
				} else {
				    am.addText(attachdiv,"RECOMMENDATION: If this article should be georeferenced, find and add coordinates to the wikidata item.");
				}
				if (ap.results_op == 0) {
				    document.getElementById("mylinkidOSM").outerHTML = "<s>"+document.getElementById("mylinkidOSM").innerHTML+"</s>";
				    document.getElementById("mylinkidID").outerHTML = "<s>"+document.getElementById("mylinkidID").innerHTML+"</s>";
				    if (!ap.has_wikipedia_coords)
					document.getElementById("mylinkidJOSM").outerHTML = " <s>(JOSM)</s>";
				};
                            }
			} else {
			    am.parseResponse2(attachdiv,obj,op);
			    if (op.response == 'ok') {
				if (ap.results_owl === 0) {
				    am.addHTML(attachdiv,"<span style=\"background-color: yellow;\">No results.</span> ");
				    am.addText(attachdiv,"The query did not find any results (no errors). ",1);
				}
			    } else {
				am.addHTML(attachdiv,"<span style=\"background-color: yellow;\">No results.</span> ");
				am.addHText(attachdiv," The query returned no results</span>, with message: "+op.response+". ",1);
			    }
			    am.addText(attachdiv,"QSM query parameters: "+JSON.stringify(op.search).replace(/","/g,'", "'));
			}
		    }
		    //console.log("ap.results="+ap.results);
		    am.flowControl("osm.wikidata.link_done",obj);
		}
	    });
        } catch (err) {
            am.addText(attachdiv,"Sorry, the query has failed (error in response).");
            am.addText(attachdiv,"API did not respond.");
            console.log("API error xmlhttp: "+err);
        }
        return 1;
    };

    //TODO: Indicate a WP-tag match (as for query 1)
    am.queryThree = function (obj,tags) {
	if (ap.defaults.search3 !== 'true') {
	    console.log("am.queryThree: "+ap.defaults.search3);
	    return 0;
	}
	console.log("query3");
	// console.log(obj);
	if (!ap.has_wikidata_coords && !ap.has_wikipedia_coords) {
	    console.log("am.queryThree: "+ap.has_wikidata_coords+" "+ap.has_wikipedia_coords);
	    return 0;
	}
	var objcoord = [0,0];
	//	if (obj.hascoords == 1) {
	if (ap.has_wikipedia_coords) {
	    objcoord =  ap.wikipedia_coord;
	}  else	if (ap.has_wikidata_coords) {
	    objcoord =  ap.wikidata_coord;
	} else {
	    console.log("Error in selecting coords for query three. We should not get here...");
	}
	// Set radius:
	// var around = "(around:"+ap.search3_radius+","+obj.coord[0]+","+obj.coord[1]+")[historic]"
	var around = "(around:"+parseInt(ap.defaults.search3_radius)+","+objcoord[0]+","+objcoord[1]+")";
	//set categories:
	var objects = ["node","way","relation"];
	var overpassquery = "";
	objects.forEach( function(object) {
	    if (tags.length > 0) 
		tags.forEach( function(tag) {
		    if (tag !== '')
			overpassquery += object+around+"["+tag+"]; ";
		    else
			overpassquery += object+around+"; ";
		} );
	    else
		overpassquery += object+around+"; ";
	});
	//console.log("query3="+overpassquery);
	var querystart = encodeURIComponent("[out:json][timeout:25];");
	var outrel = "";
	// var overpassquery = encodeURIComponent("(node"+around+"; way"+around+"; relation"+around+";); out meta qt; ");
	var overpassquery = encodeURIComponent("("+overpassquery+"); out meta qt; ");
        var outskel = encodeURIComponent(" >; out meta qt; "+
					 "{{style:\nnode {color: blue;}\nway { color: green;}\nrelation {color:pink; fill-opacity: 0;} }}");
	var overpassmap = querystart + outrel + overpassquery + outskel;
	overpassmap = ap.overpassmapurl + querystart + outrel + overpassquery + outskel;
	// console.log("HERE: "+overpassmap);
	overpassquery = querystart + overpassquery;
	// var overpassapi = "https://api.openstreetmap.fr/oapi";
	var overpassapi = ap.overpassapi;
	if (ap.defaults.use_secondary_api === 'true')
	    overpassapi = ap.overpassapi2;
        var oplink = overpassapi + "/interpreter?data="+overpassquery;
	var attachdiv = document.getElementById('WikipediaOSM3005_results_element');
	if (!attachdiv) {
	    console.log("attachiv undefined");
	}
	am.addText(attachdiv,"",1);
	am.addHTML(attachdiv,"<b>Nearby (uses radius/tags):</b> Unlike the first two queries, these show nearby objects that maybe related. For matching they have very low confidence, and are for information only. Only add the wikidata id after careful inspection using an OSM editor. Criteria: ");
	am.addText(attachdiv,around);
	am.addText(attachdiv,"; categories: ");
	am.addText(attachdiv,ap.defaults.search3_category);
	am.addText(attachdiv,"; you can adjust radius/categories in options.",1);
	var myspan = document.createElement('span');
        //var mytext = document.createTextNode(" ... Fetching data from overpass (should only take a sec) ... ");
        myspan.id = "temporary";
	am.addHTML(myspan,"<i style=\"background-color: yellow;\"> ... Fetching data from overpass (should only take a sec) ... </i>");
        //myspan.appendChild(mytext);
        attachdiv.appendChild(myspan);
	var link = "";
	var wikidataobject ="";
        if (obj.hascoords==1) {
	    wikidataobject = {"compare":obj.hascoords,"lat":obj.coord[0],"lon":obj.coord[1],"wikidata":obj.wikidata};
        }
	// console.log(oplink);
        try {
                                          $.ajax({
		      url: oplink,
		      async: true,
		      dataType: "text",
		      success: function(responseText) {
		                          myspan.innerHTML = '';
		    try {
			var op = JSON.parse(responseText);
			ap.data_op_2 = op;
		    } catch (err) {
			console.log("Error in 3rd query: "+err);
			console.log(responseText);
		    }
		    if (op) {			
			//TODO: Should be ordered by distance really... and should fetch nodes in query, so distance can be calculated.
			// Or at least put matches <300m in green.
			ap.results_op_2 = op.elements.length;
			document.getElementById("results_op_2").innerHTML = ", "+ap.results_op_2;
			// If there were results in query3, display them on the map (only if the map is still blank)
			if (op.elements.length > 0)
			    am.updatemap(overpassmap);
			var out = am.displayResults(op.elements,wikidataobject,"Nearby");
			attachdiv.appendChild(out.ol);
			if (op.elements.length === 0) {
			    am.addHTML(attachdiv," <span style=\"background-color: yellow;\">No OSM object! We're out of options for existing objects.</span>Go ahead and add a new one!<br>");
			} else {
			    if (obj.hascoords === 0) {
				am.addText(attachdiv,"",1);
				am.addText(attachdiv,"The wikipedia/wikidata entry has no coordinates, but is linked to an OSM object. Please do not copy coordinates from OSM to wikipedia/wikidata.",1);                        
			    }
			}
		    } else {
			am.addText(attachdiv," Sorry, the overpass request has failed (no data).",1);
		    }
		}
	    });
        } catch (err) {
            am.addText(attachdiv,"Sorry, the 3rd query has failed (error in response).");
            am.addText(attachdiv,"API did not respond.");
            console.log("API error (3rd query) xmlhttp: "+err);
        }
    };

    am.parseResponse = function (attachdiv, obj, opelements) {
        var ol = document.createElement("ol");
	if (opelements.length>0) {
	    //  results have come in, so map can be launched.
	    am.launchmap();
	    ap.results = opelements.length;
	}
        for (var j = 0; j < opelements.length; j++){
            var li = document.createElement("li");
            var matchno = j+1;
            var id = opelements[j].id;
            var type = opelements[j].type;
	    li.id = type + id;
            var haswp = "";
            if (opelements[j].tags.wikipedia) {
                haswp = "WP";
            }
            var haswd ="";
            if (opelements[j].tags.wikidata) {
                haswd = "WD";
            }
            link = "http://www.openstreetmap.org/"+type+"/"+id;
            var linkID = "http://www.openstreetmap.org/edit?"+type+"="+id;
            // For the first result, amend the earlier links:
            if (j===0) {
                document.getElementById('mylinkidOSM').href = link + obj.OSMExtension;
                // document.getElementById('mylinkidOSM').text = " (OSM/"+type+id+")";
                document.getElementById('mylinkidOSM').text = " (OSM*)";
		document.getElementById('mylinkidOSM').target = "_new";
                document.getElementById('mylinkidOSM').title = "View object on OSM.org.";
                document.getElementById('mylinkidID').href = linkID;
                document.getElementById('mylinkidID').text = " (iD*)";
		document.getElementById('mylinkidID').target = "_new";
                document.getElementById('mylinkidID').title = "Edit object with iD.";
            } 
            am.addHTML(li," <i style=\"background-color: lightgreen;\">"+haswp+haswd+".</i> ");
	    var josmcommand = "http://127.0.0.1:8111/load_object?objects=";
	    if (ap.defaults.load_and_zoom === 'true' && obj.hascoords) {
		// load_and_zoom - load area
		var factor = 0.005;
		var left = parseFloat(obj.coord[1]) - factor;
		var right = parseFloat(obj.coord[1]) + factor;
		var bottom = parseFloat(obj.coord[0]) - factor;
		var top = parseFloat(obj.coord[0]) + factor;
		var pos = "right="+right+"&left="+left+"&top="+top+"&bottom="+bottom;		
		josmcommand = "http://127.0.0.1:8111/load_and_zoom?"+pos+"&select=";
	    }
            var link = josmcommand+type+id+"&new_layer=false";
            if (j===0) {
		/*
                document.getElementById('mylinkidJOSM').href = link ;
                document.getElementById('mylinkidJOSM').text = " (JOSM*)" ;
		document.getElementById('mylinkidJOSM').target = "_new";
                document.getElementById('mylinkidJOSM').title = "Load object with JOSM." ;
		*/
		var mylinkidJOSM = document.getElementById('mylinkidJOSM');
		mylinkidJOSM.outerHTML = "";
		//var parent = mylinkidJOSM.parentNode;
		var parent = document.getElementById('josmspan');
		var newobject =  am.ahref("mylinkidJOSM"," (JOSM*)","Load object with JOSM (same layer).",link,1);
		try {
		    parent.appendChild(newobject);
		} catch (err) {
		    console.log("link replace "+err);
		}		
            }
            li.appendChild(am.formatosm(opelements[j],{"compare": obj.hascoords, "wikidata": obj.wikidata,
							"lat":obj.coord[0],"lon":obj.coord[1]}));
            ol.appendChild(li);
        }
	attachdiv.appendChild(ol);
	return 1;
    };

    am.parseResponse2 = function(attachdiv,obj,op) {
	try {
            var wdlat = 0;
            var wdlon = 0;
            var wdhasll = 0;
            if (op.wikidata.lat) {
		ap.wikidata_coord = [op.wikidata.lat,op.wikidata.lon];
		ap.has_wikidata_coords = true;
		am.addText(attachdiv,"Wikidata_coords=(");
		var OSMExtension = "?zoom=18&mlat="+op.wikidata.lat+"&mlon="+op.wikidata.lon;
		var link = "http://www.openstreetmap.org/"+OSMExtension;
		attachdiv.appendChild(am.ahref("mylinkidOSM",op.wikidata.lat+","+op.wikidata.lon,"View area in OSM",link));
		am.addText(attachdiv,"); ");
		wdlat = op.wikidata.lat;
		wdlon = op.wikidata.lon;
		wdhasll = 1;
		var wikidataobject = {"compare":wdhasll,"lat":wdlat,"lon":wdlon,"wikidata":obj.wikidata};
		if (!ap.has_wikipedia_coords) {
		    am.addHTML(attachdiv," <i>(Consider adding the wikidata coordinates also to the wikipedia page.)</i> ");
		}
		// Add JOSM link to add node at WD coords
		link = "http://127.0.0.1:8111/add_node?lat="+ap.wikidata_coord[0]+"&lon="+ap.wikidata_coord[1]+"&addtags="+encodeURIComponent("name="+encodeURIComponent(ap.title)+encodeURI("|source=wikidata,wikipedia|wikidata="+ap.wikidata+"|wikipedia=")+ap.lang+":"+encodeURIComponent(ap.title)+encodeURIComponent(am.getExtraJosmTags()));
		//console.log(link);
		attachdiv.appendChild(am.ahref("mylinkidJOSMwd"," (JOSM@WD+node+tags)","Add node with JOSM",link,1));		    
		if (!ap.has_wikipedia_coords) {
		    if (ap.results_op == 0) {
			// There are no wikipedia coords, but there are wikidata coords - rewrite the above links
			var coord0 = ap.wikidata_coord[0];
			var coord1 = ap.wikidata_coord[1];		    
			// OpenStreetMap.org - area
			var OSMExtension = "?zoom=18&mlat="+coord0+"&mlon="+coord1;
			link = "http://www.openstreetmap.org/"+OSMExtension;
			document.getElementById("mylinkidOSM").href = link;
			document.getElementById("mylinkidOSM").innerHTML = " (OSM@WD)";
			// OpenStreetMap.org - iD - edit 
			link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord0+"&mlon="+coord1; // +"&lang="+lang+"&wikidata="+wd+"&wikipedia="+lang+":"+title;
			document.getElementById("mylinkidID").href = link;
			document.getElementById("mylinkidID").innerHTML = " (iD@WD)";
			// JOSM
			link = "http://127.0.0.1:8111/add_node?lat="+ap.wikidata_coord[0]+"&lon="+ap.wikidata_coord[1]+"&addtags="+encodeURIComponent("name="+encodeURIComponent(ap.title)+encodeURI("|source=wikidata,wikipedia|wikidata="+ap.wikidata+"|wikipedia=")+ap.lang+":"+encodeURIComponent(ap.title)+encodeURIComponent(am.getExtraJosmTags()));
			document.getElementById("mylinkidJOSM").href = link;
			document.getElementById("mylinkidJOSM").innerHTML = " (JOSM@WD+node+tags)";
		    }
		}
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
		// probably won't get here, because op.error is usesd above.
		am.addText(attachdiv,"Wikidata_coords not available.",1);
            }
	    ap.results_owl = op.osm.length;
	    document.getElementById("results_owl").innerHTML = ap.results_owl;
            if (op.found_matches) {
		ap.results += op.osm.length;
		var out = am.displayResults(op.osm,wikidataobject,"Matcher");
		attachdiv.appendChild(out.ol);
		if (op.osm.length > 0) {
                    var overpassquery = encodeURIComponent("[out:json][timeout:25];\n"+
							   "("+out.querystr+out.querystrRel+");\nout meta; >; out skel qt; "+
							   "("+out.querystrRel+");\nout bb;\n"+
							   "{{style: node, way, relation { text: name; }\nnode {color: blue;}\nway { color: green;}\nrelation {color:pink; fill-opacity: 0;} }}");
                    link = ap.overpassmapurl+overpassquery;
		    // If there were results in query 2 via owl, display them on the map (only if the map is still blank)
		    am.updatemap(link);
                    attachdiv.appendChild(am.ahref("myresultsMAPall","(overpass-map with all results)","View overpass interactive map for all results. (Note: If you cannot see all results on the map, it may be that objects over overlapping.)",link));
                    link = "https://overpass-turbo.eu/?Q="+overpassquery;
                    attachdiv.appendChild(am.ahref("myresultsOPQall","(overpass-turbo query) ","View overpass ide for all results,link)",link));
                    // am.addText(attachdiv," (Note: If you cannot see all results on the map, it may be that objects over overlapping.)",1);
		}
		am.addText(attachdiv,"",1);
		am.addText(attachdiv,"There are "+out.existing+" OSM objects that are already linked to this wikidata item. There are "+out.nonexisting+" potential matches.",1);
		document.getElementById("results_owl").innerHTML = out.existing+"+"+out.nonexisting;
		am.addText(attachdiv," RECOMMENDATION: ");
		if (out.existing === 0) {
                    am.addText(attachdiv," Given that there is no wikidata connection yet, ");
                    link = "https://osm.wikidata.link/search?q="+obj.wikidata;
                    attachdiv.appendChild(am.ahref("mylinkOSMWIKIDATA"," click here to use osm.wikidata.link to make one.","Use osm.wikidata.link to make connection from WD to OSM.",link));
                    am.addText(attachdiv," Alternatively you can use the iD/JOSM links above. ");
		} else if (out.existing === 1) {
                    am.addText(attachdiv," Given that there is exactly one connection, it may well be ok. Use the above links to check. ");
		} else {
                    am.addText(attachdiv," Given that there is more than one connection, you may want to use the above links to check tagging. ");
		}
		am.addText(attachdiv,"",1);
            }
	} catch (err) {
	    console.log("Error in Response2: "+err);
	}
    };

    am.displayResults = function (oposm,wikidataobject,idstring) {
    	var existing = 0;
	var nonexisting = 0;
	var querystr = "";
	var querystrRel = "";
	var ol = document.createElement("ol");
	var li = "";
	for (var j = 0; j < oposm.length; j++){
            if (oposm[j].type == "relation") {
		querystrRel = querystrRel + oposm[j].type + "(" + oposm[j].id + ");\n";
            } else {
		querystr = querystr + oposm[j].type + "(" + oposm[j].id + ");\n";
            }
	    var liid = oposm[j].type + oposm[j].id;
	    var duplicate = false;
	    if (document.getElementById(liid)) {
		li = document.getElementById(liid);
		am.addText(li,"",1);
		am.addHTML(li,"<b>"+idstring+" (existing):</b> ");
		duplicate = true;
		// console.log("Entry exists.");
	    } else {
		li = document.createElement("li");				   
		li.id = oposm[j].type + oposm[j].id;
		am.addHTML(li,"<b>"+idstring+" (new):</b> ");
		// console.log("Entry does not exist.");
	    };
            li.appendChild(am.formatosm(oposm[j],wikidataobject));
	    if (!duplicate) 
		ol.appendChild(li);
            if (oposm[j].existing) {
		existing++;
            } else {
		nonexisting++;
            }
	}
	return {"existing":existing, "nonexisting":nonexisting, "ol":ol ,"querystrRel":querystrRel,"querystr":querystr};
    };

    
    am.getExtraJosmTags = function() {
	if (ap.defaults.extra_josm_tags === '') {
	    return "";
	} else {
	    return "|"+ap.defaults.extra_josm_tags;
	}
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
        element.appendChild(am.ahref("mylinkidOSMx"," (OSM*)","View object on OSM",link));
        link = "http://www.openstreetmap.org/edit?"+type+"="+id;
        element.appendChild(am.ahref("mylinkidOSMx"," (iD*)","Edit object in iD",link));
        link = "http://127.0.0.1:8111/load_object?objects="+type+id+"&new_layer=false";
	am.addText(element,"(");
        element.appendChild(am.ahref("mylinkidJOSMx","JOSM*,","Load object with JOSM (same layer)",link,1));
	// Determine coordinates
	var coordtext = "(";
        var distance = 0;
        var lat = "";
        var lon = "";
        if (osm.center) {
            coordtext = coordtext + "C: ";
            lat = osm.center.lat;
            lon = osm.center.lon;
        } else if (osm.lat) {
            lat = osm.lat;
            lon = osm.lon;
        }
        if (lat !== "") {
            coordtext = coordtext +lat+","+lon;
        }
        if (osm.existing) {
            coordtext = coordtext + "; "+osm.existing;
        }
        coordtext += ")";
	// Add JOSM link to add WD/WP tags
	var josmcommand = "http://127.0.0.1:8111/load_object?objects=";
	if (ap.defaults.load_and_zoom === 'true' && (lat !== "" || extra.lat)) {
	    var mylon = "";
	    var mylat = "";
	    // Use coords from extra, as these are guaranteed to exist (at present, we don't calculate coords for ways/rels)
	    if (lat === "") {
		mylon = parseFloat(extra.lon);
		mylat = parseFloat(extra.lat);
	    } else {
		mylon = lon;
		mylat = lat;
	    }
	    // load_and_zoom - load area
	    var factor = 0.005;
	    var left = parseFloat(mylon) - factor;
	    var right = parseFloat(mylon) + factor;
	    var bottom = parseFloat(mylat) - factor;
	    var top = parseFloat(mylat) + factor;
	    var pos = "right="+right+"&left="+left+"&top="+top+"&bottom="+bottom;		
	    josmcommand = "http://127.0.0.1:8111/load_and_zoom?"+pos+"&select=";
	    // console.log(josmcommand);
	}
        link = josmcommand+type+id+"&new_layer=false";
        link += "&addtags=";
	// Check for presence of tags - if no tags are present, add all.
	var linktext = "";
	var linkext = "";
	if (osm.tags) {
	    if (!osm.tags.wikidata) {
		linktext = " +wd";
		linkext = "wikidata="+wikidata;
	    };
	    if (!osm.tags.wikipedia) {
		linktext += "+wp";
		linkext += "|" +  encodeURIComponent("wikipedia="+ap.wikipedia);
	    }
	    if (!osm.tags.name) {
		linktext += "+name";
		linkext += "|" +  encodeURIComponent("name="+ap.title);
	    }
	} else {
	    linktext = " +wd";
	    linkext = "wikidata="+wikidata;
	    linktext += "+wp";
	    linkext += "|" +  encodeURIComponent("wikipedia="+ap.wikipedia);	   
	    linktext += "+name";
	    linkext += "|" +  encodeURIComponent("name="+ap.title);
	}
	// Need to encode again because of javascript launch
	link += encodeURIComponent(encodeURIComponent(linkext));
	// link += linkext;
        element.appendChild(am.ahref("mylinkidJOSMxEdit",linktext,"Add wikidata to with JOSM (same layer)",link,1));
	am.addText(element,")");
	// Show coordinates
        textelement = document.createTextNode(coordtext);
        element.appendChild(textelement);
        if (extra.compare && lat !== "") {
	    text = "";
            if (extra.compare==1) {
                distance = am.distance(lat,lon,parseFloat(extra.lat),parseFloat(extra.lon));
                // text = text +", "+lat+" "+lon+", "+extra.lat+" "+extra.lon+", d=" + distance;
                text = text + ", d=" + distance + "m";
                var maxd = 300;
                if (distance>maxd) {
		    var maxd2 = 1000;
		    if (distance>maxd2)
			text = text + ", <b style=\"background-color: red;\">DISTANCE > "+maxd2+"m</b> (Please/check amend wikipedia/wikidata coordinates.)";
		    else
			text = text + ", <b style=\"background-color: pink;\">DISTANCE > "+maxd+"m</b> (Please/check amend wikipedia/wikidata coordinates.)";
                } else {
		    var maxd2 = 50;
		    if (distance<maxd2)
			text = text + ", <b style=\"background-color: green;\">very close (< "+maxd2+"m)</b>";
		    else
			text = text + ", <b style=\"background-color: lightgreen;\">close ("+maxd2+"-"+maxd+"m)</b>";
		}
                if (osm.distance) {
                    text = text + ", "+osm.distance+"m";
                }
            }
            element.innerHTML += text;
	    text = "";
	}
        element.appendChild(document.createElement('br'));
	if (osm.tags) {
            text = JSON.stringify(osm.tags);
            text = text.replace(/","/g,'", "');
            textelement = document.createTextNode(text);
            element.appendChild(textelement);
	}
        return element;
    };

    am.addText = function(obj,text,br,style) {
	var mine = document.createTextNode(text);
	var span = document.createElement('span');
        span.appendChild(mine);
	if (style) {
	    span.style = style;
	}
        obj.appendChild(span);
        if (br == 1) {
            obj.appendChild(document.createElement('br'));
        }
    };

    am.addHTML = function(obj,text,br) {
	var myspan = document.createElement('span');
        myspan.innerHTML = text;	   
        obj.appendChild(myspan);
        if (br == 1) {
            obj.appendChild(document.createElement('br'));
        }
    };

    am.addSpan = function(obj,id,text) {
	var myspan = document.createElement('span');
	myspan.id = id;
        myspan.innerHTML = text;	   
        obj.appendChild(myspan);
    };
    
    am.ahref = function (id, text, title, href, onclick, style) {
        var a = document.createElement("a");
        a.appendChild(document.createTextNode(text));
        a.id = id;
        a.title = title;
        a.href = href;
	a.target = "_new";
	if (style) {
	    // doesn't work on iOS....
	    a.style = style;
	    // but solution below doesn't work either.
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
                a.href = "javascript:(function() {  var myWindow = window.open(\""+href+"\", \"_new\"); setTimeout(function() { myWindow.close(); }, "+ap.linktimeout+"); return false; }());";
            }
        }
	/*
	var obj = "";
	if (style) {
	    var span = document.createElement('div');
	    span.style = style + " display: inline;";
	    span.appendChild(a);
	    obj = span;
	} else {
	    obj = a;
	}
        return obj;
	*/
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
        var pi = Math.PI;
        var rad = pi/180.0;
        var dx = (lon - lon2)*rad * Math.cos((lat + lat2)/2*rad);
        var dy = (lat - lat2)*rad ;
        var dd = Math.pow(Math.pow(dx,2) + Math.pow(dy,2),0.5) * 6371.0 * 1000.0;
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
