import React, { Fragment, useState } from 'react'
import JSONPretty from 'react-json-prettify';
import QrReader from 'react-qr-reader'
const base45 = require('base45');
const pako = require('pako');
const cbor = require('cbor-js')

const qrPreviewSize = { 
  height: window.innerHeight-20,
  width: window.innerWidth-20,
  margin: 10
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...buffer]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

function App() {

  const [qrResult, changeQrResult] = useState()

  const handleScan = data => {
    // data = 'HC1:NCFOXN%TSMAHN-HRL4+/D1BPD9WXU4 E4LR5OGIDLFWKN:X97IIL:PAD6B27 NI4EFSYSG+SB.V Q5-L97K2AL8PZB$UH*%NH$RSC9VFF.C8::HB1M KP8EFH7A9JA5.BODM/AIJVC6LF691R*IN6R%E5BD7JG8CU6O8QGU68ORJSPZHQB27OSP1VPO P6V73EQE46VDPCSOWIRATQ+CR5YOM$P:97N95U/3J$ETG90OARH9P1J4HGZJKCHGX2MTDCZ.COMHW31S3Q:+P*.15-0U5P CO.45HOJ+PB/VSQOL9DLKWCZ3EBKDYGIZ J$XI4OIMEDTJCJKDLEDL9CZTAKBI/8D:8DKTDL+SA057*KB*KYQTKWT4S87WG4KVI9NWGND435:C9COQA584N%4D1Y5ZP6FFBV4LE%T+ZQVLBYF6U7T2AM+9S DVF4WVL63X32 1%S7D372BS5Y4W3IH$G89P/RRV505XALWE'
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
            switch (vaccineRecord["vp"]) {
              case "1119305005":
                formattedResult["Vaccine or prophylaxis used"] =  "SARS-CoV2 antigen vaccine"
                break;
              case "1119349007":
                formattedResult["Vaccine or prophylaxis used"] =  "7 SARS-CoV2 mRNA vaccine"
                break;
              case "J07BX03":
                formattedResult["Vaccine or prophylaxis used"] =  "covid-19 vaccines"
                break;            
              default:
                formattedResult["Vaccine or prophylaxis used"] = vaccineRecord["vp"]
                break;
            }
            
          }

          if (vaccineRecord["mp"]){
            //vaccine-medicinal-product.json
            const mp = vaccineRecord["mp"]

            switch (mp) {
              case "EU/1/20/1528":
                formattedResult["Vaccine Product"] = "Comirnaty"
                break;
              case "EU/1/20/1507":
                formattedResult["Vaccine Product"] = "Spikevax (previously COVID-19 Vaccine Moderna)"
                break;
              case "EU/1/21/1529":
                formattedResult["Vaccine Product"] = "Vaxzevria"
                break;
              case "EU/1/20/1525":
                formattedResult["Vaccine Product"] = "COVID-19 Vaccine Janssen"
                break;
              default:
                formattedResult["Vaccine Product"] = vaccineRecord["mp"]
                break;
            }
          }

          if (vaccineRecord["ma"]){
            //vaccine-mah-manf.json
            const maufacturer = vaccineRecord["ma"]
            switch (maufacturer) {
            case "ORG-100006270":
              formattedResult["Vaccine Manufacturer"] = "Curevac AG"
              break;
            case "ORG-100013793":
              formattedResult["Vaccine Manufacturer"] = "CanSino Biologics"
              break;
            case "ORG-100001699":
              formattedResult["Vaccine Manufacturer"] = "AstraZeneca AB"
              break;
            case "ORG-100030215":
              formattedResult["Vaccine Manufacturer"] = "Biontech Manufacturing GmbH"
              break;
            case "ORG-100001417":
              formattedResult["Vaccine Manufacturer"] = "Janssen-Cilag International"
              break;
            case "ORG-100031184":
              formattedResult["Vaccine Manufacturer"] = "Moderna Biotech Spain S.L."
              break;
            case "ORG-100020693":
              formattedResult["Vaccine Manufacturer"] = "China Sinopharm International Corp. - Beijing location"
              break;
            case "ORG100010771":
              formattedResult["Vaccine Manufacturer"] = "Sinopharm Weiqida Europe Pharmaceutical s.r.o. - Prague location"
              break;
            case "ORG100024420":
              formattedResult["Vaccine Manufacturer"] = "Sinopharm Zhijun (Shenzhen) Pharmaceutical Co. Ltd. - Shenzhen location"
              break;
            case "ORG100032020":
              formattedResult["Vaccine Manufacturer"] = "Novavax CZ AS"
              break;
            case "ORG100001981":
              formattedResult["Vaccine Manufacturer"] = "Serum Institute Of India Private Limited"
              break;
            default:
              formattedResult["Vaccine Manufacturer"] = vaccineRecord["ma"]
              break;
            }            
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
