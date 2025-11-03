import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useMap } from 'react-leaflet/hooks'
import { CircleMarker } from 'react-leaflet/CircleMarker'
import L from "leaflet";

/*const xhr2 = require('xhr2');
const xhr = new xhr2.XMLHttpRequest();

xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) { // Request successful
    var jsonResponse = JSON.parse(xhr.responseText);

    console.log(jsonResponse["stops"][0]);
  }
};




xhr.open('GET', 'https://tfe-opendata.com/api/v1/stops');
xhr.send();
//xhr
console.log("yo");
//var m = xhr.send("GET /v1/live_bus_times/8")*/

const LINE_COLORS = {
  bakerloo: "#894E24",
  central: "#DC241F",
  circle: "#FFCE00",
  district: "#007229",
  "hammersmith-city": "#D799AF",
  jubilee: "#6A7278",
  metropolitan: "#751056",
  northern: "#000000",
  piccadilly: "#0019A8",
  victoria: "#00A0E2",
  "waterloo-city": "#76D0BD",
};

const myIcon = () =>
  L.divIcon({
    className: "bus-stop",
    html: `<div style="
      width:8px;height:8px;
      background:red;
      border-radius:50%;
      border:2px solid white;"></div>`,
    iconSize: [16,16]
  });

const lineIcon = (lineId = "default") =>
  L.divIcon({
    className: "tube-marker",
    html: `<div style="
      background:orange;
      width:12px;height:12px;
      border-radius:50%;
      border:2px solid white;"></div>`,
    iconSize: [16, 16],
  });

function MyComponent() {
  const [stops, setStops] = useState([]); //this is to let stops be updatable
  const map = useMap()
  //console.log(map.getZoom());


  console.log('map center:', map.getCenter());
  const centre = map.getCenter();
  console.log(map.getZoom());
  useEffect(() => {
    fetch('https://tfe-opendata.com/api/v1/stops')
    .then((res) => res.json())
    .then((data) => {
        const stops = data.stops.map((s) => ({
            id: s.stop_id,
            name: s.name,
            lat: s.latitude,
            lon: s.longitude,
            type: s.service_type
        }));
        setStops(stops.filter(s => s.type=="bus")) //creates a lovely json file!
    });
  });

  if (map.getZoom() >= 15) {
    console.log("happy")
    return (
    stops.map((st) => {
      //console.log(stops);
      // Render the station
      const latd = 0.010
      const lond = 0.030
      if (Math.abs(st.lat-centre.lat) <= latd && Math.abs(st.lon-centre.lng) <= lond) { 
      return (
        <Marker
          //key={st.id}
          position={[st.lat, st.lon]}
          icon={myIcon()}
        >
          <Popup>
            <strong>{st.name}</strong>
          </Popup>
        </Marker>
      );
    }
    else return null

    }))}
  else {
    console.log("sad")
    return null
  }
}


export default function App() {
  //const zoom = ZoomControl();

  //const [zoom, setZoom] = useState(12);
  //const map = useMap();
  //const [arrivals, setArrivals] = useState([]);
  /*const MapEvents = () => {
    useMapEvents({
      zoomend() {
        const zoom = map.getZoom();
        setZoom(zoom);
      }
    });
    return null;
  };*/

  
  
  



  return (
    <MapContainer
      center={[55.95, -3.18]}
      zoom={12}
      style={{ width: "100%", height: "100vh" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MyComponent />
      
      
    </MapContainer>
  )
}
//console.log(typeof(m.responseText))