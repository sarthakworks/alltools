import { useState, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";

function Virtualisation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/photos")
      .then((response) => response.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div
      style={{ height: "300px", width: "100%" }}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
    >
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Virtuoso
          style={{ height: "100%", width: "100%" }}
          totalCount={data.length}
          itemContent={(index) => (
            <div className="flex items-center border-b border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
              <span className="font-bold mr-3 text-blue-600 w-12 shrink-0">
                #{data[index].id}
              </span>
              <span
                className="truncate text-gray-700 text-sm"
                title={data[index].title}
              >
                {data[index].title}
              </span>
            </div>
          )}
        />
      )}
    </div>
  );
}

export default Virtualisation;
