import axios from 'axios';
import { RouteRequest, RouteOption, ItineraryLeg, Place, Coordinates, TravelMode, RouteCalculationResponse } from '../types/shared';
import { geocodingService } from './geocodingService';
import { MUMBAI_STATIONS, TransitStation, calculateAutoFare, calculateTaxiFare, calculateAppCabFare } from './mumbaiTransitData';
import { db } from '../database/db';
import { config } from '../config';

export class RouteOrchestrator {
  /**
   * Main calculation entrypoint: generates multi-modal route options
   */
  public async computeRoutes(request: RouteRequest): Promise<RouteCalculationResponse> {
    const originCoords: Coordinates = { lat: request.origin.lat, lng: request.origin.lng };
    const destCoords: Coordinates = { lat: request.destination.lat, lng: request.destination.lng };

    // Resolve places
    const originPlace = await geocodingService.reverseGeocode(originCoords);
    if (request.origin.name) originPlace.name = request.origin.name;

    const destPlace = await geocodingService.reverseGeocode(destCoords);
    if (request.destination.name) destPlace.name = request.destination.name;

    const routes: RouteOption[] = [];

    // 1. Calculate Road Route (Cab / Auto Rickshaw)
    try {
      const roadRoute = await this.computeDrivingRoute(originPlace, destPlace, request.preferences);
      if (roadRoute) routes.push(roadRoute);
    } catch (err) {
      console.warn('Driving route calculation error:', (err as Error).message);
    }

    // 2. Calculate Public Transit Routes (Multi-Modal: Metro + Local Trains + Bus)
    try {
      const transitRoutes = await this.computeTransitRoutes(originPlace, destPlace, request.preferences);
      routes.push(...transitRoutes);
    } catch (err) {
      console.warn('Transit route calculation error:', (err as Error).message);
    }

    // 3. Calculate Walking Route
    const directDist = geocodingService.calculateHaversineDistanceMeters(
      originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng
    );
    if (directDist <= 8000) { // Up to 8 km
      try {
        const walkingRoute = await this.computeWalkingRoute(originPlace, destPlace);
        if (walkingRoute) routes.push(walkingRoute);
      } catch (err) {
        console.warn('Walking route calculation error:', (err as Error).message);
      }
    }

    // Sort routes by priority
    const priority = request.preferences?.priority || 'fastest';
    routes.sort((a, b) => {
      if (priority === 'cheapest') return a.totalCostINR - b.totalCostINR;
      if (priority === 'least_walking') return a.walkingDistanceMeters - b.walkingDistanceMeters;
      if (priority === 'comfort') return b.accessibilityScore - a.accessibilityScore;
      return a.durationMinutes - b.durationMinutes;
    });

    const routeRequestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const liveAlerts = db.getLiveAlerts();

    const response: RouteCalculationResponse = {
      routeRequestId,
      origin: originPlace,
      destination: destPlace,
      routes,
      liveAlerts,
      generatedAt: new Date().toISOString()
    };

    // Store in history
    db.saveRouteResult({
      id: routeRequestId,
      origin: request.origin,
      destination: request.destination,
      preferences: request.preferences,
      routes,
      createdAt: new Date().toISOString()
    });

    return response;
  }

