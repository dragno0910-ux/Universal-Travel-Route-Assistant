"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationService = void 0;
class NavigationService {
    sessions = new Map();
    /**
     * Start a new guided navigation session from a calculated route
     */
    startNavigation(route) {
        const sessionId = `nav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const totalLegs = route.legs.length;
        const currentLeg = route.legs[0];
        const nextLeg = totalLegs > 1 ? route.legs[1] : undefined;
        const remainingMinutes = route.legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
        const remainingDistanceMeters = route.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
        const session = {
            sessionId,
            routeId: route.id,
            currentLegIndex: 0,
            totalLegs,
            status: 'active',
            currentLeg,
            nextLeg,
            remainingMinutes,
            remainingDistanceMeters,
            progressPercent: 0,
            startedAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString()
        };
        this.sessions.set(sessionId, { session, route });
        return session;
    }
    /**
     * Get current "What do I do now?" step state
     */
    getCurrentStep(sessionId) {
        const entry = this.sessions.get(sessionId);
        if (!entry)
            return null;
        return entry.session;
    }
    /**
     * Advance to the next step ("I did this / Continue")
     */
    advanceStep(sessionId) {
        const entry = this.sessions.get(sessionId);
        if (!entry)
            return null;
        const { session, route } = entry;
        if (session.status !== 'active')
            return session;
        const nextIndex = session.currentLegIndex + 1;
        if (nextIndex >= session.totalLegs) {
            // Completed journey!
            session.status = 'completed';
            session.progressPercent = 100;
            session.remainingMinutes = 0;
            session.remainingDistanceMeters = 0;
            session.nextLeg = undefined;
            session.lastUpdatedAt = new Date().toISOString();
            return session;
        }
        session.currentLegIndex = nextIndex;
        session.currentLeg = route.legs[nextIndex];
        session.nextLeg = nextIndex + 1 < session.totalLegs ? route.legs[nextIndex + 1] : undefined;
        // Recalculate remaining stats
        const remainingLegs = route.legs.slice(nextIndex);
        session.remainingMinutes = remainingLegs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
        session.remainingDistanceMeters = remainingLegs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
        session.progressPercent = Math.round((nextIndex / session.totalLegs) * 100);
        session.lastUpdatedAt = new Date().toISOString();
        return session;
    }
    /**
     * Go back to the previous step
     */
    previousStep(sessionId) {
        const entry = this.sessions.get(sessionId);
        if (!entry)
            return null;
        const { session, route } = entry;
        if (session.currentLegIndex <= 0)
            return session;
        const prevIndex = session.currentLegIndex - 1;
        session.status = 'active';
        session.currentLegIndex = prevIndex;
        session.currentLeg = route.legs[prevIndex];
        session.nextLeg = route.legs[prevIndex + 1];
        const remainingLegs = route.legs.slice(prevIndex);
        session.remainingMinutes = remainingLegs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
        session.remainingDistanceMeters = remainingLegs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
        session.progressPercent = Math.round((prevIndex / session.totalLegs) * 100);
        session.lastUpdatedAt = new Date().toISOString();
        return session;
    }
    /**
     * Cancel navigation
     */
    cancelNavigation(sessionId) {
        const entry = this.sessions.get(sessionId);
        if (!entry)
            return false;
        entry.session.status = 'cancelled';
        entry.session.lastUpdatedAt = new Date().toISOString();
        return true;
    }
}
exports.navigationService = new NavigationService();
