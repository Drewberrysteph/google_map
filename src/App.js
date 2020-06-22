import React from "react"

import "@reach/combobox/styles.css"

import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api"
import geohash from "ngeohash"
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete"
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox"

import "@reach/combobox/styles.css"

const libraries = ["places"]
const mapContainerStyle = {
  height: "100vh",
}

const center = {
  lat: 12.879721,
  lng: 121.774017,
}

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "",
    libraries,
  })
  const [markers, setMarkers] = React.useState([])
  const [ghash, setGhash] = React.useState()

  const onMapClick = React.useCallback(e => {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    const newGhash = geohash.encode(lat, lng)
    setMarkers({ lat, lng })
    setGhash(newGhash)
  }, [])

  const mapRef = React.useRef()
  const onMapLoad = React.useCallback(map => {
    mapRef.current = map
  }, [])

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng })
    mapRef.current.setZoom(15)
  }, [])

  if (loadError) return "Error"
  if (!isLoaded)
    return (
      <div className="centerLoader">
        <p>Loading...</p>
      </div>
    )

  const handleSubmit = () => {
    const loc = { ...markers, ghash }
    console.log(loc)
  }

  return (
    <div className="google_map">
      <Locate panTo={panTo} />
      {isLoaded && <Search panTo={panTo} />}
      <GoogleMap
        id="map"
        mapContainerStyle={mapContainerStyle}
        zoom={6}
        center={center}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        <Marker
          key={`${markers.lat}-${markers.lng}`}
          position={{
            lat: parseFloat(markers.lat),
            lng: parseFloat(markers.lng),
          }}
        />
      </GoogleMap>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}

function Locate({ panTo }) {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          position => {
            panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          () => null
        )
      }}
    >
      <img src="/compass.svg" alt="compass" />
    </button>
  )
}

function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 12.879721, lng: () => 121.774017 },
      radius: null,
    },
  })

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest

  const handleInput = e => {
    setValue(e.target.value)
  }

  const handleSelect = async address => {
    setValue(address, false)
    clearSuggestions()

    try {
      const results = await getGeocode({ address })
      const { lat, lng } = await getLatLng(results[0])
      panTo({ lat, lng })
    } catch (error) {
      console.log("😱 Error: ", error.message)
    }
  }

  return (
    <div className="search">
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Search location"
        />
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  )
}
