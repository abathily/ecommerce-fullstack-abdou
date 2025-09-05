import { useEffect, useState } from 'react';

const images = Array.from({ length: 10 }, (_, i) => `/images/image${i + 1}.jpg`);
const transitionDelay = 3000;

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, transitionDelay);
    return () => clearInterval(timer);
  }, []);

  // Position calculée : image au centre, les autres autour
  const getOffset = (i) => {
    const offset = i - currentIndex;
    if (offset > images.length / 2) return offset - images.length;
    if (offset < -images.length / 2) return offset + images.length;
    return offset;
  };

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
      {images.map((img, idx) => {
        const offset = getOffset(idx);
        const isCenter = offset === 0;

        return (
          <img
            key={idx}
            src={img}
            alt={`Image ${idx + 1}`}
            className={`absolute transition-all duration-700 ease-in-out object-cover rounded-xl shadow-lg
              ${isCenter ? 'w-[600px] h-[350px] z-20 scale-105' : 'w-[250px] h-[150px] opacity-30 z-10'}
              `}
            style={{
              transform: `translateX(${offset * 300}px) scale(${isCenter ? 1.05 : 0.9})`,
              zIndex: isCenter ? 20 : 10,
            }}
          />
        );
      })}
    </div>
  );
}
