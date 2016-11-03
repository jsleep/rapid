Request = {
    // Constant webpage endpoints
    TO_FEATURE: "/rapid/feature/",
    TO_LAYER: "/rapid/layer/",
    TO_GEOVIEW: "/rapid/geoview/",
    TO_BASE: "/rapid/",
    TO_GEOSERVER: "http://geocontex.com:8080/geoserver/ows",
    TO_GEOSERVER_LAYERS: "/rapid/geoserver/layers/",
    TO_GEOSERVER_GEOVIEWS: "/rapid/geoserver/geoviews/"
};

var geoViews = {};
var geoViewData = {};
var displayedGeoViewData = {};

var geoViewStyle = {
        weight: 2,
        fillOpacity: 0,
        color: 'black',
        dashArray: '5,5',
        clickable: false
    };

var refreshGeoViews = function () {

    var callback = function(data) {
        var fc = JSON.parse(data);
        console.log(fc);

        geoViewList.innerHTML = '<li><h4>GeoViews</h4></li>';

        for (var i = 0; i < fc['features'].length; i++) {
            var view = fc['features'][i];
            var uid = view.properties.uid;
            geoViews[uid] = L.geoJson(view, {style: geoViewStyle}).addTo(map);

            var geoViewListElement = document.createElement("LI");
            var geoViewListElementDiv = document.createElement('DIV');
            geoViewListElementDiv.id = uid;
            geoViewListElementDiv.style.marginBottom = '5px';
            geoViewListElementDiv.style.width = '100%';
            geoViewListElementDiv.style.display = 'inline-block';

            var descriptor = document.createTextNode(view.properties.title);
            var showIntersectingFeatures = document.createElement("BUTTON");
            showIntersectingFeatures.type = 'button';
            showIntersectingFeatures.id = uid + '_show';
            showIntersectingFeatures.style.float = 'right';
            showIntersectingFeatures.className = 'btn btn-default btn-xs';
            showIntersectingFeatures.add = true;
            showIntersectingFeatures.onclick = (function(e) {
                var id = e.currentTarget.id.replace('_show', '');
                var button = $('#'+id + "_show");
                if(e.currentTarget.add == true) {
                    getFeaturesInGeoview(id);
                    button.text('Hide All Data');
                }
                else {
                    map.removeLayer(displayedGeoViewData[id]);
                    button.text('Show All Data');
                }
                e.currentTarget.add = !e.currentTarget.add;
            });
            showIntersectingFeatures.value = 'Get Features';
            var buttonText = document.createTextNode('Show All Data');
            showIntersectingFeatures.appendChild(buttonText);
            geoViewListElement.appendChild(geoViewListElementDiv).appendChild(descriptor);
            geoViewListElement.appendChild(geoViewListElementDiv).appendChild(showIntersectingFeatures);

            //layer list under geoview - doesn't seem like it's currently working
            //let's change this to populate the layer list when show all data is selected
            var ul = document.createElement("UL");
            ul.id = uid + '_layers';

            for (var key in view.properties.layers) {
                var liDiv = document.createElement("DIV");
                var li = document.createElement("LI");
                var descriptor = document.createTextNode(view.properties.layers[key]);
                liDiv.id = key;
                li.appendChild(liDiv).appendChild(descriptor);
                ul.appendChild(li);
            }
            geoViewListElement.appendChild(ul);

            geoViewList.appendChild(geoViewListElement);
        }
    }

    ajaxCall(Request.TO_GEOSERVER_GEOVIEWS, callback);

    return true;
};

function ajaxCall(address, callback) {
    
    var response =  $.ajax({
        type: "GET",
        async: true,
        dataType : "text",
        url: address,
        beforeSend: function(xhr) {
            xhr.withCredentials = true;
        },
        success: callback,
        error: function(error) {
            console.error(error.statusText);               
        }
    });
    return response;
}

function getFeaturesInGeoview(uid) {
    console.log(uid);
    if(geoViewData[uid]) {
        displayData(uid);
    }
    else {
        $.ajax({
           url: Request.TO_GEOVIEW + uid + '/features/',
           dataType: 'json',
           success: function (data) {
               geoViewData[uid] = data;
               displayData(uid);
           }
        })
    }
    
}

function displayData(uid) {
   var displayData = jQuery.extend(true, {}, geoViewData[uid]);
   displayData.features = filterFeatures(displayData);
   displayedGeoViewData[uid] = L.geoJson(displayData, {
       onEachFeature: constructPopup
   }).addTo(map);
   map.fitBounds(geoViews[uid])  
}

function getFeatures(data) {
    return data.features;
}

function getProperties(feature){
    return JSON.parse(feature.properties.properties);
}

function strToValue(str) {
    if(Date.parse(str)) {
        return Date.parse(str);
    }
    else if (parseInt(str)){
        return parseInt(str);
    }
    else {
        return str;
    }
}

function filterFeatures(data) {
    if (filterString) {
        filterFunction = function(element) {
            var f = getProperties(element);
            var evaluation = eval(filterString);
            return evaluation;
        } 
        return getFeatures(data).filter(filterFunction);
    }
    return getFeatures(data);

}

function constructPopup(feature, layer) {
    var popupText = "";

    popupText += "RAPID_LAYER : " + feature.properties.layer + "<br>";
    var props = JSON.parse(feature.properties.properties);

    for (x in props) {
        var str = x + " : " + props[x] + "<br>";
        popupText += str;
    }

    feature.properties.properties = props;
    
    layer.bindPopup(popupText);
}

function loadGUI() {
    refreshGeoViews();
}
