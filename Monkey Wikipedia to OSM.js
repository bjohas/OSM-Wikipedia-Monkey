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
    // Fetch coordinates
    var span = document.getElementsByClassName("geo-default")[0];
    var coord2 = document.getElementsByClassName("geo")[0].innerHTML;
    coord2 = coord2.replace(/<\/span>/,",").replace(/<.*?>/g,"").replace(/ /g,"").replace(/\;/g,",");
    // Also coordinates from link to geohack tools.wmflabs.org/geohack/geohack.php?....params=40.4865_N_8.7698_E_.....
    var coordspan = document.getElementById('coordinates');
    var lks = coordspan.getElementsByTagName("a");
    var lk = "";
    for (var j = 0; j < lks.length; j++){
        if (lks[j].href.match(/geohack/g) === null) {
        } else {
            lk = lks[j].href;
        }
    }
    var coord = encodeURI(lk.replace(/.*params=/,"").replace(/\&.*/,""));
    // Fetch wikidata
    var wd = document.getElementById('t-wikibase').getElementsByTagName("a")[0].href;
    wd = wd.replace(/.*\//,"");
    // Create link
    var a = document.createElement("a");
    var linkText = document.createTextNode(" (OSM)");
    a.appendChild(linkText);
    a.title = "OSM";
    a.href = "http://localhost:50808/hello?title="+title+"&coord="+coord2+"&geohack="+coord+"&wikidata="+wd;
    coordspan.appendChild(a);
})();
