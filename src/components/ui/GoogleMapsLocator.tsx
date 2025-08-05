import { useEffect, useRef } from 'react';
import { GoogleMapsConfig, MapLocation } from '../../types/common';

interface GoogleMapsLocatorProps {
  apiKey?: string;
  location?: MapLocation;
  zoom?: number;
  className?: string;
}

export const GoogleMapsLocator: React.FC<GoogleMapsLocatorProps> = ({
  apiKey,
  location,
  zoom = 15,
  className
}) => {
  const locatorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const CONFIGURATION = {
      "locations": [
        {
          "title": "Kabinda Lodge",
          "address1": "Avenue Lumumba",
          "address2": "Kabinda, Congo - Kinshasa",
          "coords": { "lat": -6.1371018, "lng": 24.4819284 },
          "placeId": "ChIJN2w6xli_jhkR1MGKys2G0zM"
        }
      ],
      "mapOptions": {
        "center": { "lat": -6.1371018, "lng": 24.4819284 },
        "fullscreenControl": true,
        "mapTypeControl": false,
        "streetViewControl": false,
        "zoom": 12,
        "zoomControl": true,
        "maxZoom": 17,
        "mapId": ""
      },
      "mapsApiKey": apiKey,
      "capabilities": {
        "input": true,
        "autocomplete": true,
        "directions": false,
        "distanceMatrix": true,
        "details": false,
        "actions": false
      }
    };

    const configureLocator = async () => {
      await customElements.whenDefined('gmpx-store-locator');
      const locator = locatorRef.current;
      if (locator && locator.configureFromQuickBuilder) {
        locator.configureFromQuickBuilder(CONFIGURATION);
      }
    };

    configureLocator();
  }, [apiKey]);

  return (
    <div className={`w-full h-full ${className}`}>
      <style>{`
        gmpx-store-locator {
          width: 100%;
          height: 100%;
          --gmpx-color-surface: hsl(var(--background));
          --gmpx-color-on-surface: hsl(var(--foreground));
          --gmpx-color-on-surface-variant: hsl(var(--muted-foreground));
          --gmpx-color-primary: hsl(var(--primary));
          --gmpx-color-outline: hsl(var(--border));
          --gmpx-fixed-panel-width-row-layout: 28.5em;
          --gmpx-fixed-panel-height-column-layout: 65%;
          --gmpx-font-family-base: var(--font-sans);
          --gmpx-font-family-headings: var(--font-heading);
          --gmpx-font-size-base: 0.875rem;
          --gmpx-hours-color-open: #188038;
          --gmpx-hours-color-closed: #d50000;
          --gmpx-rating-color: #ffb300;
          --gmpx-rating-color-empty: hsl(var(--muted));
        }
      `}</style>
      
      <gmpx-api-loader 
        key={apiKey} 
        solution-channel="GMP_QB_locatorplus_v11_cABD"
      />
      <gmpx-store-locator 
        ref={locatorRef}
        map-id="DEMO_MAP_ID"
      />
    </div>
  );
};