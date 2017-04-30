// ==UserScript==
// @name         Extracting coordinates and wikidata from wikipedia page
// @namespace    http://bjohas.de
// @version      0.1
// @description  Extract coordinates and wikidata from wikipedia page. Probably won't work on all wikipedias
// @author       Bjoern Hassler
// @match        https://*.wikipedia.org/*
// @grant        none
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
        coordspan.appendChild(ahref(" (OSM)","iD",link));
        // link = "http://www.openstreetmap.org/#map=17/"+coord[0]+"/"+coord[1];
        link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord[0]+"&mlon="+coord[1];
        coordspan.appendChild(ahref(" (iD)","iD",link));
        // link = "http://www.openstreetmap.org/edit#map=17/"+coord[0]+"/"+coord[1];
        var lang = window.location.href;
        lang = lang.replace(/\..*/,"").replace(/.*\//,"");
        link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+"name="+title+encodeURI("|wikidata="+wd+"|wikipedia=")+lang+":"+title;
        coordspan.appendChild(ahref(" (JOSM)","JOSM",link));
        link = "https://osm.wikidata.link/search?q="+title;
        coordspan.appendChild(ahref(" (osm.wd.link)","link",link));
        link = "http://overpass-turbo.eu/map.html?Q=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A(%0A%20%20node%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20way%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20relation%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A)%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B";
        coordspan.appendChild(ahref(" (overpass)","overpass",link));
        link = "http://localhost:50808/hello?title="+title+"&coord="+coord2+"&geohack="+coord3+"&wikidata="+wd;
        coordspan.appendChild(ahref(" (local)","OSM",link));
    } catch(err) {
        coordspan.appendChild(document.createTextNode(" (links!)"));
    }
})();

function ahref(text, title, href) {
    var a = document.createElement("a");
    a.appendChild(document.createTextNode(text));
    a.title = title;
    a.href = href;
    return a;
}
