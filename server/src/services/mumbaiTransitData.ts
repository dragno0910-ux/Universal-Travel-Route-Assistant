import { Place } from '../types/shared';

export interface TransitStation {
  id: string;
  name: string;
  network: 'Western Railway' | 'Central Railway' | 'Harbour Railway' | 'Metro Line 1' | 'Metro Line 2A' | 'Metro Line 7' | 'Metro Line 3' | 'Bus' | 'Airport' | 'Landmark';
  line: string;
  lat: number;
  lng: number;
  sequence: number;
  isInterchange: boolean;
  accessible: boolean;
  connectingLines?: string[];
  platformInfo?: string;
  tips?: string;
}

export const MUMBAI_STATIONS: TransitStation[] = [
  // --- MUMBAI METRO LINE 7 (RED LINE: Dahisar East to Gundavali / Andheri East) ---
  { id: 'm7_gundavali', name: 'Gundavali (Andheri East)', network: 'Metro Line 7', line: 'Line 7', lat: 19.1171, lng: 72.8562, sequence: 14, isInterchange: true, accessible: true, connectingLines: ['Western Express Highway Metro Line 1', 'Western Railway Andheri'], platformInfo: 'Platform 1 (Northbound to Dahisar)', tips: 'Equipped with elevators and tactile flooring. Footbridge connects to Line 1 Western Express Highway.' },
  { id: 'm7_mogra', name: 'Mogra', network: 'Metro Line 7', line: 'Line 7', lat: 19.1275, lng: 72.8550, sequence: 13, isInterchange: false, accessible: true },
  { id: 'm7_jogeshwari_e', name: 'Jogeshwari East', network: 'Metro Line 7', line: 'Line 7', lat: 19.1362, lng: 72.8542, sequence: 12, isInterchange: false, accessible: true },
  { id: 'm7_goregaon_e', name: 'Aarey / Goregaon East', network: 'Metro Line 7', line: 'Line 7', lat: 19.1554, lng: 72.8546, sequence: 11, isInterchange: true, accessible: true, connectingLines: ['Metro Line 3 (Aarey JVLR)'], tips: 'Close to Western Express Highway and Aarey colony entrance.' },
  { id: 'm7_dindoshi', name: 'Dindoshi', network: 'Metro Line 7', line: 'Line 7', lat: 19.1724, lng: 72.8559, sequence: 10, isInterchange: false, accessible: true },
  { id: 'm7_borivali_e', name: 'Devipada (Borivali East)', network: 'Metro Line 7', line: 'Line 7', lat: 19.2230, lng: 72.8610, sequence: 5, isInterchange: false, accessible: true },
  { id: 'm7_dahisar_e', name: 'Dahisar East', network: 'Metro Line 7', line: 'Line 7', lat: 19.2562, lng: 72.8631, sequence: 1, isInterchange: true, accessible: true, connectingLines: ['Metro Line 2A'] },

  // --- MUMBAI METRO LINE 1 (BLUE LINE: Versova - Andheri - Ghatkopar) ---
  { id: 'm1_versova', name: 'Versova', network: 'Metro Line 1', line: 'Line 1', lat: 19.1317, lng: 72.8173, sequence: 1, isInterchange: false, accessible: true },
  { id: 'm1_dn_nagar', name: 'D.N. Nagar', network: 'Metro Line 1', line: 'Line 1', lat: 19.1308, lng: 72.8277, sequence: 2, isInterchange: true, accessible: true, connectingLines: ['Metro Line 2A (Andheri West)'], tips: 'Major junction to change from Line 1 to Line 2A.' },
  { id: 'm1_azad_nagar', name: 'Azad Nagar', network: 'Metro Line 1', line: 'Line 1', lat: 19.1298, lng: 72.8373, sequence: 3, isInterchange: false, accessible: true },
  { id: 'm1_andheri', name: 'Andheri Metro', network: 'Metro Line 1', line: 'Line 1', lat: 19.1207, lng: 72.8464, sequence: 4, isInterchange: true, accessible: true, connectingLines: ['Western Railway Andheri', 'Harbour Railway Andheri'], platformInfo: 'Platform 1 (to Ghatkopar), Platform 2 (to Versova)', tips: 'High footfall. Direct skywalk links Metro station to Western Railway Platform 8/9.' },
  { id: 'm1_weh', name: 'Western Express Highway', network: 'Metro Line 1', line: 'Line 1', lat: 19.1158, lng: 72.8558, sequence: 5, isInterchange: true, accessible: true, connectingLines: ['Metro Line 7 Gundavali'] },
  { id: 'm1_chakala', name: 'Chakala (J.B. Nagar)', network: 'Metro Line 1', line: 'Line 1', lat: 19.1118, lng: 72.8654, sequence: 6, isInterchange: false, accessible: true },
  { id: 'm1_airport_road', name: 'Airport Road', network: 'Metro Line 1', line: 'Line 1', lat: 19.1098, lng: 72.8752, sequence: 7, isInterchange: false, accessible: true, tips: '5-minute auto rickshaw ride or bus connection to CSMIA International Terminal 2.' },
  { id: 'm1_marol_naka', name: 'Marol Naka', network: 'Metro Line 1', line: 'Line 1', lat: 19.1090, lng: 72.8828, sequence: 8, isInterchange: true, accessible: true, connectingLines: ['Metro Line 3 Underground'] },
  { id: 'm1_saki_naka', name: 'Saki Naka', network: 'Metro Line 1', line: 'Line 1', lat: 19.1030, lng: 72.8885, sequence: 9, isInterchange: false, accessible: true },
  { id: 'm1_ghatkopar', name: 'Ghatkopar Metro', network: 'Metro Line 1', line: 'Line 1', lat: 19.0863, lng: 72.9080, sequence: 12, isInterchange: true, accessible: true, connectingLines: ['Central Railway Ghatkopar'], tips: 'Direct transfer bridge to Central Railway local trains towards Thane/Kalyan or CSMT.' },

  // --- MUMBAI METRO LINE 3 (AQUA LINE: Underground) ---
  { id: 'm3_aarey', name: 'Aarey JVLR', network: 'Metro Line 3', line: 'Line 3', lat: 19.1415, lng: 72.8770, sequence: 1, isInterchange: false, accessible: true },
  { id: 'm3_seepz', name: 'SEEPZ', network: 'Metro Line 3', line: 'Line 3', lat: 19.1290, lng: 72.8790, sequence: 2, isInterchange: false, accessible: true },
  { id: 'm3_marol', name: 'Marol Naka Underground', network: 'Metro Line 3', line: 'Line 3', lat: 19.1092, lng: 72.8830, sequence: 4, isInterchange: true, accessible: true, connectingLines: ['Metro Line 1'] },
  { id: 'm3_csmia_t2', name: 'CSMIA Terminal 2 Metro', network: 'Metro Line 3', line: 'Line 3', lat: 19.0910, lng: 72.8680, sequence: 5, isInterchange: false, accessible: true, tips: 'Direct underground access to Mumbai Airport Terminal 2 Departures & Arrivals.' },
  { id: 'm3_csmia_t1', name: 'CSMIA Terminal 1 Metro', network: 'Metro Line 3', line: 'Line 3', lat: 19.0915, lng: 72.8520, sequence: 6, isInterchange: false, accessible: true, tips: 'Direct underground access to Domestic Terminal 1.' },
  { id: 'm3_bkc', name: 'BKC Metro', network: 'Metro Line 3', line: 'Line 3', lat: 19.0660, lng: 72.8680, sequence: 9, isInterchange: false, accessible: true, tips: 'Centrally located inside Bandra-Kurla Complex business district.' },

  // --- WESTERN RAILWAY (LOCAL TRAINS) ---
  { id: 'wr_churchgate', name: 'Churchgate', network: 'Western Railway', line: 'Western Line', lat: 18.9355, lng: 72.8277, sequence: 1, isInterchange: false, accessible: true, platformInfo: 'Terminal station. All trains depart North towards Borivali/Virar.', tips: 'Southern terminus. Easy to get seats off-peak. UTS mobile app and ATVM ticket kiosks on concourse.' },
  { id: 'wr_marine_lines', name: 'Marine Lines', network: 'Western Railway', line: 'Western Line', lat: 18.9443, lng: 72.8242, sequence: 2, isInterchange: false, accessible: false },
  { id: 'wr_charni_road', name: 'Charni Road (Girgaon Chowpatty)', network: 'Western Railway', line: 'Western Line', lat: 18.9515, lng: 72.8189, sequence: 3, isInterchange: false, accessible: false, tips: 'Closest station to Girgaon Chowpatty beach.' },
  { id: 'wr_grant_road', name: 'Grant Road', network: 'Western Railway', line: 'Western Line', lat: 18.9630, lng: 72.8164, sequence: 4, isInterchange: false, accessible: false },
  { id: 'wr_mumbai_central', name: 'Mumbai Central', network: 'Western Railway', line: 'Western Line', lat: 18.9696, lng: 72.8194, sequence: 5, isInterchange: true, accessible: true, connectingLines: ['National Long-Distance Trains'], tips: 'Major railway junction. Escalators on main concourse.' },
  { id: 'wr_mahalaxmi', name: 'Mahalaxmi', network: 'Western Railway', line: 'Western Line', lat: 18.9827, lng: 72.8239, sequence: 6, isInterchange: false, accessible: false, tips: 'Walk to Mahalaxmi Racecourse & Dhobi Ghat viewing deck.' },
  { id: 'wr_lower_parel', name: 'Lower Parel', network: 'Western Railway', line: 'Western Line', lat: 18.9950, lng: 72.8300, sequence: 7, isInterchange: false, accessible: false, tips: 'Access to Phoenix Palladium Mall and corporate offices in Kamala Mills.' },
  { id: 'wr_dadar', name: 'Dadar Western', network: 'Western Railway', line: 'Western Line', lat: 19.0178, lng: 72.8428, sequence: 9, isInterchange: true, accessible: true, connectingLines: ['Central Railway Dadar'], platformInfo: 'Western Line platforms 1 to 7', tips: 'Busiest railway hub in Mumbai. Stay alert with luggage. Use wide north bridge for easier transfer.' },
  { id: 'wr_bandra', name: 'Bandra', network: 'Western Railway', line: 'Western Line', lat: 19.0544, lng: 72.8406, sequence: 12, isInterchange: true, accessible: true, connectingLines: ['Harbour Railway Bandra'], platformInfo: 'Platforms 1-7', tips: 'Heritage station building. Easy auto rickshaws on Bandra East (to BKC) and Bandra West (to Bandstand).' },
  { id: 'wr_santacruz', name: 'Santacruz', network: 'Western Railway', line: 'Western Line', lat: 19.0815, lng: 72.8400, sequence: 14, isInterchange: false, accessible: false },
  { id: 'wr_vile_parle', name: 'Vile Parle', network: 'Western Railway', line: 'Western Line', lat: 19.0988, lng: 72.8439, sequence: 15, isInterchange: false, accessible: false, tips: 'Vile Parle East is close to Domestic Airport T1.' },
  { id: 'wr_andheri', name: 'Andheri Western', network: 'Western Railway', line: 'Western Line', lat: 19.1197, lng: 72.8466, sequence: 16, isInterchange: true, accessible: true, connectingLines: ['Metro Line 1', 'Harbour Railway Andheri'], platformInfo: 'Platform 8/9 connects directly to Metro Line 1 elevated skywalk.', tips: 'Major transport hub with fast local trains to Churchgate and Borivali/Virar.' },
  { id: 'wr_goregaon', name: 'Goregaon', network: 'Western Railway', line: 'Western Line', lat: 19.1645, lng: 72.8492, sequence: 18, isInterchange: true, accessible: true, connectingLines: ['Harbour Line Terminus'] },
  { id: 'wr_borivali', name: 'Borivali', network: 'Western Railway', line: 'Western Line', lat: 19.2290, lng: 72.8570, sequence: 21, isInterchange: true, accessible: true, tips: 'Major origin station for Southbound Churchgate Fast Locals. Guaranteed seat if boarding starting trains.' },

  // --- CENTRAL RAILWAY (LOCAL TRAINS) ---
  { id: 'cr_csmt', name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', network: 'Central Railway', line: 'Central Line', lat: 18.9400, lng: 72.8354, sequence: 1, isInterchange: true, accessible: true, connectingLines: ['Harbour Railway CSMT', 'National Rail'], tips: 'UNESCO World Heritage monument. Suburban platforms 1-7. Main hall has tourist help desk.' },
  { id: 'cr_byculla', name: 'Byculla', network: 'Central Railway', line: 'Central Line', lat: 18.9750, lng: 72.8335, sequence: 4, isInterchange: false, accessible: true },
  { id: 'cr_currey_road', name: 'Currey Road', network: 'Central Railway', line: 'Central Line', lat: 18.9940, lng: 72.8310, sequence: 6, isInterchange: false, accessible: false },
  { id: 'cr_dadar', name: 'Dadar Central', network: 'Central Railway', line: 'Central Line', lat: 19.0185, lng: 72.8435, sequence: 8, isInterchange: true, accessible: true, connectingLines: ['Western Railway Dadar'], tips: 'Cross-platform transfer to Western line available via overbridge.' },
  { id: 'cr_kurla', name: 'Kurla Junction', network: 'Central Railway', line: 'Central Line', lat: 19.0652, lng: 72.8794, sequence: 11, isInterchange: true, accessible: true, connectingLines: ['Harbour Railway Kurla'] },
  { id: 'cr_ghatkopar', name: 'Ghatkopar Central', network: 'Central Railway', line: 'Central Line', lat: 19.0860, lng: 72.9082, sequence: 13, isInterchange: true, accessible: true, connectingLines: ['Metro Line 1 Ghatkopar'], tips: 'High volume transfer station. Escalators connect directly to Metro Line 1 concourse.' },
  { id: 'cr_thane', name: 'Thane', network: 'Central Railway', line: 'Central Line', lat: 19.1860, lng: 72.9759, sequence: 19, isInterchange: true, accessible: true, connectingLines: ['Trans-Harbour Line Navi Mumbai'] }
];

export const MUMBAI_LANDMARKS: Place[] = [
  {
    id: 'lm_airport_t2',
    name: 'CSMIA Mumbai International Airport (T2)',
    displayName: 'Chhatrapati Shivaji Maharaj International Airport Terminal 2, Sahar',
    lat: 19.0896,
    lng: 72.8656,
    type: 'airport',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_airport_t1',
    name: 'CSMIA Domestic Airport (T1)',
    displayName: 'Terminal 1 Domestic Airport, Santacruz East',
    lat: 19.0915,
    lng: 72.8520,
    type: 'airport',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_gateway_of_india',
    name: 'Gateway of India',
    displayName: 'Gateway of India & Taj Mahal Palace, Colaba',
    lat: 18.9220,
    lng: 72.8347,
    type: 'landmark',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_marine_drive',
    name: 'Marine Drive (Queen\'s Necklace)',
    displayName: 'Marine Drive Promenade, Nariman Point / Churchgate',
    lat: 18.9432,
    lng: 72.8231,
    type: 'landmark',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_bkc',
    name: 'Bandra-Kurla Complex (BKC)',
    displayName: 'Bandra-Kurla Complex Financial & Commercial Hub',
    lat: 19.0660,
    lng: 72.8680,
    type: 'commercial',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_bandra_bandstand',
    name: 'Bandra Bandstand & Fort',
    displayName: 'Bandstand Promenade, Bandra West',
    lat: 19.0435,
    lng: 72.8194,
    type: 'landmark',
    city: 'Mumbai',
    accessibility: false
  },
  {
    id: 'lm_juhu_beach',
    name: 'Juhu Beach',
    displayName: 'Juhu Beach & Food Stalls, Vile Parle West',
    lat: 19.0988,
    lng: 72.8264,
    type: 'landmark',
    city: 'Mumbai',
    accessibility: false
  },
  {
    id: 'lm_siddhivinayak',
    name: 'Siddhivinayak Temple',
    displayName: 'Shree Siddhivinayak Temple, Prabhadevi',
    lat: 19.0169,
    lng: 72.8306,
    type: 'landmark',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_csmt_station',
    name: 'CSMT Railway Station',
    displayName: 'Chhatrapati Shivaji Maharaj Terminus (VT), Fort',
    lat: 18.9400,
    lng: 72.8354,
    type: 'railway_station',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_dadar_station',
    name: 'Dadar Station (Central & Western)',
    displayName: 'Dadar Railway Station Central & Western Junction',
    lat: 19.0178,
    lng: 72.8428,
    type: 'railway_station',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_lower_parel_mills',
    name: 'Lower Parel / High Street Phoenix',
    displayName: 'High Street Phoenix & Palladium, Lower Parel',
    lat: 18.9930,
    lng: 72.8250,
    type: 'commercial',
    city: 'Mumbai',
    accessibility: true
  },
  {
    id: 'lm_powai_iit',
    name: 'Powai (IIT Bombay & Hiranandani)',
    displayName: 'Hiranandani Gardens & IIT Bombay, Powai',
    lat: 19.1176,
    lng: 72.9060,
    type: 'locality',
    city: 'Mumbai',
    accessibility: true
  }
];

// Official Mumbai RTO Fare Rules (Updated Tariff)
export const MUMBAI_FARES = {
  autoRickshaw: {
    baseFare: 23, // First 1.5 km
    baseDistanceKm: 1.5,
    perKmRate: 15.33,
    nightChargeMultiplier: 1.25 // 25% extra between 12:00 AM - 5:00 AM
  },
  kaaliPeeliTaxi: {
    baseFare: 28, // First 1.5 km
    baseDistanceKm: 1.5,
    perKmRate: 18.66,
    nightChargeMultiplier: 1.25
  },
  appCab: {
    baseFare: 60,
    perKmRate: 24,
    surgeMultiplier: 1.0
  },
  localTrain: {
    secondClassBase: 5,
    secondClassMax: 15,
    firstClassBase: 50,
    firstClassMax: 140,
    acLocalBase: 35,
    acLocalMax: 110
  },
  metro: {
    minFare: 10,
    maxFare: 50
  },
  bestBus: {
    ordinaryBase: 6,
    acElectricBase: 6
  }
};

/**
 * Calculates official Mumbai Auto Rickshaw fare based on distance (km)
 */
export function calculateAutoFare(distanceKm: number, isNight: boolean = false): number {
  const { baseFare, baseDistanceKm, perKmRate, nightChargeMultiplier } = MUMBAI_FARES.autoRickshaw;
  let fare = baseFare;
  if (distanceKm > baseDistanceKm) {
    fare += (distanceKm - baseDistanceKm) * perKmRate;
  }
  if (isNight) {
    fare *= nightChargeMultiplier;
  }
  return Math.round(fare);
}

/**
 * Calculates official Mumbai Black & Yellow Taxi (Kaali Peeli) fare based on distance (km)
 */
export function calculateTaxiFare(distanceKm: number, isNight: boolean = false): number {
  const { baseFare, baseDistanceKm, perKmRate, nightChargeMultiplier } = MUMBAI_FARES.kaaliPeeliTaxi;
  let fare = baseFare;
  if (distanceKm > baseDistanceKm) {
    fare += (distanceKm - baseDistanceKm) * perKmRate;
  }
  if (isNight) {
    fare *= nightChargeMultiplier;
  }
  return Math.round(fare);
}

/**
 * Calculates App Cab (Uber/Ola) fare estimate
 */
export function calculateAppCabFare(distanceKm: number): number {
  const { baseFare, perKmRate } = MUMBAI_FARES.appCab;
  return Math.round(baseFare + distanceKm * perKmRate);
}