  /**
   * Computes Driving (Cab / Auto Rickshaw) Route
   */
  private async computeDrivingRoute(
    origin: Place,
    destination: Place,
    prefs?: RouteRequest['preferences']
  ): Promise<RouteOption | null> {
    const coordsStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    let distanceMeters = 0;
    let durationMinutes = 0;
    let polyline: [number, number][] = [];
    let turnSteps: string[] = [];

    try {
      const osrmRes = await axios.get(
        `${config.osrmCarUrl}/${coordsStr}?overview=full&geometries=geojson&steps=true`,
        { timeout: 4000 }
      );
      if (osrmRes.data?.routes?.[0]) {
        const r = osrmRes.data.routes[0];
        distanceMeters = Math.round(r.distance);
        durationMinutes = Math.round(r.duration / 60);
        polyline = r.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        if (r.legs?.[0]?.steps) {
          turnSteps = r.legs[0].steps.map((s: any) => s.maneuver?.instruction || s.name).filter(Boolean);
        }
      }
    } catch (e) {
      // Fallback: Haversine distance with 1.35x road curvature factor
      const straight = geocodingService.calculateHaversineDistanceMeters(
        origin.lat, origin.lng, destination.lat, destination.lng
      );
      distanceMeters = Math.round(straight * 1.35);
      // Average Mumbai urban speed: ~22 km/h
      durationMinutes = Math.max(12, Math.round((distanceMeters / 1000) * (60 / 22)));
      polyline = this.generateInterpolatedPoints([origin.lat, origin.lng], [destination.lat, destination.lng], 15);
    }

    const distanceKm = distanceMeters / 1000;
    const isSouthMumbai = destination.lat < 19.000 || origin.lat < 19.000;
    // Auto rickshaws are prohibited in South Mumbai (south of Bandra / Mahim)
    const canTakeAuto = !isSouthMumbai;

    const autoFare = canTakeAuto ? calculateAutoFare(distanceKm) : null;
    const taxiFare = calculateTaxiFare(distanceKm);
    const appCabFare = calculateAppCabFare(distanceKm);

    const vehicleType = canTakeAuto ? 'Auto Rickshaw / Taxi' : 'Kaali Peeli Taxi / App Cab';
    const chosenCost = canTakeAuto ? autoFare! : taxiFare;

    let tip = 'Insist that the driver turns on the official electronic meter before departing.';
    if (origin.type === 'airport') {
      tip = 'At Airport T2, use the prepaid taxi counter on Level P4 or book via Uber/Ola at dedicated pickup zones.';
    } else if (isSouthMumbai) {
      tip = 'Note: Auto rickshaws are banned south of Mahim/Sion. Only black-and-yellow taxis or app cabs operate here.';
    }

    const legs: ItineraryLeg[] = [
      {
        id: `leg_drive_1`,
        mode: canTakeAuto ? 'auto' : 'cab',
        instruction: `Board a ${vehicleType} from ${origin.name} to ${destination.name}`,
        guidanceTip: tip,
        fromName: origin.name,
        toName: destination.name,
        startCoords: [origin.lat, origin.lng],
        endCoords: [destination.lat, destination.lng],
        distanceMeters,
        durationMinutes,
        costINR: chosenCost,
        geometry: polyline,
        fareDetails: {
          type: 'Official Mumbai RTO Tariff',
          price: chosenCost,
          bookingMethod: canTakeAuto
            ? `Metered Auto (₹${autoFare}) or Kaali Peeli Taxi (₹${taxiFare})`
            : `Kaali Peeli Taxi (₹${taxiFare}) or App Cab (₹${appCabFare})`
        }
      }
    ];

    return {
      id: `route_drive_${Date.now()}`,
      title: canTakeAuto ? 'Direct Auto Rickshaw / Cab' : 'Direct Taxi / App Cab',
      tag: 'Direct Cab',
      summary: `Door-to-door drive via highway/arterials (${(distanceKm).toFixed(1)} km)`,
      durationMinutes,
      totalCostINR: chosenCost,
      totalDistanceMeters: distanceMeters,
      walkingDistanceMeters: 50,
      transfers: 0,
      legs,
      polyline,
      accessibilityScore: 90,
      crowdLevel: 'Low'
    };
  }

  /**
   * Computes Multi-Modal Public Transit Routes
   */
  private async computeTransitRoutes(
    origin: Place,
    destination: Place,
    prefs?: RouteRequest['preferences']
  ): Promise<RouteOption[]> {
    const transitOptions: RouteOption[] = [];

    // Find nearest stations
    const originStation = this.findNearestStation(origin.lat, origin.lng);
    const destStation = this.findNearestStation(destination.lat, destination.lng);

    if (!originStation || !destStation) {
      return [];
    }

    // 1. FASTEST / BALANCED ROUTE (Metro + Fast Local)
    const fastestOption = await this.buildFastestTransitOption(origin, destination, originStation, destStation);
    if (fastestOption) transitOptions.push(fastestOption);

    // 2. CHEAPEST ROUTE (Second class Local train + BEST bus)
    const cheapestOption = await this.buildCheapestTransitOption(origin, destination, originStation, destStation);
    if (cheapestOption) transitOptions.push(cheapestOption);

    // 3. COMFORT / LUGGAGE-FRIENDLY ROUTE (Metro with AC & Elevators + Auto/Cab feeder)
    const comfortOption = await this.buildComfortTransitOption(origin, destination, originStation, destStation);
    if (comfortOption) transitOptions.push(comfortOption);

    return transitOptions;
  }

