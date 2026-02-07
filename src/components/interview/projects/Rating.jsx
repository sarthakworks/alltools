import { useState } from "react";
import { Star } from "lucide-react";

const Rating = () => {
  const [initialValue, setInitialValue] = useState(2);
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1 justify-center">
      {[...new Array(5).keys()].map((param) => {
        const ratingValue = param + 1;
        const isRated = ratingValue <= (hoverValue || initialValue);

        return (
          <button
            key={param}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onClick={() => setInitialValue(ratingValue)}
            onMouseEnter={() => setHoverValue(ratingValue)}
            onMouseLeave={() => setHoverValue(0)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setInitialValue(ratingValue);
              }
            }}
          >
            <Star
              size={32}
              className={`${isRated ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default Rating;
