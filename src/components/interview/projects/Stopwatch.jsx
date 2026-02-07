import { useState, useEffect } from "react";

const initialTime = { h: 1, m: 1, s: 10 };

function Stopwatch() {
  const [time, setTime] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (time.s > 0) {
          setTime({ ...time, s: time.s - 1 });
        } else if (time.m > 0) {
          setTime({ ...time, m: time.m - 1, s: 59 });
        } else if (time.h > 0) {
          setTime({ h: time.h - 1, m: 59, s: 59 });
        } else {
          setIsActive(false);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  function resetHandler() {
    setIsActive(false);
    setTime(initialTime);
  }

  function startHandler() {
    setIsActive(true);
  }

  function pauseHandler() {
    setIsActive(false);
  }
  return (
    <div className="flex flex-col items-center">
      <p className="text-3xl font-mono font-bold text-gray-800 mb-6">
        {String(time.h).padStart(2, "0")}:{String(time.m).padStart(2, "0")}:
        {String(time.s).padStart(2, "0")}
      </p>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={startHandler}
        >
          Start
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          onClick={pauseHandler}
        >
          Pause
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          onClick={resetHandler}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default Stopwatch;