  /**
   * Build Fastest Transit Option
   */
  private async buildFastestTransitOption(
    origin: Place,
    destination: Place,
    origSt: TransitStation,
    destSt: TransitStation
  ): Promise<RouteOption> {
    const legs: ItineraryLeg[] = [];
    const polyline: [number, number][] = [];

    // Leg 1: Walk / Short feeder from Origin to Origin Station
    const distToStation = geocodingService.calculateHaversineDistanceMeters(
      origin.lat, origin.lng, origSt.lat, origSt.lng
    );
    const walkDuration1 = Math.max(3, Math.round(distToStation / 70)); // ~4.2 km/h
    const walkGeom1 = this.generateInterpolatedPoints([origin.lat, origin.lng], [origSt.lat, origSt.lng], 6);

    legs.push({
      id: 'leg_fast_1',
      mode: distToStation > 1500 ? 'auto' : 'walk',
      instruction: distToStation > 1500
        ? `Take a short auto rickshaw to ${origSt.name} station`
        : `Walk ${Math.round(distToStation)}m to ${origSt.name} station`,
      guidanceTip: origSt.tips || `Enter via main entrance. Ticket counters and ATVM kiosks are in the main hall.`,
      fromName: origin.name,
      toName: origSt.name,
      startCoords: [origin.lat, origin.lng],
      endCoords: [origSt.lat, origSt.lng],
      distanceMeters: Math.round(distToStation),
      durationMinutes: distToStation > 1500 ? 8 : walkDuration1,
      costINR: distToStation > 1500 ? 23 : 0,
      geometry: walkGeom1
    });
    polyline.push(...walkGeom1);

    // Leg 2: Transit Ride
    const isSameNetwork = origSt.network === destSt.network;
    const numStops = Math.max(1, Math.abs(origSt.sequence - destSt.sequence));
    const transitDistMeters = Math.round(
      geocodingService.calculateHaversineDistanceMeters(origSt.lat, origSt.lng, destSt.lat, destSt.lng) * 1.15
    );
    const transitDuration = Math.max(10, Math.round((transitDistMeters / 1000) * 2.2));
    const transitCost = origSt.network.includes('Metro') ? 30 : 10;
    const transitGeom = this.generateInterpolatedPoints([origSt.lat, origSt.lng], [destSt.lat, destSt.lng], 12);

    let transitTip = 'Stand near middle coaches. Have your digital QR or ticket ready.';
    if (origSt.network.includes('Metro')) {
      transitTip = 'Air-conditioned coaches with automated bilingual announcements. Doors close automatically.';
    } else {
      transitTip = 'Board from the left. Listen for announcements for fast vs slow stopping patterns.';
    }

    legs.push({
      id: 'leg_fast_2',
      mode: origSt.network.includes('Metro') ? 'metro' : 'train',
      instruction: `Board ${origSt.line} from ${origSt.name} towards ${destSt.name}`,
      guidanceTip: transitTip,
      fromName: origSt.name,
      toName: destSt.name,
      startCoords: [origSt.lat, origSt.lng],
      endCoords: [destSt.lat, destSt.lng],
      distanceMeters: transitDistMeters,
      durationMinutes: transitDuration,
      costINR: transitCost,
      lineName: `${origSt.network} (${origSt.line})`,
      platform: origSt.platformInfo || 'Platform 1 / 2',
      numStops,
      geometry: transitGeom,
      fareDetails: {
        type: 'Single Journey Token / QR Ticket',
        price: transitCost,
        bookingMethod: origSt.network.includes('Metro') ? 'Mumbai 1 App / Ticket Counter' : 'UTS Mobile App / ATVM kiosk'
      }
    });
    polyline.push(...transitGeom);

    // Leg 3: Walk from Destination Station to Final Destination
    const distFromDestStation = geocodingService.calculateHaversineDistanceMeters(
      destSt.lat, destSt.lng, destination.lat, destination.lng
    );
    const walkDuration2 = Math.max(3, Math.round(distFromDestStation / 70));
    const walkGeom2 = this.generateInterpolatedPoints([destSt.lat, destSt.lng], [destination.lat, destination.lng], 6);

    legs.push({
      id: 'leg_fast_3',
      mode: distFromDestStation > 1500 ? 'auto' : 'walk',
      instruction: distFromDestStation > 1500
        ? `Take a short auto/taxi to ${destination.name}`
        : `Walk ${Math.round(distFromDestStation)}m to ${destination.name}`,
      guidanceTip: `Exit station and follow navigation to ${destination.name}.`,
      fromName: destSt.name,
      toName: destination.name,
      startCoords: [destSt.lat, destSt.lng],
      endCoords: [destination.lat, destination.lng],
      distanceMeters: Math.round(distFromDestStation),
      durationMinutes: distFromDestStation > 1500 ? 7 : walkDuration2,
      costINR: distFromDestStation > 1500 ? 25 : 0,
      geometry: walkGeom2
    });
    polyline.push(...walkGeom2);

    const totalDuration = legs.reduce((acc, l) => acc + l.durationMinutes, 0);
    const totalCost = legs.reduce((acc, l) => acc + l.costINR, 0);
    const totalDistance = legs.reduce((acc, l) => acc + l.distanceMeters, 0);
    const walkingDist = legs.filter(l => l.mode === 'walk').reduce((acc, l) => acc + l.distanceMeters, 0);

    return {
      id: `route_fastest_${Date.now()}`,
      title: 'Fastest: Metro & Suburban Rail',
      tag: 'Fastest',
      summary: `High frequency transit link via ${origSt.name} & ${destSt.name}`,
      durationMinutes: totalDuration,
      totalCostINR: totalCost,
      totalDistanceMeters: totalDistance,
      walkingDistanceMeters: walkingDist,
      transfers: isSameNetwork ? 0 : 1,
      legs,
      polyline,
      accessibilityScore: origSt.accessible && destSt.accessible ? 85 : 55,
      crowdLevel: 'Moderate'
    };
  }

