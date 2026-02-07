import { useState } from "react";
import Folder from "./Folder";
import useTraverseTree from "./hooks/use-traverse-tree";
import explorer from "./folderData";

export default function Explorer() {
  const [explorerData, setExplorerData] = useState(explorer);
  const { insertNode } = useTraverseTree();

  const handleInsertNode = (folderId, item, isFolder) => {
    const finalTree = insertNode(explorerData, folderId, item, isFolder);
    setExplorerData(finalTree);
  };

  return (
    <div className="w-full">
      <Folder handleInsertNode={handleInsertNode} explorer={explorerData} />
    </div>
  );
}
