import { useEffect, useRef, useState } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-store-locator': any;
      'gmpx-api-loader': any;
    }
  }
}

interface GoogleMapsLocatorProps {
  apiKey?: string;
  className?: string;
}

const GoogleMapsLocator = ({ apiKey, className = "" }: GoogleMapsLocatorProps) => {
  const locatorRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  // Use environment variable, prop, or demo key in that order
  const mapsApiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg";

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
        "mapId": "DEMO_MAP_ID"
      },
      "mapsApiKey": mapsApiKey,
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
      try {
        await customElements.whenDefined('gmpx-store-locator');
        const locator = locatorRef.current;
        if (locator && locator.configureFromQuickBuilder) {
          locator.configureFromQuickBuilder(CONFIGURATION);
        }
      } catch (error) {
        console.error('Error configuring Google Maps locator:', error);
        setMapError(true);
      }
    };

    configureLocator();
  }, [mapsApiKey]);

  // Fallback map display
  if (mapError) {
    return (
      <div className={`w-full h-full ${className} bg-muted flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-lg font-semibold mb-2">Kabinda Lodge</h3>
          <p className="text-muted-foreground mb-4">
            Avenue Lumumba<br />
            Kabinda, Congo - Kinshasa
          </p>
          <p className="text-sm text-muted-foreground">
            Coordinates: -6.1371018, 24.4819284
          </p>
        </div>
      </div>
    );
  }

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
        key={mapsApiKey} 
        solution-channel="GMP_QB_locatorplus_v11_cABD"
        api-key={mapsApiKey}
      />
      <gmpx-store-locator 
        ref={locatorRef}
        map-id="DEMO_MAP_ID"
      />
    </div>
  );
};

export default GoogleMapsLocator;