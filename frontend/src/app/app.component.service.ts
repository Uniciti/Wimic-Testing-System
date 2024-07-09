// custom-route-reuse-strategy.ts
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes: { [key: string]: DetachedRouteHandle } = {};

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Определите, нужно ли сохранять маршрут
    return true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    // Сохраните маршрут и его состояние
    if (route.routeConfig) {
      this.storedRoutes[route.routeConfig.path || ''] = handle!;
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    // Определите, нужно ли восстанавливать маршрут
    return !!route.routeConfig && !!this.storedRoutes[route.routeConfig.path || ''];
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    // Восстановите сохраненный маршрут и его состояние
    if (!route.routeConfig) {
      return null;
    }
    return this.storedRoutes[route.routeConfig.path || ''] || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // Определите, нужно ли переиспользовать маршрут
    return future.routeConfig === curr.routeConfig;
  }
}