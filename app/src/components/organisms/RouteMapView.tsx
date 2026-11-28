/**
 * Organism: RouteMapView
 *
 * Platform-aware router:
 * - RouteMapView.native.tsx on iOS / Android (react-native-maps + PROVIDER_GOOGLE)
 * - RouteMapView.web.tsx on Web (SVG-based web polyline & marker renderer)
 */

import React from 'react';
import { Platform } from 'react-native';
import type { RouteMapViewProps } from './RouteMapView.web';

export type { RouteMapViewProps };

let RouteMapViewComponent: React.FC<RouteMapViewProps>;

if (Platform.OS === 'web') {
  RouteMapViewComponent = require('./RouteMapView.web').RouteMapView || require('./RouteMapView.web').default;
} else {
  RouteMapViewComponent = require('./RouteMapView.native').RouteMapView || require('./RouteMapView.native').default;
}

export const RouteMapView = RouteMapViewComponent;
export default RouteMapViewComponent;
