import { useState, useEffect } from "react";

export default function Api() {
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = "https://jsonplaceholder.typicode.com/users";
    let getUser = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const handleSort = () => {
    const sorted = [...user].sort((a, b) => a.name.localeCompare(b.name));
    setUser(sorted);
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-800 text-white font-medium uppercase">
          <tr>
            <th
              onClick={handleSort}
              className="px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors flex items-center gap-1"
              title="Click to sort by Name"
            >
              Name <span className="text-xs">↕</span>
            </th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Id</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
          {user.map((i) => (
            <tr key={i.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{i.name}</td>
              <td className="px-4 py-3">{i.email}</td>
              <td className="px-4 py-3">{i.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