  /**
   * Build Cheapest Budget Option
   */
  private async buildCheapestTransitOption(
    origin: Place,
    destination: Place,
    origSt: TransitStation,
    destSt: TransitStation
  ): Promise<RouteOption> {
    const legs: ItineraryLeg[] = [];
    const polyline: [number, number][] = [];

    // Walk to nearest bus stop / train station
    const distToStation = geocodingService.calculateHaversineDistanceMeters(
      origin.lat, origin.lng, origSt.lat, origSt.lng
    );
    const walkGeom1 = this.generateInterpolatedPoints([origin.lat, origin.lng], [origSt.lat, origSt.lng], 6);

    legs.push({
      id: 'leg_cheap_1',
      mode: 'walk',
      instruction: `Walk ${Math.round(distToStation)}m to ${origSt.name}`,
      guidanceTip: 'Use designated pedestrian crossings and footpaths.',
      fromName: origin.name,
      toName: origSt.name,
      startCoords: [origin.lat, origin.lng],
      endCoords: [origSt.lat, origSt.lng],
      distanceMeters: Math.round(distToStation),
      durationMinutes: Math.max(4, Math.round(distToStation / 70)),
      costINR: 0,
      geometry: walkGeom1
    });
    polyline.push(...walkGeom1);

    // Budget Train or BEST Bus ride
    const transitDistMeters = Math.round(
      geocodingService.calculateHaversineDistanceMeters(origSt.lat, origSt.lng, destSt.lat, destSt.lng) * 1.2
    );
    const transitGeom = this.generateInterpolatedPoints([origSt.lat, origSt.lng], [destSt.lat, destSt.lng], 12);
    const budgetFare = 10; // Second Class Suburban Railway ticket

    legs.push({
      id: 'leg_cheap_2',
      mode: 'train',
      instruction: `Take Second Class Local Train from ${origSt.name} to ${destSt.name}`,
      guidanceTip: 'Buy a ₹10 Second Class ticket at ATVM automated machines or using UTS app to skip queues.',
      fromName: origSt.name,
      toName: destSt.name,
      startCoords: [origSt.lat, origSt.lng],
      endCoords: [destSt.lat, destSt.lng],
      distanceMeters: transitDistMeters,
      durationMinutes: Math.max(15, Math.round((transitDistMeters / 1000) * 2.5)),
      costINR: budgetFare,
      lineName: 'Suburban Railway (Ordinary Local)',
      platform: 'Platform 1 / 3',
      geometry: transitGeom,
      fareDetails: {
        type: 'Second Class Suburban Ticket',
        price: budgetFare,
        bookingMethod: 'UTS App / Station Ticket Window'
      }
    });
    polyline.push(...transitGeom);

    // Walk to destination
    const distToDest = geocodingService.calculateHaversineDistanceMeters(
      destSt.lat, destSt.lng, destination.lat, destination.lng
    );
    const walkGeom2 = this.generateInterpolatedPoints([destSt.lat, destSt.lng], [destination.lat, destination.lng], 6);

    legs.push({
      id: 'leg_cheap_3',
      mode: 'walk',
      instruction: `Walk ${Math.round(distToDest)}m to ${destination.name}`,
      guidanceTip: `Exit station and walk directly towards ${destination.name}.`,
      fromName: destSt.name,
      toName: destination.name,
      startCoords: [destSt.lat, destSt.lng],
      endCoords: [destination.lat, destination.lng],
      distanceMeters: Math.round(distToDest),
      durationMinutes: Math.max(4, Math.round(distToDest / 70)),
      costINR: 0,
      geometry: walkGeom2
    });
    polyline.push(...walkGeom2);

    const totalDuration = legs.reduce((acc, l) => acc + l.durationMinutes, 0);
    const totalCost = legs.reduce((acc, l) => acc + l.costINR, 0);
    const totalDistance = legs.reduce((acc, l) => acc + l.distanceMeters, 0);
    const walkingDist = legs.filter(l => l.mode === 'walk').reduce((acc, l) => acc + l.distanceMeters, 0);

    return {
      id: `route_cheapest_${Date.now()}`,
      title: 'Cheapest: Second Class Suburban Train',
      tag: 'Cheapest',
      summary: `Most budget-friendly route for only ₹${totalCost}`,
      durationMinutes: totalDuration,
      totalCostINR: totalCost,
      totalDistanceMeters: totalDistance,
      walkingDistanceMeters: walkingDist,
      transfers: 0,
      legs,
      polyline,
      accessibilityScore: 40,
      crowdLevel: 'Heavy (Peak Hours)'
    };
  }

