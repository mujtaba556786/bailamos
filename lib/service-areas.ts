// The places the site may describe as its service area. Bailamos is in Brandenburg an der Havel;
// Berlin is not part of the service area. Extend this list only with places the restaurant actually serves.
export const serviceAreaOptions = ["Brandenburg an der Havel"] as const;
export type ServiceArea = (typeof serviceAreaOptions)[number];
