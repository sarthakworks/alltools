import { useState } from "react";

function Folder({ handleInsertNode, explorer }) {
  const [expand, setExpand] = useState(false);
  const [showInput, setShowInput] = useState({
    visible: false,
    isFolder: null,
  });

  const handleNewFolder = (e, isFolder) => {
    e.stopPropagation();
    setExpand(true);
    setShowInput({
      visible: true,
      isFolder,
    });
  };

  const onAddFolder = (e) => {
    if (e.target.value && e.key === "Enter") {
      handleInsertNode(explorer.id, e.target.value, showInput.isFolder);
      setShowInput({ ...showInput, visible: false });
    }
  };

  if (explorer.isFolder) {
    return (
      <div className="mt-2 text-sm">
        <div
          className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 p-1 rounded"
          onClick={() => setExpand(!expand)}
        >
          <span>📁 {explorer.name}</span>
          <div className="ml-auto flex gap-1">
            <button
              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              onClick={(e) => handleNewFolder(e, true)}
            >
              Folder +
            </button>
            <button
              className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
              onClick={(e) => handleNewFolder(e, false)}
            >
              File +
            </button>
          </div>
        </div>

        <div className={`pl-6 ${expand ? "block" : "hidden"}`}>
          {showInput.visible && (
            <div className="flex items-center gap-2 my-1">
              <span>{showInput.isFolder ? "📁" : "📄"}</span>
              <input
                type="text"
                autoFocus
                onKeyDown={onAddFolder}
                onBlur={() => setShowInput({ ...showInput, visible: false })}
                className="border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {explorer.items.map((exp) => {
            return (
              <Folder
                handleInsertNode={handleInsertNode}
                key={exp.id}
                explorer={exp}
              />
            );
          })}
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col mt-2 pl-2 text-sm">
        <span className="flex items-center gap-2">📄 {explorer.name}</span>
      </div>
    );
  }
}

export default Folder;
