import type { SharedRef } from 'expo';
import type { LocationProviderRefType } from '../types';
export declare class LocationProvider {
    static Gms(): SharedRef<LocationProviderRefType>;
    static Android(): SharedRef<LocationProviderRefType>;
    static Fallback(providers: SharedRef<LocationProviderRefType>[]): SharedRef<LocationProviderRefType>;
}
export declare function setLocationProvider(provider: SharedRef<LocationProviderRefType>): void;
export declare function getSelectedLocationProviderName(): string;
//# sourceMappingURL=LocationProvider.d.ts.map