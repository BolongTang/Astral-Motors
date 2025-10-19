import React, { useState, useEffect } from 'react';
import { TOYOTA_FLEET } from '../constants';

const featuredVehicles = TOYOTA_FLEET.slice(0, 4); // Use first 4 vehicles for slideshow

const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredVehicles.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const currentVehicle = featuredVehicles[currentIndex];

  return (
    <section id="hero" className="h-[calc(100vh-88px)] min-h-[700px] flex items-center justify-center text-center px-4 relative overflow-hidden">
      {featuredVehicles.map((vehicle, index) => (
        <div
          key={vehicle.model}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <img 
            src={`${vehicle.image}`} 
            alt={vehicle.model}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
      ))}
      
      <div className="container mx-auto relative z-10">
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold font-cinzel text-white leading-tight tracking-wider transition-all duration-500">
          {currentVehicle.model.toUpperCase()}
        </h2>
        <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto transition-all duration-500">
          {currentVehicle.description}
        </p>
        <a 
          onClick={() => {
            const section = document.getElementById('calculator');
            section?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mt-12 inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-10 rounded-full text-lg tracking-wider uppercase shadow-[0_0_20px_rgba(124,58,237,0.6)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] transform hover:scale-105 transition-all duration-300"
        >
          Find Your Financing
        </a>
      </div>
    </section>
  );
};

export default Hero;