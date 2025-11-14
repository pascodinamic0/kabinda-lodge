import React from 'react';

interface GoogleMapsLocatorProps {
  className?: string;
}

const GoogleMapsLocator: React.FC<GoogleMapsLocatorProps> = ({ className = "" }) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <iframe 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1014554.8550204892!2d23.33493666507854!3d-6.633892229103613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x198ebf58c63a6c37%3A0x33d386cdca8ac1d4!2sKabinda%20Lodge!5e0!3m2!1sen!2scd!4v1754460521352!5m2!1sen!2scd" 
        width="100%" 
        height="100%" 
        style={{ border: 0 }} 
        allowFullScreen 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        title="Kabinda Lodge Location"
      />
    </div>
  );
};

export default GoogleMapsLocator;