  /**
   * Build Comfort / Luggage-Friendly Option
   */
  private async buildComfortTransitOption(
    origin: Place,
    destination: Place,
    origSt: TransitStation,
    destSt: TransitStation
  ): Promise<RouteOption> {
    const legs: ItineraryLeg[] = [];
    const polyline: [number, number][] = [];

    // Direct Pre-paid Auto / Cab from origin to nearest AC Metro Station
    const distToStation = geocodingService.calculateHaversineDistanceMeters(
      origin.lat, origin.lng, origSt.lat, origSt.lng
    );
    const cabGeom1 = this.generateInterpolatedPoints([origin.lat, origin.lng], [origSt.lat, origSt.lng], 6);
    const autoCost1 = calculateAutoFare(distToStation / 1000);

    legs.push({
      id: 'leg_comf_1',
      mode: 'auto',
      instruction: `Short Auto / Cab to ${origSt.name} station (Luggage friendly)`,
      guidanceTip: 'Tell the driver to drop you at the main elevator / ramp entrance of the station.',
      fromName: origin.name,
      toName: origSt.name,
      startCoords: [origin.lat, origin.lng],
      endCoords: [origSt.lat, origSt.lng],
      distanceMeters: Math.round(distToStation),
      durationMinutes: Math.max(5, Math.round((distToStation / 1000) * 3.5)),
      costINR: autoCost1,
      geometry: cabGeom1
    });
    polyline.push(...cabGeom1);

    // AC Metro ride with elevators & wide gates
    const transitDistMeters = Math.round(
      geocodingService.calculateHaversineDistanceMeters(origSt.lat, origSt.lng, destSt.lat, destSt.lng) * 1.15
    );
    const transitGeom = this.generateInterpolatedPoints([origSt.lat, origSt.lng], [destSt.lat, destSt.lng], 12);
    const metroCost = 40;

    legs.push({
      id: 'leg_comf_2',
      mode: 'metro',
      instruction: `Take Air-Conditioned Metro to ${destSt.name}`,
      guidanceTip: 'Use the luggage-wide automatic gate. Elevators are located next to the customer service booth.',
      fromName: origSt.name,
      toName: destSt.name,
      startCoords: [origSt.lat, origSt.lng],
      endCoords: [destSt.lat, destSt.lng],
      distanceMeters: transitDistMeters,
      durationMinutes: Math.max(12, Math.round((transitDistMeters / 1000) * 2.2)),
      costINR: metroCost,
      lineName: 'AC Metro Line',
      platform: 'Elevator Access Platform',
      geometry: transitGeom,
      fareDetails: {
        type: 'AC Metro Token / WhatsApp QR',
        price: metroCost,
        bookingMethod: 'WhatsApp Ticketing / Station Counter'
      }
    });
    polyline.push(...transitGeom);

    // Final short Auto/Cab to destination
    const distToDest = geocodingService.calculateHaversineDistanceMeters(
      destSt.lat, destSt.lng, destination.lat, destination.lng
    );
    const cabGeom2 = this.generateInterpolatedPoints([destSt.lat, destSt.lng], [destination.lat, destination.lng], 6);
    const autoCost2 = calculateTaxiFare(distToDest / 1000);

    legs.push({
      id: 'leg_comf_3',
      mode: 'cab',
      instruction: `Take Taxi / Cab to ${destination.name}`,
      guidanceTip: 'Taxi stand is directly outside Gate 1.',
      fromName: destSt.name,
      toName: destination.name,
      startCoords: [destSt.lat, destSt.lng],
      endCoords: [destination.lat, destination.lng],
      distanceMeters: Math.round(distToDest),
      durationMinutes: Math.max(5, Math.round((distToDest / 1000) * 3.5)),
      costINR: autoCost2,
      geometry: cabGeom2
    });
    polyline.push(...cabGeom2);

    const totalDuration = legs.reduce((acc, l) => acc + l.durationMinutes, 0);
    const totalCost = legs.reduce((acc, l) => acc + l.costINR, 0);
    const totalDistance = legs.reduce((acc, l) => acc + l.distanceMeters, 0);

    return {
      id: `route_comfort_${Date.now()}`,
      title: 'Comfort / Luggage Friendly',
      tag: 'Comfort / Luggage',
      summary: 'AC Metro + Direct Cabs: Step-free access & minimal carrying of bags',
      durationMinutes: totalDuration,
      totalCostINR: totalCost,
      totalDistanceMeters: totalDistance,
      walkingDistanceMeters: 80,
      transfers: 0,
      legs,
      polyline,
      accessibilityScore: 95,
      crowdLevel: 'Low'
    };
  }

