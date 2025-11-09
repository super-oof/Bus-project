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

const BUS_STOPS = 'https://tfe-opendata.com/api/v1/stops'
const LIVE_BUS = "https://tfe-opendata.com/api/v1/live_bus_times/";
const BUS_POS = "https://tfe-opendata.com/api/v1/vehicle_locations"

const COLOURS = {
  bus: "red",
  tram: "green"
}

const stopIcon = (colour = "red") =>
  L.divIcon({
    className: "bus-stop",
    html: `<div style="
      width:16px;height:16px;
      background:${COLOURS[colour] || "orange"};
      border-radius:50%;
      border:2px solid white;"></div>`,
    iconSize: [20,20]
  });


function PopupComponent({content, routes, fetchh, setPath}) {
  //console.log(typeof(content));
  if (typeof(content) == "string" || (content.hasOwnProperty('content'))) {
    //console.log("stringg");
    return (
      <div id="popupContent"><p>{content}</p></div>
    );
  }
  else {
    //setPath([]);
    //console.log(content[0].key);
    console.log("toilet ohio rizz");
    //console.log(content);
    //console.log(typeof(content));
    return (
      <>{
      content.map((st) => {
        //console.log(st.key);
        let timer = st.unixtime - Math.floor(Date.now() / 1000);
        timer = Math.round(timer/60);
        let timerOut = "";
        //console.log(typeof(timer));
        //console.log(content[0].key);
        if (timer==1) {timerOut="in 1 min"}
        else if (timer==0) {timerOut="due"}
        else if (timer<0) {timerOut="overdue"}
        else {timerOut= ("in "+timer+" mins")}
        return (
          <div class="bus" style={{whiteSpace: "nowrap"}}>
            <button onClick={() => fetchh(st.route, setPath)}>Hey!</button>
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

function VehicleComponent({path}) {
  if (path != []) {
    return (
      <>
        {path.map((b) => {
          console.log("hey");
          return (
            <Marker
              position={[b.lat, b.lon]}
              icon={stopIcon(b.colour)}
            >

            </Marker>
          )}
        )}
      </>
    )
  }
  else return (null);
}

function MarkerComponent() {
  const popupRef = useRef(null);
  const [popupContent, setPopupContent] = useState("Loading");
  const [centre, setCentre] = useState([55.95, -3.18]);
  const [zoom, setZoom] = useState(12);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]); //this is to let stops be updatable
  const [path, setPath] = useState([]);
  const mapp = useMap();
  //console.log(map.getZoom());


  useEffect(() => {
    //console.log("ftech");
    fetch(BUS_STOPS)
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
            key: key,
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

  function fetchVehicles(key) {
    console.log("fetching data");
    fetch(BUS_POS)
      .then((res) => res.json())
      .then((data) => {
        if (data != null) {
          const vehicles = data.vehicles.map((bus) => ({
            id: bus.service_name,
            lat: bus.latitude,
            lon: bus.longitude,
            color: "orange"
          }));
          const filteredVehicles = vehicles.filter((vehicle) => vehicle.id == key)
          console.log(filteredVehicles.length);
          setPath(filteredVehicles);
        }
        else {
          console.log("Erm ackshually");
        }
      })
  }
  /*const fetchVehicles = async (key) => {
    try {
      console.log("fetching data")
      console.log(key);
      const res = await fetch(BUS_POS);
      const data = await res.json();
      console.log(data);
        

      if (data?.vehicles) {
        // Filter based on the key (the bus stop ID) to fetch relevant vehicles
        console.log(data.vehicles[0].service_name);
        console.log(data.vehicles[1].service_name);
        let filteredVehicles = [];
        console.log(data.vehicles.length);

        for (let i=0; i< data.vehicles.length; i++) {
          let bus = data.vehicles[i];
          //console.log(bus.service_name);
          console.log(key);
          if (bus.service_name==key) {
            let entry = {
              lat: bus.latitude,
              lon: bus.longitude,
              color: "orange"
            }
            filteredVehicles.push(entry);
          }
        }
        console.log(filteredVehicles);
        setPath(filteredVehicles);
      }
      else {
        console.log("erm ackshually");
      }
    } catch (error) {
      console.error("Error fetching vehicle locations:", error);
    }
  };*/


  /*function fetchRoutes(route, setPath) {
    console.log("Fetching routes!!!");
    let word = BUS_POS;
    let newData = [];
    fetch(word)
    .then((res) => res.json())
    .then((data) => {
      
      if (data != null) {
        console.log(data.vehicles);
        //console.log(typeof(data.vehicles));
        let listt = data.vehicles;
        //console.log(typeof(listt));
        for (let i=0; i< listt.length; i++) {
          let bus = listt[i];
          //console.log(bus.service_name);
          if (bus.service_name==route) {
            let entry = {
              lat: bus.latitude,
              lon: bus.longitude,
              color: "orange"
            }
            newData.push(entry);
          }
        }
      }
      console.log("nd")
      console.log(newData);
      setPath(newData);
    })
    

  }*/

  //console.log('map center:', map.getCenter());
  //const centre = mapp.getCenter();
  //console.log(map.getZoom());
  
  if (mapp.getZoom() >= 15) {
    //console.log("happy")
    return (
      <>
        <VehicleComponent path={path}/>



        {
        
        stops.map((st) => {
            //console.log(stops);
            // Render the station
            const latd = 0.010;
            const lond = 0.030;
            if (Math.abs(st.lat-centre.lat) <= latd && Math.abs(st.lon-centre.lng) <= lond) { 
            return (
              <Marker
                key={st.id}
                position={[st.lat, st.lon]}
                icon={stopIcon(st.type)}
                eventHandlers={{
                  click: () => {
                    handlePopupOpen(st.id);
                  },
                }}
              >
                <Popup>
                  <strong>{st.name}</strong>
                  <PopupComponent content={popupContent} routes={routes} fetchh={fetchVehicles} setPath={setPath} />
                </Popup>
              </Marker>
            );
        }
        return null;
      })
      }
    </>
  );
  }
  else {
    //console.log("sad")
    return <VehicleComponent path={path}/>;
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

      <MarkerComponent />
      
      
    </MapContainer>
  )
}
//console.log(typeof(m.responseText))