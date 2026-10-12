import { NativeLocationModuleNext, NativeLocationProvider } from '../native';
export class LocationProvider {
    static Gms() {
        return NativeLocationProvider.Gms();
    }
    static Android() {
        return NativeLocationProvider.Android();
    }
    static Fallback(providers) {
        return NativeLocationProvider.Fallback(providers);
    }
}
export function setLocationProvider(provider) {
    NativeLocationModuleNext.setLocationProvider(provider);
}
export function getSelectedLocationProviderName() {
    return NativeLocationModuleNext.getSelectedLocationProviderName();
}
//# sourceMappingURL=LocationProvider.js.map