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
    title = encodeURI(title);
    var coordspan = document.getElementById('coordinates');
    var coord;
    var coord2;
    var coord3;
    var wd;
    var link;
    try {
        // Fetch coordinates
        var span = document.getElementsByClassName("geo-default")[0];
        coord2 = document.getElementsByClassName("geo")[0].innerHTML;
        coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
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
        // Fetch wikidata
        wd = document.getElementById('t-wikibase').getElementsByTagName("a")[0].href;
        wd = wd.replace(/.*\//,"");
    } catch(err) {
        coordspan.appendChild(document.createTextNode(" (wikidata!)"));
    }
    try {
        // Create links
        link = "http://www.openstreetmap.org/?zoom=18&mlat="+coord[0]+"&mlon="+coord[1];
        coordspan.appendChild(ahref(" (OSM)","View in OSM",link));
        // link = "http://www.openstreetmap.org/#map=17/"+coord[0]+"/"+coord[1];
        link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord[0]+"&mlon="+coord[1];
        coordspan.appendChild(ahref(" (iD)","Edit wth iD",link));
        // link = "http://www.openstreetmap.org/edit#map=17/"+coord[0]+"/"+coord[1];
        var lang = window.location.href;
        lang = lang.replace(/\..*/,"").replace(/.*\//,"");
        link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+"name="+title+encodeURI("|wikidata="+wd+"|wikipedia=")+lang+":"+title;
        coordspan.appendChild(ahref(" (JOSM)","Add node with JOSM",link));
        link = "https://osm.wikidata.link/search?q="+title;
        coordspan.appendChild(ahref(" (osm.wd.link)","Search on osm.wikidata.link",link));
        link = "http://overpass-turbo.eu/map.html?Q=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A(%0A%20%20node%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20way%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20relation%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A)%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B";
        coordspan.appendChild(ahref(" (overpass-map)","View overpass interactive map",link));
        link = "http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%28%0A%20%20node%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20way%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20relation%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%29%3B%0Aout%20meta%3B%0A";
        coordspan.appendChild(ahref(" (overpass-json)","View overpass json data",link));
        link = "http://localhost:50808/hello?title="+title+"&coord="+coord2+"&geohack="+coord3+"&wikidata="+wd;
        coordspan.appendChild(ahref(" (local)","You need a local server for this.",link));
    } catch(err) {
        coordspan.appendChild(document.createTextNode(" (links!)"));
    }
    try {
        link = "http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%28%0A%20%20node%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20way%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20relation%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%29%3B%0Aout%20meta%3B%0A";
        GM_xmlhttpRequest({
            method: "GET",
            url: link,
            onload: function(response) {
                // alert(response.responseText);
                var op = JSON.parse(response.responseText);
                for (var j = 0; j < op.elements.length; j++){
                    var id = op.elements[j].id;
                    var type = op.elements[j].type;
                    link = "http://www.openstreetmap.org/"+type+"/"+id;
                    coordspan.appendChild(ahref(type+"/"+id,"View object "+j+" on OSM",link));
                    var factor = 0.005;
                    var left = parseFloat(coord[1]) - factor;
                    var right = parseFloat(coord[1]) + factor;
                    var bottom = parseFloat(coord[0]) - factor;
                    var top = parseFloat(coord[0]) + factor;
                    var pos = "right="+right+"&left="+left+"&top="+top+"&bottom="+bottom;
                    link = "http://127.0.0.1:8111/load_and_zoom?"+pos+"&new_layer=false&select="+type+id;
                    coordspan.appendChild(ahref(" (JOSM)","Edit object "+j+" with JOSM",link));
                }
            }
        });
    } catch(err) {
        alert("error: "+err);
    }
})();

function ahref(text, title, href) {
    var a = document.createElement("a");
    a.appendChild(document.createTextNode(text));
    a.title = title;
    a.href = href;
    return a;
}
