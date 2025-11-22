import { emptyUnixfs, emptyCar } from '@simplepg/common';
import { DService } from '@simplepg/common';
import { CID } from 'multiformats/cid';
import { CarBlock } from "cartonne";

const HOST_DOMAIN = 'new.simplepage.eth';
const DATA_DOMAIN = 'data0.simplebounty.eth';

// Global singleton DService instance
let dserviceInstance = null;
let dserviceInitialized = false;

/**
 * Gets or creates the singleton DService instance.
 * Initializes it if not already initialized.
 * 
 * @param {Object} viemClient - Viem public client for blockchain interactions
 * @returns {Promise<DService>} The initialized DService instance
 */
async function getDService(viemClient) {
  if (!dserviceInstance) {
    dserviceInstance = new DService(HOST_DOMAIN);
  }
  
  // Initialize if not already initialized and we have a client
  if (viemClient && !dserviceInitialized) {
    await dserviceInstance.init(viemClient);
    dserviceInitialized = true;
  }
  
  return dserviceInstance;
}

/**
 * Creates a CAR (Content Addressable aRchive) file containing text data.
 * The CAR file is used to store data in IPFS-compatible format.
 * 
 * @param {string} text - The text content to include in the CAR file
 * @returns {Promise<{car: Object, rootCid: CID}>} The CAR file object and root CID
 */
export async function createCar(text) {
  // Create an empty UnixFS instance
  const { fs, blockstore } = emptyUnixfs();

  const bytes = new TextEncoder().encode(text);
  const cid = await fs.addBytes(bytes);
  const block = await blockstore.get(cid);
  // Create an empty CAR file with the root CID
  const car = emptyCar();
  car.roots = [cid];
  car.blocks.put(new CarBlock(cid, new Uint8Array(block)));
  
  return car;
}

/**
 * Uploads a CAR file to dservice.
 * The CAR file is uploaded to the SimplePage dservice endpoint for the data domain.
 * 
 * @param {Object} dservice - DService instance with initialized fetch method
 * @param {Object} car - CAR file object with bytes property
 * @returns {Promise<CID>} The CID of the uploaded content
 */
export async function uploadCarToDservice(dservice, car) {
  // Create a FormData object and append the CAR file
  const formData = new FormData();
  formData.append('file', new Blob([car.bytes], {
    type: 'application/vnd.ipld.car',
  }), 'site.car');

  // POST the CAR file to the API using FormData
  const response = await dservice.fetch(`/page?domain=${encodeURIComponent(DATA_DOMAIN)}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return CID.parse(result.cid);
}

/**
 * Uploads text data to dservice by creating a CAR file and uploading it.
 * This is the main function used to upload bounty descriptions and claim data.
 * 
 * @param {string} textData - The text data to upload
 * @param {Object} viemClient - Viem public client for blockchain interactions
 * @returns {Promise<CID>} The CID of the uploaded content
 */
export async function uploadTextData(textData, viemClient) {
  const dservice = await getDService(viemClient);

  // Create CAR file with the text data
  const car = await createCar(textData);
  
  // Upload the CAR file
  return uploadCarToDservice(dservice, car);
}

/**
 * Converts a CID to bytes32 by extracting the multihash digest.
 * The multihash digest is the actual hash bytes (32 bytes for SHA-256).
 * Note: multihash.bytes includes the code and length prefix, so we use .digest instead.
 * 
 * @param {CID} cid - The CID to convert
 * @returns {string} The digest bytes as a hex string (0x...), padded to 32 bytes if needed
 */
export function cidToBytes32(cid) {
  // Log the full cid bytes as hex
  if (cid.bytes) {
    const cidHex = '0x' + Array.from(cid.bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log('[cidToBytes32] CID bytes (hex):', cidHex);
  } else {
    console.warn('[cidToBytes32] CID object does not have a .bytes property');
  }

  // Log the codec
  console.log('[cidToBytes32] codec:', cid.code ? cid.code : cid.codec ? cid.codec : '(unknown)');

  const digest = cid.multihash.digest;

  // Validate that we have a 32-byte digest (SHA-256)
  if (digest.length !== 32) {
    throw new Error(`Expected 32-byte digest, got ${digest.length} bytes. Hash code: ${cid.multihash.code}`);
  }

  // Convert Uint8Array to hex string
  // viem expects hex strings for bytes32
  return '0x' + Array.from(digest)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a bytes32 hash back to a CID.
 * This reverses the process of cidToBytes32 by prepending the CID prefix.
 * The hash is already the SHA-256 digest, so we just prepend: 0x01 (CIDv1) + 0x55 (raw codec) + 0x12 (sha2-256) + 0x20 (32 bytes)
 * 
 * @param {string} hashHex - The bytes32 hash as a hex string (0x...)
 * @returns {CID} The reconstructed CID
 */
export function bytes32ToCid(hashHex) {
  // Remove 0x prefix if present
  const hash = hashHex.startsWith('0x') ? hashHex.slice(2) : hashHex;
  
  // Convert hex string to Uint8Array
  const hashBytes = new Uint8Array(
    hash.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );

  if (hashBytes.length !== 32) {
    throw new Error(`Expected 32-byte hash, got ${hashBytes.length} bytes`);
  }

  // Prepend CID prefix: 0x01 (CIDv1) + 0x55 (raw codec) + 0x12 (sha2-256) + 0x20 (32 bytes)
  const cidBytes = new Uint8Array([0x01, 0x55, 0x12, 0x20, ...hashBytes]);
  
  // Parse the CID from bytes
  const cid = CID.decode(cidBytes);
  
  return cid;
}

/**
 * Fetches text data from dservice using the file API.
 * The hash is converted to a CID, then the raw IPFS block is fetched and decoded as text.
 * 
 * @param {string} hashHex - The bytes32 hash as a hex string (0x...)
 * @param {Object} viemClient - Viem public client for blockchain interactions
 * @returns {Promise<string>} The text content
 */
export async function fetchTextData(hashHex, viemClient) {
  if (!hashHex || hashHex === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Invalid hash: empty or zero hash');
  }

  // Convert bytes32 hash to CID
  const cid = bytes32ToCid(hashHex);
  
  // Get singleton dservice instance
  const dservice = await getDService(viemClient);

  // Fetch the raw IPFS block using GET /file?cid=...
  const response = await dservice.fetch(`/file?cid=${encodeURIComponent(cid.toString())}`, {
    method: 'GET',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('File not found on dservice');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Get the raw block data
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Decode as UTF-8 text
  const text = new TextDecoder().decode(uint8Array);
  
  return text;
}

