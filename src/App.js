import React, { Fragment, useState } from 'react'
import JSONPretty from 'react-json-prettify'
import QrReader from 'react-qr-reader'
import vaccineProphylaxis from './data/vaccine-prophylaxis.json'
import medicialProduct from './data/vaccine-medicinal-product.json'
import vaccineManufacturer from './data/vaccine-mah-manf.json'

const base45 = require('base45');
const pako = require('pako');
const cbor = require('cbor-js')


const qrPreviewSize = { 
  height: window.innerHeight-20,
  width: window.innerWidth-20,
  margin: 10
}

// included this as a debugging tool to help in conversion
function buf2hex(buffer) { 
  return [...buffer]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

function App() {

  const [qrResult, changeQrResult] = useState()

  const handleScan = data => {
    if (data) {

      let b45EncodedData = data.replace("HC1:", "")      
      let b45DecodedData = base45.decode(b45EncodedData)      
      let token = pako.inflate(b45DecodedData)     
      
      let outerdata = cbor.decode(token.buffer)[2]

      let hex = buf2hex(outerdata)
      let innerData = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
      })).buffer

      let unFormattedResult = cbor.decode(innerData)

      let formattedResult = {

      }

      if (unFormattedResult["1"]){
        formattedResult["Issuing Country"] = unFormattedResult["1"];
      }

      if (unFormattedResult["-260"] && unFormattedResult["-260"]["1"]){
        let record = unFormattedResult["-260"]["1"]
        formattedResult["Date Of Birth"] = record["dob"];

        if (record["nam"]){
          let nameRecord = record["nam"]
          if (nameRecord["fn"]){
            formattedResult["Surname"] = nameRecord["fn"]
          }
          if (nameRecord["gn"]){
            formattedResult["Forename(s)"] = nameRecord["gn"]
          }

        }        

        if (record["v"]){
          // taken from: https://ec.europa.eu/health/sites/default/files/ehealth/docs/covid-certificate_json_specification_en.pdf
          // and: https://ec.europa.eu/health/sites/default/files/ehealth/docs/digital-green-value-sets_en.pdf

          let vaccineRecord = record["v"][0]

          if (vaccineRecord["tg"]){
            //disease-agent-targeted.json
            switch (vaccineRecord["tg"]) {
              case "840539006":
                formattedResult["Disease or agent targeted"] =  "COVID19"
                break;
            
              default:
                formattedResult["Disease or agent targeted"] = vaccineRecord["tg"]
                break;
            }
          }

          if (vaccineRecord["vp"]){
            //vaccine-prophylaxis.json
            const vp = vaccineRecord["vp"]
            formattedResult["Vaccine or prophylaxis used"] = vp in vaccineProphylaxis ? vaccineProphylaxis[vp] : vp            
          }

          if (vaccineRecord["mp"]){
            //vaccine-medicinal-product.json
            const mp = vaccineRecord["mp"]
            formattedResult["Vaccine Product"] = mp in medicialProduct ? medicialProduct[mp] : mp                        
          }

          if (vaccineRecord["ma"]){
            //vaccine-mah-manf.json
            const ma = vaccineRecord["ma"]
            formattedResult["Vaccine Manufacturer"] = ma in vaccineManufacturer ? vaccineManufacturer["ma"] : ma
                 
          }

          if (vaccineRecord["dn"]){
            formattedResult["Total Number of Administered Doses"] = vaccineRecord["dn"]
          }

          if (vaccineRecord["sd"]){
            formattedResult["Total Number of Expected Doses"] = vaccineRecord["sd"]
          }

          if (vaccineRecord["dt"]){
            formattedResult["Date of Vaccination"] = vaccineRecord["dt"]
          }

          if (vaccineRecord["co"]){
            formattedResult["Country where vaccine administered"] = vaccineRecord["co"]
          }

          if (vaccineRecord["is"]){
            formattedResult["Certificate Issuer"] = vaccineRecord["is"]
          }

          if (vaccineRecord["ci"]){
            formattedResult["Certificate Identifier"] = vaccineRecord["ci"]
          }

        }
      }

      changeQrResult(<JSONPretty json={formattedResult} />)
      

    }
  }

  const handleError = err => {
    console.error(err)
  }


  return <Fragment>
    <h2>EU Covid Vaccine Scanner</h2>
    <div>
        <p>{qrResult ? <Fragment>
          {qrResult}
          <br />
          <p>To scan again please reload webpage...</p>
        </Fragment>  : <QrReader
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={qrPreviewSize}
        />}</p>
        
        
      </div>
      <div>
        
      </div>
    </Fragment>
  ;
}

export default App;
