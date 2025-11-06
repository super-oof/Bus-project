import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
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

const LIVE_BUS = "https://tfe-opendata.com/api/v1/live_bus_times/";

const COLOURS = {
  bus: "red",
  tram: "green"
}

const myIcon = (colour = "red") =>
  L.divIcon({
    className: "bus-stop",
    html: `<div style="
      width:16px;height:16px;
      background:${COLOURS[colour] || "orange"};
      border-radius:50%;
      border:2px solid white;"></div>`,
    iconSize: [20,20]
  });


function Popp({content, routes, setRoutes}) {
  //console.log(typeof(content));
  if (typeof(content) == "string" || (content.hasOwnProperty('content'))) {
    //console.log("stringg");
    return (
      <div id="popupContent"><p>{content}</p></div>
    );
  }
  else {
    console.log("data to load");
    //console.log(content);
    //console.log(typeof(content));
    return (
      <>{
      content.map((st) => {
        let timer = st.unixtime - Math.floor(Date.now() / 1000);
        timer = Math.round(timer/60);
        let timerOut = "";
        //console.log(typeof(timer));

        if (timer==1) {timerOut="in 1 min"}
        else if (timer==0) {timerOut="due"}
        else if (timer<0) {timerOut="overdue"}
        else {timerOut= ("in "+timer+" mins")}
        return (
          <div class="bus" style={{whiteSpace: "nowrap"}}>
          <p style={{color: routes[st.route]? routes[st.route].textt : "white", backgroundColor: routes[st.route] ? routes[st.route].colour : "green", display:"inline", paddingLeft: "2px", paddingRight: "2px", marginTop: "2px", marginBottom: "2px"}}>
            {st.route}
            
            </p> to {st.dest} {timerOut}
          </div>
        )
      })
    }
    </>
    )
  }
};

function MyComponent() {
  const popupRef = useRef(null);
  const [popupContent, setPopupContent] = useState("Loading");
  const [centre, setCentre] = useState([55.95, -3.18]);
  const [zoom, setZoom] = useState(12);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]); //this is to let stops be updatable
  const mapp = useMap();
  //console.log(map.getZoom());


  useEffect(() => {
    //console.log("ftech");
    fetch('https://tfe-opendata.com/api/v1/stops')
    .then((res) => res.json())
    .then((data) => {
        //console.log("data");
        const stopps = data.stops.map((s) => ({
            id: s.stop_id,
            name: s.name,
            lat: s.latitude,
            lon: s.longitude,
            type: s.service_type
        }));
        //console.log("set stops");
        setStops(stopps); //creates a lovely json file!
    });
  }, []);

  useEffect(() => {
    console.log("Start");
    fetch('routes.json',{
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    })
    .then((res)=>res.json())
    .then((data) => {
      console.log("starting fetch");
      console.log(data);

      let routed = data.groups
      let busDict = {}
      for (let i=0; i< routed.length; i++) {
        //console.log(routed[i]);

        for (let j=0; j < routed[i].routes.length; j++) {
          let ok = routed[i].routes[j];
          let comp = {
            //id: ok.id,
            colour: ok.color,
            desc: ok.description,
            textt: ok.textColor
          }
          busDict[ok.id] = comp;
          //console.log(comp);
          //tempObj.append(comp);
        }
      }
      //console.log(busDict);
      console.log("fetched bus route data");
      setRoutes(busDict);

    });
  }, []);

  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom());
      setCentre(e.target.getCenter());
    },
    moveend: (e) => {
      setCentre(e.target.getCenter());
    },
  });


  function handlePopupOpen(key) {
    setPopupContent("Loading");
    let word = LIVE_BUS + key;
    let newContent = null;
    console.log(word);
    fetch(word)
      .then((res) => res.json())
      .then((data) => {
        if (data != null) {
          newContent = data.map((s) => ({
            route: s.routeName,
            early: s.departures[0].departureTime,
            unixtime: s.departures[0].departureTimeUnix,
            dest: s.departures[0].destination
          }));
          //console.log(JSON.stringify(newContent));
          setPopupContent(newContent.length > 0 ? newContent : "No routes found");
        }
        else {
          setPopupContent("No routes found");
        }
      });


  }


  //console.log('map center:', map.getCenter());
  //const centre = mapp.getCenter();
  //console.log(map.getZoom());
  
  if (mapp.getZoom() >= 15) {
    //console.log("happy")
    return (
      <>
        {stops.map((st) => {
          //console.log(stops);
          // Render the station
          const latd = 0.010;
          const lond = 0.030;
          if (Math.abs(st.lat-centre.lat) <= latd && Math.abs(st.lon-centre.lng) <= lond) { 
          return (
            <Marker
              key={st.id}
              position={[st.lat, st.lon]}
              icon={myIcon(st.type)}
              eventHandlers={{
                click: () => {
                  handlePopupOpen(st.id);
                },
              }}
            >
              <Popup>
                <strong>{st.name}</strong>
                <Popp content={popupContent} routes={routes} setRoutes={setRoutes}/>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </>
  );
  }
  else {
    //console.log("sad")
    return null;
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