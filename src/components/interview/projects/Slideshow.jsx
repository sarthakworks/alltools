import { useState, useEffect } from "react";

const colors = ["#727cf5", "#0acf97", "#fa5c7c"];

function Slideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setIndex(index === colors.length - 1 ? 0 : index + 1),
      2000,
    );
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="relative overflow-hidden w-full h-64 rounded-xl shadow-inner">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full w-full"
        style={{ transform: `translateX(${-index * 100}%)` }}
      >
        {colors.map((backgroundColor, idx) => (
          <div
            className="min-w-full h-full flex items-center justify-center text-white text-2xl font-bold"
            key={idx}
            style={{ backgroundColor }}
          >
            Slide {idx + 1}
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {colors.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${index === idx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`}
            onClick={() => setIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default Slideshow;
