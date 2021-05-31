import React, { useState } from 'react';
import useWebSocket from 'react-use-websocket';
import TimeAgo from 'react-timeago';
import { Table } from 'reactstrap';
import RTChart from 'react-rt-chart';
import Select from 'react-select';

const cityWiseAqiData = {};
const cityList = new Set();
const citySelectOptions = {};

// custom style for select options
const customStyles = {
  option: (provided, state) => ({
    ...provided,
    textAlign: 'left'
  })
}

// AQI range wise colour codes
const aqiColourCode = (number) => {
  switch(true) {
    case (number < 51):
      return "#008000";
    case (number < 101):
      return "#90EE90";
    case (number < 201):
      return "#90EE90";
    case (number < 301):
      return "#F4A460";
    case (number < 401):
      return "#FF000";
    case (number < 501):
      return "#8B0000";
    default:
      return "#FFFFFF";
  }
}

export const CityAqiIndex = () => {
  // confirguration data for chart
  let chartData = {
    data: {},
    chart: {
      axis: {
        y: {
          tick: {
            min: 0,
            max: 500
          }
        }
      },
      point: { show: true }
    },
    flow: { duration: 1000 }
  }

  const [selectedCities, setSelectedCities] = useState([]);
  const { lastMessage } = useWebSocket(process.env.REACT_APP_WEB_SOCKET_URL);

  // This will call everytime when Websocket server broadcast data
  if (lastMessage) {
    const parsedData = JSON.parse(lastMessage.data);
    const currentTime = Date().toLocaleString();

    parsedData.map((cityData, idx) => {
      // Update cityWiseAqiData data
      cityWiseAqiData[cityData.city] = {
        aqi: cityData.aqi.toFixed(2),
        time: currentTime
      };

      // Update citySelectionOptions
      cityList.add(cityData.city);
      citySelectOptions[cityData.city] = { value: cityData.city, label: cityData.city }
    })

    // Update chartData
    selectedCities.map((cityName, idx) => {
      chartData.data[cityName] = cityWiseAqiData[cityName].aqi
    });
    chartData.data.date = new Date(currentTime);
  }

  // handle city selection for graph
  const handleSelect = (selectedOptions) => {
    let cityNames = selectedOptions.map((option) => option.value );
    setSelectedCities(cityNames);
  }

  return (
    <div className="aqi-details">
      <div className="row">
        <div className="col-md-6">
          <h2 className="mt-3">City Wise AQI</h2>

          <Table bordered id="aqi-table">
            <thead>
              <tr>
                <th width="40%">City</th>
                <th width="20%">Current AQI</th>
                <th width="40%">Last Updated</th>
              </tr>
            </thead>

            <tbody>
              {
                [...cityList].sort().map((cityName) => {
                  return(
                    <tr>
                      <td>{cityName}</td>
                      <td style={{'background-color': aqiColourCode(cityWiseAqiData[cityName].aqi)}}>
                        {cityWiseAqiData[cityName].aqi}
                      </td>
                      <td><TimeAgo date={cityWiseAqiData[cityName].time} /></td>
                    </tr>
                  );
                })
              }
            </tbody>
          </Table>
        </div>

        <div className="col-md-6">
          <h2 className="mt-3">City Wise AQI Graph</h2>

          <div className="mt-5">
            <Select
              isMulti={true}
              placeholder="Select City"
              options={[...cityList].sort().map((city) => citySelectOptions[city])}
              onChange={handleSelect}
              styles={customStyles}
            />

            {
              selectedCities.length > 0 &&
              <RTChart
                className="mt-5"
                flow={ chartData.flow }
                chart={chartData.chart}
                fields={selectedCities}
                maxValues={5}
                data={chartData.data}
              />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityAqiIndex;