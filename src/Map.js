import React from "react";
import { Map, Marker, GoogleApiWrapper } from "google-maps-react";
import InfoWindowMap from "./InfoWindow";
import { saveAs } from 'file-saver';
import { logicalExpression } from "@babel/types";

const MarkersList = props => {
  const { locations, titles, ...markerProps } = props;
  var storedMarkers = JSON.parse(localStorage.getItem("markers")) ? JSON.parse(localStorage.getItem("markers")) : [];

  return (
    <span>
      { 
        storedMarkers.map((stored, i) => {
        return (
            <Marker onClick={window.mapContainer.onMarkerClick} 
              ref={window.mapContainer.onMarkerMounted}
              key={i}
              {...markerProps}
              position={{ lat: stored.lat, lng: stored.lng }}
            />
        );
      })}
      {locations.map((location, i) => {
        return (
            <Marker onClick={window.mapContainer.onMarkerClick} 
              ref={window.mapContainer.onMarkerMounted}
              key={i}
              {...markerProps}
              position={{ lat: location.lat(), lng: location.lng() }}
            />
        );
      })}
    </span>
  );
};

class MapContainer extends React.Component {
  constructor(props) {
    super(props);
    window.mapContainer = this;
    this.state = {
      locations: [],
      titles: [],
      markerObjects: [],
      showingInfoWindow: false,  //Hides or the shows the infoWindow
      activeMarker: {},         //Shows the active marker upon click
      selectedPlace: {}         //Shows the infoWindow to the selected place upon a marker
    };

    this.initialLoad = true;

    this.onMarkerMounted = element => {
      this.setState(prevState => ({
        markerObjects: [...prevState.markerObjects, element.marker]
      }));
    };

    this.handleMapClick = this.handleMapClick.bind(this);
  }

  onMarkerClick = (props, marker, e) => {
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true
    });
  };

  displayListMarkers = () => {
    const divMarkerList = document.getElementsByClassName("markerList")[0];
    divMarkerList.classList.toggle('hide');
  };

  updateListMarkers = () => {
    const divMarkerList = document.getElementsByClassName("markerList")[0];
    divMarkerList.innerHTML = "<p>List of Markers</p>";
    var storedMarkers = JSON.parse(localStorage.getItem("markers")) ? JSON.parse(localStorage.getItem("markers")) : [];

    if (storedMarkers.length > 0) {
      for(var i = 0; i < storedMarkers.length; i++) {
        divMarkerList.innerHTML += `<div class='marker'>
        <span>${storedMarkers[i].title}</span><br>
        <span>lat: ${storedMarkers[i].lat.toFixed(4)} </span><br>
        <span>lng: ${storedMarkers[i].lng.toFixed(4)}</span><br>
        </div>`; 
      }
    }

    for(var i = 0; i < this.state.locations.length; i++) {
      var indexLat = storedMarkers.findIndex(el => el.lat === this.state.locations[i].lat());
      var indexLng = storedMarkers.findIndex(el => el.lng === this.state.locations[i].lng());
      var checkExisting = indexLat !== -1 && indexLng !== -1 && indexLat === indexLng;
      if (storedMarkers.length > 0) {
        if (!checkExisting) {
              divMarkerList.innerHTML += `<div class='marker'>
              <span>${this.state.titles[i]}</span><br>
              <span>lat: ${this.state.locations[i].lat().toFixed(4)}</span><br>
              <span>lng: ${this.state.locations[i].lng().toFixed(4)}</span><br>
              </div>`; 
        }
      } else {
              divMarkerList.innerHTML += `<div class='marker'>
              <span>${this.state.titles[i]}</span><br>
              <span>lat: ${this.state.locations[i].lat().toFixed(4)}</span><br>
              <span>lng: ${this.state.locations[i].lng().toFixed(4)}</span><br>
              </div>`;
      } 
    }
    divMarkerList.style.display = "block";
  };

  saveMarkers = () => {
    var saveData = this.state.markerObjects;
    var toStore = [];
    for (var i=0; i < saveData.length; i++) {
      toStore.push({"title": saveData[i].name, "lat": saveData[i].position.lat(), "lng": saveData[i].position.lng()});
    }
    localStorage.setItem('markers', JSON.stringify(toStore));
  }

  updateTitle = (e) => {
    const title = document.getElementsByTagName("input")[0].value;
    this.markers.activeMarker.title = title;
    this.state.activeMarker.name = title;

    this.updateListMarkers();
  };

  onClose = props => {
    if(document.getElementById("form") !== "undefined" && 
        document.getElementById("form") !== null) {
      document.getElementById("form").reset();
    }
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        activeMarker: null
      });
    }
  };

  exportMarkers = props => {
    this.saveMarkers();
    var blob = new Blob([localStorage.getItem("markers")], {type: "application/json"});
    console.log(localStorage.getItem("markers"));
    saveAs(blob, "markers.json");
  };

  readFile = (file) => {
    var reader = new FileReader();
    var json;
    reader.addEventListener('load', (loadEvent) => {
      try {
        json = JSON.parse(loadEvent.target.result);
        console.log(json);
        localStorage.setItem("markers", JSON.stringify(json));
        this.setState(prevState => ({
          showingInfoWindow: false
        }));
        this.updateListMarkers();
      } catch (error) {
        console.error(error);
      }
    });
    reader.readAsText(file);
  }

  importMarkers = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      this.readFile(ev.target.files[0]);
  }

  handleMapClick = (ref, map, ev) => {
    const location = ev.latLng;
    const title = "Marker";
    this.setState(prevState => ({
      locations: [...prevState.locations, location], 
      titles: [...prevState.titles, title],
    }));
    
    map.panTo(location);
    this.onClose();
    this.updateListMarkers();
  };

  render() {
    return (
      <div className="map-container">
        <Map
          google={this.props.google}
          className={"map"}
          zoom={this.props.zoom}
          initialCenter={this.props.center}
          onClick={this.handleMapClick}
          onTilesloaded={this.updateListMarkers}
        >
        
        <MarkersList locations={this.state.locations} titles={this.state.titles}  />

        <InfoWindowMap
          marker={this.state.activeMarker}
          visible={this.state.showingInfoWindow}
          onClose={this.onClose}
        >
        <div>
          <form id="form">
            <label>Título:</label>
            <input type="text" id="title" size="31" maxLength="31" tabIndex="1" autoComplete="off" placeholder="Adicione título"/>
            <label>Descrição:</label>
            <textarea id="description" size="31" tabIndex="2" placeholder="Adicione descrição"></textarea> 
            <input type="button" id="inputButton" tabIndex="3" data-id={this.state.activeMarker} onClick={this.updateTitle} value="Submit"/>
          </form>
        </div>
        </InfoWindowMap>
        </Map>
        <div className={"toolbar"}>
          <img className={"button"} src={"/images/listButton.jpg"} onClick={this.displayListMarkers}></img>
          <img className={"button"} src={"/images/saveButton.jpg"} onClick={this.saveMarkers}></img>
          <label className={"jsonInput"}  htmlFor="jsonFile"><img className={"button"} src={"/images/impButton.jpg"}></img></label>
          <input type="file" id="jsonFile" name="jsonFile" onChange={this.importMarkers} />
          <img className={"button"} src={"/images/expButton.jpg"} onClick={this.exportMarkers}></img>
        </div>
        <div className={"markerList"}> 
          <p>List of Markers</p>
          <div className={"list"}></div>
        </div>
      </div>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: "",
  libraries: []
})(MapContainer);
