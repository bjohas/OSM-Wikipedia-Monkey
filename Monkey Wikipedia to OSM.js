// ==UserScript==
// @name         Extracting coordinates and wikidata from wikipedia page
// @namespace    http://bjohas.de
// @version      0.1
// @description  Extract coordinates and wikidata from wikipedia page. Probably won't work on all wikipedias
// @author       Bjoern Hassler
// @match        https://*.wikipedia.org/*
// @grant        GM_xmlhttpRequest
// @connect      overpass-api.de
// ==/UserScript==

(function() {
    'use strict';
    // Fetch page title
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
        coordspan.appendChild(document.createTextNode("; "+wd));
    } catch(err) {
        coordspan.appendChild(document.createTextNode("; no wikidata!"));
    }
    var overpassquery = encodeURIComponent(`
[out:json][timeout:25];
(
  node["wikipedia"="${wp}"];
  way["wikipedia"="${wp}"];
  relation["wikipedia"="${wp}"];
  node["wikidata"="${wd}"];
  way["wikidata"="${wd}"];
  relation["wikidata"="${wd}"];
);
out meta;
`);
    var outskel = encodeURIComponent(`
>;
out skel qt;
`);
    var coord;
    var coord2;
    var coord3;
    var link;
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
        coordspan.appendChild(document.createTextNode(" (coords!)"));
    }
    try {
        // Create links
        link = "http://www.openstreetmap.org/?zoom=18&mlat="+coord[0]+"&mlon="+coord[1];
        coordspan.appendChild(ahref("mylinkid"," (OSM)","View area in OSM",link));
        // link = "http://www.openstreetmap.org/#map=17/"+coord[0]+"/"+coord[1];
        // link = "http://www.openstreetmap.org/edit#map=17/"+coord[0]+"/"+coord[1];
        link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord[0]+"&mlon="+coord[1]+"?"+"wikidata="+wd+"&wikipedia="+lang+":"+title;
        coordspan.appendChild(ahref("mylinkid"," (iD)","Edit area wth iD",link));
        link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+"name="+title+encodeURI("|wikidata="+wd+"|wikipedia=")+lang+":"+title;
        coordspan.appendChild(ahref("mylinkid"," (JOSM)","Add node with JOSM",link));
        link = "https://osm.wikidata.link/search?q="+title;
        coordspan.appendChild(ahref("mylinkid"," (osm.wd.link)","Search on osm.wikidata.link",link));
        link = "http://overpass-turbo.eu/map.html?Q="+overpassquery + outskel;
        coordspan.appendChild(ahref("mylinkidMAP"," (overpass-map)","View overpass interactive map for wikidata:"+wd,link));
        link = "http://overpass-api.de/api/interpreter?data="+overpassquery;
        coordspan.appendChild(ahref("mylinkidJSON"," (overpass-json)","View overpass json data for wikidata:"+wd,link));
        link = "http://localhost:50808/hello?title="+lang+":"+title+"&coord="+coord2+"&geohack="+coord3+"&wikidata="+wd;
        coordspan.appendChild(ahref("mylinkid"," (local)","You need a local server for this.",link));
    } catch(err) {
        coordspan.appendChild(document.createTextNode(" (links!)"));
    }
    try {
        link = "http://overpass-api.de/api/interpreter?data="+overpassquery;
        GM_xmlhttpRequest({
            method: "GET",
            url: link,
            onload: function(response) {
                try {
                    // alert(response.responseText);
                    var op = JSON.parse(response.responseText);
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
                        coordspan.appendChild(ahref("mylinkid"," "+haswp+haswd+","+type+"/"+id,"View object "+j+" on OSM",link));
                        var factor = 0.005;
                        var left = parseFloat(coord[1]) - factor;
                        var right = parseFloat(coord[1]) + factor;
                        var bottom = parseFloat(coord[0]) - factor;
                        var top = parseFloat(coord[0]) + factor;
                        var pos = "right="+right+"&left="+left+"&top="+top+"&bottom="+bottom;
                        link = "http://127.0.0.1:8111/load_and_zoom?"+pos+"&new_layer=false&select="+type+id;
                        coordspan.appendChild(ahref("mylinkid"," (JOSM) ","Edit object "+j+" with JOSM",link));
                    }
                    if (op.elements.length === 0) {
                        coordspan.appendChild(document.createTextNode("; No OSM object!"));
                        // Remove the above elements, as they won't work:
                        document.getElementById("mylinkidJSON").outerHTML = "";
                        document.getElementById("mylinkidMAP").outerHTML = "";
                    }
                } catch(err) {
                    alert("error: "+err);
                }
            }
        });
    } catch(err) {
        alert("error: "+err);
    }
})();

function ahref(id,text, title, href) {
    var a = document.createElement("a");
    a.appendChild(document.createTextNode(text));
    a.id = id;
    a.title = title;
    a.href = href;
    return a;
}
