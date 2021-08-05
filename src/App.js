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

      let result = cbor.decode(innerData)
      changeQrResult(<JSONPretty json={result} />)
      

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