  /**
   * Computes Walking Route
   */
  private async computeWalkingRoute(origin: Place, destination: Place): Promise<RouteOption | null> {
    const coordsStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    let distanceMeters = 0;
    let durationMinutes = 0;
    let polyline: [number, number][] = [];

    try {
      const osrmRes = await axios.get(
        `${config.osrmFootUrl}/${coordsStr}?overview=full&geometries=geojson&steps=false`,
        { timeout: 3500 }
      );
      if (osrmRes.data?.routes?.[0]) {
        const r = osrmRes.data.routes[0];
        distanceMeters = Math.round(r.distance);
        durationMinutes = Math.round(r.duration / 60);
        polyline = r.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      }
    } catch (e) {
      const straight = geocodingService.calculateHaversineDistanceMeters(
        origin.lat, origin.lng, destination.lat, destination.lng
      );
      distanceMeters = Math.round(straight * 1.25);
      durationMinutes = Math.round((distanceMeters / 1000) * (60 / 4.5));
      polyline = this.generateInterpolatedPoints([origin.lat, origin.lng], [destination.lat, destination.lng], 12);
    }

    const legs: ItineraryLeg[] = [
      {
        id: 'leg_walk_1',
        mode: 'walk',
        instruction: `Walk from ${origin.name} to ${destination.name}`,
        guidanceTip: 'Stay on shaded footpaths, stay hydrated, and use zebra crossings when crossing main roads.',
        fromName: origin.name,
        toName: destination.name,
        startCoords: [origin.lat, origin.lng],
        endCoords: [destination.lat, destination.lng],
        distanceMeters,
        durationMinutes,
        costINR: 0,
        geometry: polyline
      }
    ];

    return {
      id: `route_walk_${Date.now()}`,
      title: 'Walking',
      tag: 'Walking',
      summary: `Direct pedestrian path (${(distanceMeters / 1000).toFixed(1)} km)`,
      durationMinutes,
      totalCostINR: 0,
      totalDistanceMeters: distanceMeters,
      walkingDistanceMeters: distanceMeters,
      transfers: 0,
      legs,
      polyline,
      accessibilityScore: 70,
      crowdLevel: 'Low'
    };
  }

  /**
   * Helper: Find nearest station
   */
  private findNearestStation(lat: number, lng: number): TransitStation | null {
    let nearest: TransitStation | null = null;
    let minDistance = Infinity;

    for (const station of MUMBAI_STATIONS) {
      const dist = geocodingService.calculateHaversineDistanceMeters(lat, lng, station.lat, station.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = station;
      }
    }
    return nearest;
  }

  /**
   * Helper: Linear interpolation between two coordinates
   */
  private generateInterpolatedPoints(
    start: [number, number],
    end: [number, number],
    steps: number
  ): [number, number][] {
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      points.push([
        start[0] + (end[0] - start[0]) * frac,
        start[1] + (end[1] - start[1]) * frac
      ]);
    }
    return points;
  }
}

export const routeOrchestrator = new RouteOrchestrator();
