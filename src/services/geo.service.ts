export const geoService = {
  /**
   * Validasi apakah koordinat berada dalam rentang yang valid.
   * Dipakai di: createOutlet, updateOutlet, calculateShipping
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    );
  },

  /**
   * Hitung jarak antara dua titik koordinat menggunakan rumus Haversine (km).
   * Dipakai di: calculateShipping
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Bulatkan 2 desimal
  },

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  },
};
