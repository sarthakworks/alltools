import { useState } from "react";
import { Trash2, Pencil, Save, Plus } from "lucide-react";

function Todo() {
  const [todo, setTodo] = useState(["washing", "clothings", "iron"]);
  const [text, setText] = useState("");
  const [edit, setEdit] = useState(null);
  const [editText, setEditText] = useState("");

  function addTask(e) {
    if (
      (e.key === "Enter" || e.type === "click") &&
      text &&
      !todo.includes(text)
    ) {
      // e.preventDefault(); // Prevent form submission if inside a form
      setTodo([...todo, text]);
      setText("");
    }
  }

  function deleteMe(item) {
    setTodo(todo.filter((j) => j !== item));
  }

  function handleEdit() {
    if (edit !== null && editText.trim() !== "") {
      let temp = [...todo];
      temp[edit] = editText;
      setTodo(temp);
      setEdit(null);
      setEditText("");
    }
  }

  const startEdit = (index, item) => {
    setEdit(index);
    setEditText(item);
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Add task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask(e)}
        />
        <button
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center w-10 h-10"
          onClick={addTask}
          title="Add Task"
        >
          <Plus size={20} />
        </button>
      </div>

      <ul className="space-y-2">
        {todo.map((item, index) => (
          <li
            className="flex justify-between items-center bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors capitalize text-gray-700"
            key={index}
          >
            {edit === index ? (
              <div className="flex-1 flex gap-2 mr-2">
                <input
                  type="text"
                  className="flex-1 p-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Edit..."
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleEdit()}
                  autoFocus
                />
                <button
                  onClick={handleEdit}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                  title="Save"
                >
                  <Save size={16} />
                </button>
              </div>
            ) : (
              <span className="flex-1">{item}</span>
            )}

            <div className="flex gap-2">
              <button
                title="Edit"
                onClick={() => startEdit(index, item)}
                className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                aria-label="Edit"
              >
                <Pencil size={18} />
              </button>
              <button
                title="Delete"
                onClick={() => deleteMe(item)}
                className="text-red-500 hover:text-red-700 transition-colors p-1"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
        {todo.length === 0 && (
          <li className="text-gray-400 text-center text-sm italic py-2">
            No tasks yet
          </li>
        )}
      </ul>
    </div>
  );
}

export default Todo;
