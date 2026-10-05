import { geocodingService } from '../server/src/services/geocodingService';
import { routeOrchestrator } from '../server/src/services/routeOrchestrator';
import { aiService } from '../server/src/services/aiService';
import { navigationService } from '../server/src/services/navigationService';
import { calculateAutoFare, calculateTaxiFare } from '../server/src/services/mumbaiTransitData';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE TRAVEL & ROUTE ASSISTANT TEST SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. FARE CALCULATIONS
  console.log('--- 1. Official Mumbai RTO Tariff Tests ---');
  // Auto rickshaw: base 23 for 1.5km, 15.33/km after
  // 1.5km -> 23
  assert(calculateAutoFare(1.5) === 23, 'Auto fare for 1.5km should equal base fare ₹23');
  // 3.0km -> 23 + 1.5 * 15.33 = 23 + 23 = ~46
  const auto3km = calculateAutoFare(3.0);
  assert(auto3km >= 45 && auto3km <= 47, `Auto fare for 3.0km is ₹${auto3km} (expected ~46)`);

  // Taxi: base 28 for 1.5km, 18.66/km after
  assert(calculateTaxiFare(1.5) === 28, 'Taxi fare for 1.5km should equal base fare ₹28');
  const taxi5km = calculateTaxiFare(5.0);
  assert(taxi5km >= 90 && taxi5km <= 96, `Taxi fare for 5.0km is ₹${taxi5km} (expected ~93)`);

  // 2. GEOCODING SERVICE TESTS
  console.log('\n--- 2. Geocoding & Landmark Index Tests ---');
  const places = await geocodingService.search('Airport');
  assert(places.length > 0, 'Geocoding search for "Airport" should return results');
  assert(places.some(p => p.name.includes('Airport') || p.displayName.includes('Airport')), 'Search result contains Airport');

  const csmPlace = await geocodingService.search('Gateway');
  assert(csmPlace.length > 0 && csmPlace[0].name.includes('Gateway'), 'Search for "Gateway" returns Gateway of India');

  // 3. HAVERSINE DISTANCE HELPER
  console.log('\n--- 3. Haversine Spatial Distance Tests ---');
  // Distance from Airport T2 (19.0896, 72.8656) to Gateway of India (18.9220, 72.8347) is ~19 km straight line
  const dist = geocodingService.calculateHaversineDistanceMeters(19.0896, 72.8656, 18.9220, 72.8347);
  assert(dist > 17000 && dist < 21000, `Haversine distance from Airport to Gateway is ${(dist / 1000).toFixed(2)} km (expected ~19 km)`);

  // 4. ROUTE ORCHESTRATOR TESTS (The core MVP Benchmark: Airport T2 -> Gateway of India)
  console.log('\n--- 4. Route Orchestrator Multi-Modal Tests ---');
  const routeResponse = await routeOrchestrator.computeRoutes({
    origin: { lat: 19.0896, lng: 72.8656, name: 'Mumbai Airport (T2)' },
    destination: { lat: 18.9220, lng: 72.8347, name: 'Gateway of India' },
    preferences: { priority: 'fastest', luggageFriendly: true }
  });

  assert(routeResponse.routes.length >= 2, `Should compute multiple route options (found ${routeResponse.routes.length})`);
  assert(routeResponse.origin.name.includes('Airport'), 'Origin is preserved in response');
  assert(routeResponse.destination.name.includes('Gateway'), 'Destination is preserved in response');

  const transitRoute = routeResponse.routes.find(r => r.tag === 'Fastest' || r.tag === 'Cheapest');
  assert(!!transitRoute, 'Multi-modal transit option exists in results');
  if (transitRoute) {
    assert(transitRoute.legs.length >= 2, `Transit option should have multiple legs (has ${transitRoute.legs.length})`);
    assert(transitRoute.legs.some(l => l.guidanceTip), 'Transit legs include "What do I do now" life guidance tips');
    assert(transitRoute.totalCostINR > 0, `Total fare calculated: ₹${transitRoute.totalCostINR}`);
  }

  // 5. NAVIGATION SERVICE TESTS ("What Do I Do Now?" Mode)
  console.log('\n--- 5. Navigation Session State Machine Tests ---');
  const sampleRoute = routeResponse.routes[0];
  const session = navigationService.startNavigation(sampleRoute);
  assert(session.status === 'active', 'Started navigation session is active');
  assert(session.currentLegIndex === 0, 'Initial step index is 0');
  assert(session.totalLegs === sampleRoute.legs.length, 'Total legs match route legs count');

  // Advance step
  const advancedSession = navigationService.advanceStep(session.sessionId);
  assert(advancedSession !== null && advancedSession.currentLegIndex === 1, 'Step advances to index 1');

  // Previous step
  const prevSession = navigationService.previousStep(session.sessionId);
  assert(prevSession !== null && prevSession.currentLegIndex === 0, 'Previous step rewinds to index 0');

  // 6. AI INTENT EXTRACTION TESTS
  console.log('\n--- 6. AI Intent & Constraint Parser Tests ---');
  const intentResult = await aiService.extractIntent('I have 2 heavy suitcases and 300 rupees, reach Gateway of India');
  assert(intentResult.extractedPreferences.luggageFriendly === true, 'Extracted luggage-friendly flag from "suitcases"');
  assert(intentResult.extractedPreferences.maxBudgetINR === 300, 'Extracted max budget INR 300');
  assert(intentResult.destinationQuery?.toLowerCase().includes('gateway') === true, 'Extracted destination Gateway of India');

  // 7. SUMMARY
  console.log('\n========================================================');
  console.log(`🎉 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
