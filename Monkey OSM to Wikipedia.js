// ==UserScript==
// @name         Monkey OSM to Wikipedia.js
// @namespace    http://bjohas.de
// @version      0.1
// @description  Link OSM to Wikipedia: Extract coordinates and search for nearby wikipedia page.
// @author       Bjoern Hassler
// @match        http://www.openstreetmap.org/*
// @grant        GM_xmlhttpRequest
// @connect      de.wikipedia.org
// @connect      en.wikipedia.org
// @connect      es.wikipedia.org
// @connect      ca.wikipedia.org
// ==/UserScript==

(function() {
    'use strict';
    var searchradius = 10000;
    var zoom = 0;
    var loc=window.location.href;
    var found = loc.match(/\/edit/);
    if (found) {
    }
    var lang = "de";
    var sidebar = document.getElementById('sidebar');
    sidebar.appendChild(document.createTextNode("Initialised. "));
    var lat = 0;
    var lon = 0;
    found = loc.match(/lang\=(\w\w)/);
    if (found) {
        lang = found[1];
        sidebar.appendChild(document.createTextNode("Lang: "+lang+"; "));
    }
    found = loc.match(/map\=(.*)\/(.*)\/(.*)/);
    if (found) {
        // alert("found");
        sidebar.appendChild(document.createTextNode("Coord from url: "+found[2]+","+ found[3] + "; "));
        zoom = found[1];
        lat = found[2];
        lon = found[3];
    } else {
        found = loc.match(/mlat\=([\d+\-\.\+]+)\&mlon=([\d+\-\.\+]+)/);
        if (found) {
            // alert("found");
            sidebar.appendChild(document.createTextNode("Coord from url (m): "+found[1]+","+ found[2] + "; "));
            lat = found[1];
            lon = found[2];
        } else {
            try {
                lat = document.getElementsByClassName("latitude")[0].innerHTML;
                lon = document.getElementsByClassName("longitude")[0].innerHTML;
            } catch(err) {
                alert("No coordinates.");
            }
        }
    }
    if (zoom>=13) {
        searchradius = 5000;
    }
    if (zoom>=15) {
        searchradius = 1000;
    }
    if (zoom>18) {
        searchradius = 100;
    }
    var link = apiurl(lang,lat,lon,searchradius);
    sidebar.appendChild(document.createTextNode("Note: "+lat+","+ lon + "; "));
    sidebar.appendChild(ahref("wikipediaapi","API Query (r="+searchradius+", lang="+lang+")","title",link));
//    alert(lat+" "+ lon);
    try {
        GM_xmlhttpRequest({
            method: "GET",
            url: link,
            onload: function(response) {
                try {
                    // alert(response.responseText);
                    var op = JSON.parse(response.responseText);
                    // sidebar.appendChild(document.createTextNode("; ok "+op.query.pages));
                    if (op.query) {
                        var page = op.query.pages;
                        for (var prop in page) {
                            sidebar.appendChild(makediv(lang,page[prop]));
                        }
                    } else {
                        sidebar.appendChild(document.createTextNode(" No results within search radius of "+searchradius+" m in language "+lang+". "));

                    }
/*
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
                    }*/
                } catch(err) {
                    alert("error xmlhttp: "+err);
                }
            }
        });
    } catch(err) {
        alert("error: "+err);
    }
})();

function apiurl(wiki,lat,lon,distance) {
    // https://de.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=39.33004%7C3.056001&gsradius=500&gslimit=10&format=json
    var link = "";
    link = "https://"+wiki+".wikipedia.org/w/api.php?action=query&prop=coordinates%7Cpageimages%7Cpageterms%7Clanglinks%7Cpageprops&ppprop=wikibase_item&colimit=50&piprop=thumbnail&pithumbsize=144&pilimit=50&wbptterms=description&generator=geosearch&ggscoord="+lat+"%7C"+lon+"&ggsradius="+distance+"&ggslimit=50&format=json";
    return link;
}

function ahref(id,text, title, href) {
    var a = document.createElement("a");
    a.appendChild(document.createTextNode(text));
    a.id = id;
    a.title = title;
    a.href = href;
    return a;
}

function makediv(lang,obj) {
    var div = document.createElement("div");
    // div.setAttribute('style', 'padding: 5px;');
    //var title = document.createTextNode(obj.title+obj.pageprops.wikibase_item);
    var div2 = document.createElement("div");
    div2.setAttribute('style', 'border-top: solid 1px blue; padding: 5px;');
    if (obj.thumbnail) {
        var img = document.createElement('img');
        img.src = obj.thumbnail.source;
        div2.appendChild(img);
    }
    //div2.appendChild(title);
    div2.appendChild(ahref("id1",obj.title,obj.title,"http://"+lang+".wikipedia.org/wiki/"+obj.title));
    div2.appendChild(document.createTextNode(", "));
    div2.appendChild(ahref("id2",obj.pageprops.wikibase_item,obj.pageprops.wikibase_item,"http://www.wikidata.org/wiki/"+obj.pageprops.wikibase_item));
    div2.appendChild(document.createTextNode(", "));
    var url=window.location.href;
    var mapbit =  url.match(/(\#.*)/);
    if (mapbit) {
        mapbit = mapbit[1];
    } else {
        mapbit = "";
    }
    url = url.replace(/\?.*/,"");
    url = url.replace(/\#.*/,"");
    var link = url+"?mlat="+obj.coordinates[0].lat+"&mlon="+obj.coordinates[0].lon+mapbit;
    div2.appendChild(ahref("id2","show","show",link));
    div.appendChild(div2);

//    obj.terms.description
/*    +obj.pageid
        +obj.title
        +obj.index+";"
        +obj.coordinates[0].lat+","
        +obj.coordinates[0].lon+","
        +obj.coordinates[0].primary+","
        +obj.coordinates[0].globe+";<br>"
        +obj.thumbnail.source
        +obj.thumbnail.width
        +obj.thumbnail.height
    )
    );   */
    return div;
}
