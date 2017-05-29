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
                ap.addBasicsResult = am.addBasics(); //checks for types visible from article page
        if (ap.addBasicsResult) {
            console.log("getOSMData");
            am.getOSMData(ap.addBasicsResult);
            if (ap.addBasicsResult.wikidata) {
                console.log("osm.wikipedia.link");
                am.getLinkData(ap.addBasicsResult.wikidata);
            }
        }
    };

    am.addBasics = function () {
        // Fetch page title
        var attachhere = document.getElementById('siteNotice');
        var attachdiv = document.createElement("div");
        attachdiv.setAttribute('style', 'border: solid 1px blue; padding: 5px; text-align: left;');
        am.addText(attachdiv,"Wikipedia->OSM: Overpass");
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
        // link = "https://osm.wikidata.link/search?q="+title;
        // attachdiv.appendChild(am.ahref("mylinkOSMWIKIDATA"," (osm.wikidata.link)","Search on osm.wikidata.link",link));
        // link = "http://overpass-turbo.eu/map.html?Q="+overpassquery + outskel ;
        // Obtain wikidata
        var wd;
        try {
            // Fetch wikidata
            wd = document.getElementById('t-wikibase').getElementsByTagName("a")[0].href;
            wd = wd.replace(/.*\//,"");
            am.addText(attachdiv,"; "+wd);
        } catch(err) {
            am.addText(attachdiv,"; no wikidata!");
        }
        var overpassquery = encodeURIComponent(
            "[out:json][timeout:25];"+
            '(node["wikipedia"="'+wp+'"];way["wikipedia"="'+wp+'"];relation["wikipedia"="'+wp+'"];'+
            'node["wikidata"="'+wd+'"]; way["wikidata"="'+wd+'"]; relation["wikidata"="'+wd+'"];'+
            "); out meta; ");
        var outskel = encodeURIComponent(" >; out skel qt; "+"{{style: node, way, relation { text: name; } }}");
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
                // am.addText(attachdiv," (coord-method-1a-ok)"+coord);
                console.log("(coord-method-1a-ok)");
            } else if (document.getElementsByClassName("geo-default") && document.getElementsByClassName("geo-default").length>0) {
                var span = document.getElementsByClassName("geo-default")[0];
                coord2 =span.innerHTML;
                coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
                coord2 = coord2.replace(/,+/,",");
                coord = coord2.split(",");
                // am.addText(attachdiv," (coord-method-1b-ok)"+coord);
                console.log("(coord-method-1b-ok)");
            } else if (document.getElementsByClassName("geo-nondefault") && document.getElementsByClassName("geo-nondefault").length > 0) {
                var span2 = document.getElementsByClassName("geo-nondefault")[0];
                coord2 =span2.innerHTML;
                // console.log(coord2);
                coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
                coord2 = coord2.replace(/,+/,",");
                coord = coord2.split(",");
                // am.addText(attachdiv," (coord-method-1c-ok)"+coord2);
                console.log("(coord-method-1c-ok)");
            } else {
                // am.addText(attachdiv," (coord-method-1-fail)");
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
                    // am.addText(attachdiv," (coord-method-2b-fail)");
                    console.log("(coord-method-2b-fail)");
                } else {
                    coord3 = encodeURI(lk.replace(/.*params=/,"").replace(/\&.*/,""));
                    // am.addText(attachdiv," (coord-method-2a-ok)"+coord);
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
                    // am.addText(attachdiv," (coord-method-2b-fail)");
                    console.log("(coord-method-2b-fail)");
                } else {
                    coord3 = encodeURI(lk.replace(/.*params=/,"").replace(/\&.*/,""));
                    // am.addText(attachdiv," (coord-method-2b-ok)"+coord3);
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
//	    am.addText(attachdiv,", dual coord: "+coord3);
	    if (coord[0] != coord_[0]) {
            am.addText(attachdiv,"(mismatch X: "+coord[0]+" " + coord_[0] + ")");
	    }
	    if (coord[1] != coord_[1]) {
            am.addText(attachdiv,"(mismatch Y: "+coord[1]+" " + coord_[1] + ")");
        }
//	    am.addText(attachdiv,"; ");
	}
	if (coord2 === "" && coord3 !== "") {
	    coord = coord_;
	}
        try {
            // Create links
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
            link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+"name="+title+encodeURI("|source=wikipedia|wikidata="+wd+"|wikipedia=")+lang+":"+title;
            attachdiv.appendChild(am.ahref("mylinkidJOSM"," (JOSM)","Add node with JOSM",link));
// Overpass-turbo - map
            link = "http://overpass-turbo.eu/map.html?Q="+overpassquery+outskel;
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
        }
        link = "https://overpass-api.de/api/interpreter?data="+overpassquery;
        var hascoords = 1;
        if (coord2 === '' && coord3 === '') {
            hascoords = 0;
        }
        return {"link": link, "OSMExtension": OSMExtension, "coord":coord, "hascoords":hascoords, "wikidata" : wd};
    };

    am.getOSMData = function (obj) {
        var myspan = document.createElement('span');
        var mytext = document.createTextNode(" ... Fetching data from overpass (should only take a sec) ... ");
        myspan.id = "temporary";
        myspan.appendChild(mytext);
        attachdiv.appendChild(myspan);
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
                        for (var j = 0; j < op.elements.length; j++){
                            am.addText(attachdiv,"",1);
                            var matchno = j+1;
                            am.addText(attachdiv," ["+matchno+"]");
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
                            var linkID = "http://www.openstreetmap.org/edit?"+type+"="+id;
                            // At least for the first link, rather than appending, we could replace the earlier link.
                            if (j===0) {
                                document.getElementById('mylinkidOSM').href = link + obj.OSMExtension;
                                // document.getElementById('mylinkidOSM').text = " (OSM/"+type+id+")";
                                document.getElementById('mylinkidOSM').text = " (OSM+)";
                                document.getElementById('mylinkidOSM').title = "View object on OSM.org.";
                                document.getElementById('mylinkidID').href = linkID;
                                document.getElementById('mylinkidID').text = " (iD+)";
                                document.getElementById('mylinkidID').title = "Edit object with iD.";
                                if (op.elements.length === 1) {
                                    am.addText(attachdiv," "+haswp+haswd);
                                } else {
                                    attachdiv.appendChild(am.ahref("mylinkidOSMx"," "+haswp+haswd+","+type+"/"+id,"View object "+matchno+" on OSM",link));
                                }
                            } else {
                                attachdiv.appendChild(am.ahref("mylinkidOSMx"," "+haswp+haswd+","+type+"/"+id,"View object "+matchno+" on OSM",link));
                            }
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
                                document.getElementById('mylinkidJOSM').title = "Load object with JSON." ;
                                if (op.elements.length > 1) {
                                    attachdiv.appendChild(am.ahref("mylinkidJOSMx"," (JOSM) ","Load object "+j+" with JOSM (same layer)",link));
                                }
                            } else {
                                attachdiv.appendChild(am.ahref("mylinkidJOSMx"," (JOSM) ","Load object "+j+" with JOSM (same layer)",link));
                            }
                        }
                        if (op.elements.length === 0) {
                            am.addText(attachdiv,"; No OSM object!",1);
                            // Remove the above elements, as they won't work:
                            //document.getElementById("mylinkidJSON").outerHTML = "";
                            //document.getElementById("mylinkidMAP").outerHTML = "";
                            document.getElementById("mylinkidJSON").outerHTML = " (overpass-JSON)";
                            document.getElementById("mylinkidMAP").outerHTML = " (overpass-map)";
                            // Better strategy would be to just remove the links, so the line doesn't shift about.
                            //document.getElementById('mylinkidJSON').href = link ;
                            //document.getElementById('mylinkidMAP').href = link ;
                        } else {
                            if (obj.hascoords === 0) {
                                am.addText(attachdiv,"",1);
                                am.addText(attachdiv,"The wikipedia/wikidata entry has no coordinates, but is linked to an OSM object. Please copy coordinates from OSM to wikipedia/wikidata.",1);                        
                            }
                        }
                    } else {
                        am.addText(attachdiv," Sorry, the overpass request has failed (no data).",1);
                    }
                } catch(err) {
                    console.log("getOSM data error xmlhttp: "+err);
                    am.addText(attachdiv," Sorry, the overpass request has failed. If you've loaded a lot of pages, you may be over quota - try reloading this page.",1);
                }
            }
        });
        } catch(err) {
            console.log("getOSM error in domain request: "+err);
        }
        return 1;
    };

    am.getLinkData = function (wikidata) {
        var apiurl = "https://osm.wikidata.link/api/1/item/"+wikidata;
        var attachhere = document.getElementById('siteNotice');
        var attachdiv = document.createElement("div");
        attachdiv.setAttribute('style', 'border: solid 1px blue; padding: 5px; text-align: left;');
        // am.addText(attachdiv,"osm.wikipedia.link: ");
        attachdiv.appendChild(am.ahref("osmwplinksite","osm.wikidata.link","Go to osm.wikidata.link","https://osm.wikidata.link"));
        attachdiv.appendChild(am.ahref("osmwplinkAPI"," (query) ","API url: "+apiurl,apiurl));
        attachdiv.id = "attachdiv2";
        attachhere.appendChild(attachdiv);
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
//                    console.log(responseText);
                    var op = JSON.parse(responseText);
                    if (op) {
                        // mytext = document.getElementById('temporary');
                        myspan.innerHTML = '';
                        var wdlat = 0;
                        var wdlon = 0;
                        var wdhasll = 0;
                        if (op.wikidata.lat) {
                            am.addText(attachdiv,"Wikidata_coords=("+op.wikidata.lat+","+op.wikidata.lon+"); ",1);
                            wdlat = op.wikidata.lat;
                            wdlon = op.wikidata.lon;
                            wdhasll = 1;
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
                                li = document.createElement("li");
                                // am.addText(li,"#"+(j+1)+": ");
                                li.appendChild(am.formatosm(op.osm[j],{"compare":wdhasll,"lat":wdlat,"lon":wdlon,"wikidata":wikidata}));
                                ol.appendChild(li);
                                // am.addText(attachdiv,"; ",1);
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
                                                                       "{{style: node, way, relation { text: name; }\nrelation {color:blue;} }}");
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
                                am.addText(attachdiv,"The query returned no results, with message: '"+op.error+"'. ",1);
                                if (op.error === "no coordinates") {
                                    am.addText(attachdiv,"RECOMMENDATION: add the coordinates to the wikidata item.");
                                }
                            } else {
                                am.addText(attachdiv,"Query message: "+op.response+". ");
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
        if (osm.tags) {
            if (osm.tags.name) {
                text = text + "" + osm.tags.name + "; ";
                element.innerHTML = "<b>"+text+"</b>";
                text = "";
            }
            if (osm.tags.wikidata) {
                if (osm.tags.wikidata != wikidata) {
                    text += " - WIKIDATA TAG MISMATCH! ";
                } else {
                    text += " - wikidata match! ";
                }
            }
        }
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
        element.appendChild(am.ahref("mylinkidJOSMx"," (JOSM) ","Load object with JOSM (same layer)",link));
        text = "(";
        var distance = 0;
        var lat = 0;
        var lon = 0;
        if (osm.center) {
            text = text + "C: ";
            lat = osm.center.lat;
            lon = osm.center.lon;
        } else {
            lat = osm.lat;
            lon = osm.lon;
        }
        text = text +lat+","+lon;
        text = text + "; "+osm.existing+")";
        if (extra.compare) {
            if (extra.compare==1) {
                distance = am.distance(lat,lon,extra.lat,extra.lon);
                // text = text +", "+extra.lat+" "+extra.lon+", d=" + distance;
                text = text + ", d=" + distance;
                var maxd = 300;
                if (distance>maxd) {
                    text = text + ", DISTANCE > "+maxd+"m";
                }
            }
        }
        textelement = document.createTextNode(text);
        element.appendChild(textelement);
        element.appendChild(document.createElement('br'));
        text = JSON.stringify(osm.tags);
//        text = text.replace("/\"\,\"/g","\", \"");
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

    am.ahref = function (id, text, title, href) {
        var a = document.createElement("a");
        a.appendChild(document.createTextNode(text));
        a.id = id;
        a.title = title;
        a.href = href;
        return a;
    };

    am.distance = function(lat, lon, lat2, lon2) {
        var pi = Math.PI;
        var rad = pi/180.0;
        var dx = (lon - lon2)*rad * Math.cos((lat + lat2)/2*rad);
        var dy = (lat - lat2)*rad ;
        var dd = Math.pow(Math.pow(dx,2) + Math.pow(dy,2),0.5) * 6371.0 * 1000.0;
        return Math.round(dd);
    };

	return wposmObj;
}());
$(wposm.init);
