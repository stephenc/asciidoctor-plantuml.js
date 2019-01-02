// Adapted from https://github.com/kujirahand/node-png-metadata/blob/master/src/lib/png-metadata.js
// Fix an iteration issue in the 'joinChunk' function

// PNG File format: https://en.wikipedia.org/wiki/Portable_Network_Graphics#File_format
const PNG_SIG = String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)

// check PNG signature
const isPNG = function (str) {
  const sig = str.substr(0, 8)
  return (sig === PNG_SIG)
}

const extractChunks = function (str) {
  // read signature
  const sig = str.substr(0, 8)
  if (!isPNG(sig)) return false
  str = str.substr(8) // chomp sig
  const chunks = []
  // read chunk list
  while (str !== '') {
    const chunk = {}
    // read chunk size
    let size = stoi(str.substr(0, 4))
    if (size < 0) {
      // If the size is negative, the data is likely corrupt, but we'll let
      // the caller decide if any of the returned chunks are usable.
      // We'll move forward in the file with the minimum chunk length (12 bytes).
      size = 0
    }
    const buf = str.substr(0, size + 12)
    str = str.substr(size + 12) // delete this chunk
    // read chunk data
    chunk.size = size
    chunk.type = buf.substr(4, 4)
    chunk.data = buf.substr(8, size)
    chunk.crc = stoi(buf.substr(8 + size, 4))
    // add chunk
    chunks.push(chunk)
  }
  return chunks
}

const joinChunks = function (chunks) {
  let pf = PNG_SIG
  for (let chunk of chunks) {
    let buf = ''
    buf += itos(chunk.size, 4)
    buf += chunk.type
    buf += chunk.data
    buf += itos(chunk.crc, 4)
    pf += buf
  }
  return pf
}

const itos = (v, size) => {
  let a = []
  let t = size - 1
  while (t >= 0) {
    a[t--] = v & 0xFF
    v = v >> 8
  }
  a = a.map(function (v) {
    return String.fromCharCode(v)
  })
  return a.join('')
}

const stoi = (str) => {
  let v = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    v = (v << 8) | (c & 0xFF)
  }
  return v
}

const removeAncillaryChunks = str => {
  const chunks = extractChunks(str)
  // keep only the critical chunks (ie. remove all the ancillary chunks)
  const criticalChunks = chunks.filter(chunk => chunk.type === 'IHDR' || chunk.type === 'PLTE' || chunk.type === 'IDAT' || chunk.type === 'IEND')
  return joinChunks(criticalChunks)
}

module.exports = {
  removeAncillaryChunks
}
