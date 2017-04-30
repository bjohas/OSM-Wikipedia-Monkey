// ==UserScript==
// @name         Monkey Wikipedia to OSM.js
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
    attachdiv.appendChild(ahref("mylinkOSMWIKIDATA"," (osm.wikidata.link)","Search on osm.wikidata.link",link));
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
    // Wikidata object only
    // overpassquery = "%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%28%0A%20%20node%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20way%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20relation%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%29%3B%0Aout%20meta%3B%0A";
    // Wikidata or Wikipedia tags:
    // var overpassquery = "%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%28%0A%20%20node%5B%22wikipedia%22%3D%22"+wp+"%22%5D%3B%0A%20%20way%5B%22wikipedia%22%3D%22"+wp+"%22%5D%3B%0A%20%20relation%5B%22wikipedia%22%3D%22"+wp+"%22%5D%3B%0A%20%20node%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20way%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%20%20relation%5B%22wikidata%22%3D%22"+wd+"%22%5D%3B%0A%29%3B%0Aout%20meta%3B";
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
        OSMExtension = "?zoom=18&mlat="+coord[0]+"&mlon="+coord[1]+"&lang="+lang+"&wikidata="+wd+"&wikipedia="+lang+":"+title;
        link = "http://www.openstreetmap.org/"+OSMExtension;
        attachdiv.appendChild(ahref("mylinkidOSM"," (OSM)","View area in OSM",link));
        // link = "http://www.openstreetmap.org/#map=17/"+coord[0]+"/"+coord[1];
        // link = "http://www.openstreetmap.org/edit#map=17/"+coord[0]+"/"+coord[1];
        link = "http://www.openstreetmap.org/edit?zoom=18&mlat="+coord[0]+"&mlon="+coord[1]+"&lang="+lang+"&wikidata="+wd+"&wikipedia="+lang+":"+title;
        attachdiv.appendChild(ahref("mylinkidID"," (iD)","Edit area wth iD",link));
        link = "http://127.0.0.1:8111/add_node?lat="+coord[0]+"&lon="+coord[1]+"&addtags="+"name="+title+encodeURI("|source=wikipedia|wikidata="+wd+"|wikipedia=")+lang+":"+title;
        attachdiv.appendChild(ahref("mylinkidJOSM"," (JOSM)","Add node with JOSM",link));
        attachdiv.appendChild(ahref("mylinkidMAP"," (overpass-map)","View overpass interactive map for wikidata:"+wd,link));
        link = "http://overpass-api.de/api/interpreter?data="+overpassquery;
        attachdiv.appendChild(ahref("mylinkidJSON"," (overpass-json)","View overpass json data for wikidata:"+wd,link));
        link = "http://localhost:50808/hello?title="+lang+":"+title+"&coord="+coord2+"&geohack="+coord3+"&wikidata="+wd;
        attachdiv.appendChild(ahref("mylinkid"," (local)","You need a local server for this.",link));
    } catch(err) {
        attachdiv.appendChild(document.createTextNode(" (links!)"));
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
                        // At least for the first link, rather than appending, we could replace the earlier link.
                        if (j===0) {
                            document.getElementById('mylinkidOSM').href = link + OSMExtension;
                            attachdiv.appendChild(document.createTextNode(" "+haswp+haswd));
                        } else {
                            attachdiv.appendChild(ahref("mylinkidOSMx"," "+haswp+haswd+","+type+"/"+id,"View object "+j+" on OSM",link));
                        }
                        var factor = 0.005;
                        var left = parseFloat(coord[1]) - factor;
                        var right = parseFloat(coord[1]) + factor;
                        var bottom = parseFloat(coord[0]) - factor;
                        var top = parseFloat(coord[0]) + factor;
                        var pos = "right="+right+"&left="+left+"&top="+top+"&bottom="+bottom;
                        link = "http://127.0.0.1:8111/load_and_zoom?"+pos+"&new_layer=false&select="+type+id;
                        if (j===0) {
                            document.getElementById('mylinkidJOSM').href = link ;
                        } else {
                            attachdiv.appendChild(ahref("mylinkidJOSMx"," (JOSM) ","Edit object "+j+" with JOSM",link));
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
                    alert("error xmlhttp: "+err);
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
