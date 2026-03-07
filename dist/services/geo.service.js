"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoService = void 0;
exports.geoService = {
    /**
     * Validasi apakah koordinat berada dalam rentang yang valid.
     * Dipakai di: createOutlet, updateOutlet, calculateShipping
     */
    validateCoordinates(latitude, longitude) {
        return (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180);
    },
    /**
     * Hitung jarak antara dua titik koordinat menggunakan rumus Haversine (km).
     * Dipakai di: calculateShipping
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius bumi dalam kilometer
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 100) / 100; // Bulatkan 2 desimal
    },
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    },
};
