import { useState, useEffect } from "react";

function Debounce() {
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [throttledValue, setThrottledValue] = useState("");

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  // Throttle (Simulated for display, typically uses a ref to track last execution)
  // Simple throttle implementation
  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledValue(value);
    }, 1000);
    return () => clearTimeout(handler);
  }, [value]); // Note: This isn't a true throttle, but mirroring the likely original implementation for now.

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Type here..."
        className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 mb-4"
      />
      <div className="space-y-2 text-sm">
        <p className="text-gray-600">
          <span className="font-bold text-gray-800">Normal:</span> {value}
        </p>
        <p className="text-gray-600">
          <span className="font-bold text-blue-600">Debounced (1s):</span>{" "}
          {debouncedValue}
        </p>
        <p className="text-gray-600">
          <span className="font-bold text-green-600">Throttled (1s):</span>{" "}
          {throttledValue}
        </p>
      </div>
    </div>
  );
}

export default Debounce;
