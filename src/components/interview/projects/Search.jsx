import { useState } from "react";

function Search() {
  const fruits = [
    "apple",
    "banana",
    "kiwi",
    "orange",
    "grape",
    "mango",
    "strawberry",
    "blueberry",
    "pineapple",
    "watermelon",
  ];

  const [data, setData] = useState(fruits);
  const [searchTerm, setSearchTerm] = useState("");

  function search(e) {
    const term = e.target.value;
    setSearchTerm(term);
    setData(fruits.filter((i) => i.toLowerCase().includes(term.toLowerCase())));
  }

  return (
    <div className="w-full">
      <input
        value={searchTerm}
        onChange={search}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 mb-4"
        placeholder="Type to search fruits..."
      />

      <ul className="space-y-1 max-h-48 overflow-y-auto border border-gray-100 rounded p-2 bg-gray-50">
        {data.length > 0 ? (
          data.map((i) => (
            <li
              key={i}
              className="px-2 py-1 bg-white rounded shadow-sm text-gray-700 capitalize"
            >
              {i}
            </li>
          ))
        ) : (
          <li className="text-gray-500 text-center text-sm py-2">
            No fruits found
          </li>
        )}
      </ul>
    </div>
  );
}

export default Search;
