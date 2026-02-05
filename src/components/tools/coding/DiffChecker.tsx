import React, { useState, useMemo } from 'react';
import { Copy, GitCompare, Trash2, ArrowRightLeft, ArrowRight, RotateCcw, Check } from 'lucide-react';
import * as Diff from 'diff';
import { useTranslation } from 'react-i18next';
import '../../../i18n';

interface DiffRow {
  leftLineNumber: number | null;
  leftContent: string | null;
  leftType: 'removed' | 'unchanged' | 'empty';
  rightLineNumber: number | null;
  rightContent: string | null;
  rightType: 'added' | 'unchanged' | 'empty';
  blockId?: string;
}

export default function DiffChecker() {
  const { t } = useTranslation();
  const [original, setOriginal] = useState<string>("");
  const [modified, setModified] = useState<string>("");
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);
  const [computedStats, setComputedStats] = useState({ additions: 0, removals: 0 });
  
  // mergeState: blockId -> 'left' | 'right'. 
  // 'right' (undefined/default) = Keep Modified.
  // 'left' = Overwrite with Original (Revert).
  const [mergeState, setMergeState] = useState<Record<string, 'left' | 'right'>>({});

  const processDiff = (origText: string, modText: string) => {
    if (!origText && !modText) {
        setDiffRows([]);
        setComputedStats({ additions: 0, removals: 0 });
        setMergeState({});
        return;
    }

    const diff = Diff.diffLines(origText, modText);
    const rows: DiffRow[] = [];
    
    let leftLine = 1;
    let rightLine = 1;
    let additions = 0;
    let removals = 0;

    for (let i = 0; i < diff.length; i++) {
        const part = diff[i];
        const lines = part.value.replace(/\n$/, '').split('\n');

        if (part.added) {
            additions += part.count || 0;
            let slotsToFill = 0;
            for (let j = rows.length - 1; j >= 0; j--) {
                if (rows[j].rightType === 'empty' && rows[j].leftType === 'removed') {
                    slotsToFill++;
                } else {
                    break;
                }
            }
            
            let fillIndex = rows.length - slotsToFill;
            const limit = rows.length;

            lines.forEach((line) => {
                if (fillIndex < limit) {
                    rows[fillIndex].rightContent = line;
                    rows[fillIndex].rightType = 'added';
                    rows[fillIndex].rightLineNumber = rightLine++;
                    fillIndex++;
                } else {
                    rows.push({
                        leftLineNumber: null,
                        leftContent: null,
                        leftType: 'empty',
                        rightLineNumber: rightLine++,
                        rightContent: line,
                        rightType: 'added'
                    });
                }
            });

        } else if (part.removed) {
            removals += part.count || 0;
            lines.forEach((line) => {
                rows.push({
                    leftLineNumber: leftLine++,
                    leftContent: line,
                    leftType: 'removed',
                    rightLineNumber: null,
                    rightContent: null,
                    rightType: 'empty'
                });
            });
        } else {
            lines.forEach((line) => {
                rows.push({
                    leftLineNumber: leftLine++,
                    leftContent: line,
                    leftType: 'unchanged',
                    rightLineNumber: rightLine++,
                    rightContent: line,
                    rightType: 'unchanged'
                });
            });
        }
    }
    
    // Block ID Assignment
    let currentBlockId = 0;
    let inBlock = false;
    const rowsWithBlocks = rows.map((row) => {
        const isModified = row.leftType !== 'unchanged' || row.rightType !== 'unchanged';
        if (isModified) {
            if (!inBlock) {
                currentBlockId++;
                inBlock = true;
            }
            return { ...row, blockId: `block-${currentBlockId}` };
        } else {
            inBlock = false;
            return row;
        }
    });

    setDiffRows(rowsWithBlocks);
    setComputedStats({ additions, removals });
    setMergeState({});
  };

  const handleDifference = () => {
    processDiff(original, modified);
  };

  const handleSwap = () => {
      const newOrig = modified;
      const newMod = original;
      setOriginal(newOrig);
      setModified(newMod);
      processDiff(newOrig, newMod);
  };

  const clear = () => {
    setOriginal("");
    setModified("");
    setDiffRows([]);
    setComputedStats({ additions: 0, removals: 0 });
    setMergeState({});
  };
  
  const loadSample = () => {
      setOriginal(`function add(a, b) {
  return a + b;
}
console.log(add(1, 2));`);
      setModified(`function add(a, b) {
  // Adding validation
  if (typeof a !== 'number' || typeof b !== 'number') return 0;
  return a + b;
}
console.log(add(1, 2));`);
      setDiffRows([]);
      setMergeState({});
  };

  // Toggle Logic: 
  // If current is 'right' (default) -> switch to 'left' (Push Left->Right)
  // If current is 'left' -> switch to 'right' (Cancel Push)
  const toggleBlock = (blockId: string) => {
      setMergeState(prev => {
          const current = prev[blockId] || 'right';
          return {
              ...prev,
              [blockId]: current === 'right' ? 'left' : 'right'
          };
      });
  };

  const revertAll = () => {
      // "Revert All" = "Push Left to Right" for ALL blocks
      const newState: Record<string, 'left' | 'right'> = {};
      diffRows.forEach(r => r.blockId && (newState[r.blockId] = 'left'));
      setMergeState(newState);
  };

  const acceptAll = () => {
      // "Accept All" = Keep Modified (Right) for ALL blocks -> Reset state
      setMergeState({});
  };
  
  const mergedText = useMemo(() => {
     if (diffRows.length === 0) return "";
     return diffRows.map((row) => {
         const selection = row.blockId ? (mergeState[row.blockId] || 'right') : 'right';
         if (selection === 'right') {
             return row.rightType === 'empty' ? null : row.rightContent;
         } else {
             return row.leftType === 'empty' ? null : row.leftContent;
         }
     })
     .filter(line => line !== null)
     .join('\n');
  }, [diffRows, mergeState]);

  const copyMerged = () => {
      navigator.clipboard.writeText(mergedText);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
         <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitCompare className="w-8 h-8 text-cyan-600" />
            {t('tools_ui.diff_checker.title')}
         </h1>
         <div className="flex gap-3">
             <button 
                onClick={clear} 
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
             >
                 <Trash2 className="w-4 h-4" /> {t('tools_ui.common.clear')}
             </button>
             <button
                 onClick={loadSample}
                 className="px-4 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 flex items-center gap-2"
             >
                 {t('tools_ui.common.load_sample')}
             </button>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[300px] mb-8 relative items-center">
        {/* Original */}
        <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex-1 h-full w-full">
             <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('tools_ui.diff_checker.original_label')}</span>
             </div>
             <textarea 
                className="flex-grow p-4 outline-none resize-none font-mono text-xs leading-5 bg-white"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder={t('tools_ui.diff_checker.original_placeholder')}
                spellCheck={false}
             />
        </div>

        {/* Swap */}
        <button 
            onClick={handleSwap}
            className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 hover:text-cyan-600 transition-colors z-10 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
            title="Swap Inputs"
        >
            <ArrowRightLeft className="w-5 h-5" />
        </button>

        {/* Modified */}
        <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex-1 h-full w-full">
             <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('tools_ui.diff_checker.modified_label')}</span>
             </div>
             <textarea 
                className="flex-grow p-4 outline-none resize-none font-mono text-xs leading-5 bg-white"
                value={modified}
                onChange={(e) => setModified(e.target.value)}
                placeholder={t('tools_ui.diff_checker.modified_placeholder')}
                spellCheck={false}
             />
        </div>
      </div>

      <div className="flex justify-center mb-8">
            <button
                onClick={handleDifference}
                className="flex items-center gap-2 px-8 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20 text-lg"
            >
                <GitCompare className="w-5 h-5" /> {t('tools_ui.diff_checker.find_diff')}
            </button>
      </div>

      {diffRows.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mb-12">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('tools_ui.diff_checker.result_title')}</span>
                    <div className="flex gap-2">
                         {computedStats.removals > 0 && (
                             <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                 -{computedStats.removals} removals
                             </span>
                         )}
                         {computedStats.additions > 0 && (
                             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                 +{computedStats.additions} additions
                             </span>
                         )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto">
                       <button onClick={revertAll} className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1.5 shadow-sm">
                          <RotateCcw className="w-3.5 h-3.5" /> {t('tools_ui.diff_checker.revert_all')}
                      </button>
                      <button onClick={acceptAll} className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1.5 shadow-sm">
                          <Check className="w-3.5 h-3.5" /> {t('tools_ui.diff_checker.accept_all')}
                      </button>
                      <div className="h-6 w-px bg-gray-300 mx-2"></div>
                       <button onClick={copyMerged} className="px-4 py-1.5 text-xs font-bold bg-cyan-600 text-white rounded-md hover:bg-cyan-700 flex items-center gap-1.5 shadow-sm shadow-cyan-600/20">
                          <Copy className="w-3.5 h-3.5" /> {t('tools_ui.diff_checker.copy_merged')}
                      </button>
                  </div>
              </div>
              <div className="font-mono text-xs leading-5 overflow-x-auto">
                  <table className="w-full border-collapse">
                      <colgroup>
                          <col width="40px" />
                          <col width="50%" />
                          <col width="50px" />
                          <col width="40px" />
                          <col width="50%" />
                      </colgroup>
                      <tbody>
                          {diffRows.map((row, idx) => {
                              const blockId = row.blockId;
                              const selection = blockId ? (mergeState[blockId] || 'right') : 'right';
                              const isModified = row.leftType !== 'unchanged' || row.rightType !== 'unchanged';
                              const isBlockStart = blockId && (idx === 0 || diffRows[idx - 1].blockId !== blockId);
                              
                              // Visual Logic:
                              // If selection is 'right' (Default):
                              //   - Left (Original): Shows Opacity 50? (It's not being used)
                              //   - Right (Revised): Shows Normal Opacity. Content is RightContent.
                              
                              // If selection is 'left' (Reverted):
                              //   - Left (Original): Shows Normal Opacity. 
                              //   - Right (Revised): Shows Normal Opacity. Content is LeftContent (To visualize the value coming over).
                              
                              // Wait, "move to corresponding rightside line" = user expects Right side to CHANGE.
                              // So we must render the 'Merged' content in the Right Panel? 
                              // OR we just assume Right Panel = Merged Panel.
                              
                              let rightRenderContent = row.rightContent;
                              let rightRenderType: string = row.rightType;
                              let leftRenderOpacity = 'opacity-100';
                              
                              if (selection === 'left' && isModified) {
                                  // We are using Left content.
                                  // So Right Panel should show Left Content?
                                  // Yes, that's what "Move to Right" means.
                                  rightRenderContent = row.leftContent;
                                  // If left was 'removed', and we copy it to right, it means we are 'removing' it from right? 
                                  // No, if Left is "Old", Right is "New".
                                  // If Old was "Foo" and New is "Bar".
                                  // Revert means we want "Foo".
                                  // So Right becomes "Foo".
                                  // And type? It's effectively "unchanged" relative to Left, but relative to the Diff Result?
                                  // Let's just show the content.
                                  rightRenderType = row.leftType === 'removed' ? 'removed' : 'unchanged'; // Color it like the source?
                                  
                                  // Actually, if we Revert, the "Diff" is effectively gone for that block in the final result?
                                  // But visually we want to show that we pulled it over.
                                  // Let's stick to showing the Left Content in the Right Panel.
                                  // And maybe yellow/modified background? Or just clean?
                                  // If we pull it over, it matches the Left. So it's effectively "Unchanged".
                              }

                              return (
                                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 group">
                                      {/* Left Side */}
                                      <td className={`text-right pr-3 select-none text-gray-400 border-r border-gray-100 ${row.leftType === 'removed' ? 'bg-red-50' : 'bg-white'}`}>
                                          {row.leftLineNumber}
                                      </td>
                                      <td className={`pl-2 pr-2 whitespace-pre-wrap break-all ${row.leftType === 'removed' ? 'bg-red-50 text-red-900' : 'text-gray-600'} ${selection === 'right' && isModified ? 'opacity-60' : ''}`}>
                                          {row.leftContent || ' '}
                                      </td>

                                      {/* Gutter / Arrow */}
                                      <td className="text-center bg-gray-50/30 border-l border-r border-gray-100 p-0 align-middle">
                                          {isBlockStart && (
                                              <button 
                                                onClick={() => blockId && toggleBlock(blockId)}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm mx-auto ${
                                                    selection === 'left' 
                                                    ? 'bg-green-600 text-white ring-2 ring-green-100 scale-110' // Active: Solid Green
                                                    : 'bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-300' // Inactive: Outline
                                                }`}
                                                title={selection === 'left' ? t('tools_ui.diff_checker.status_reverted') : t('tools_ui.diff_checker.status_modified')}
                                              >
                                                  <ArrowRight className="w-3.5 h-3.5" />
                                              </button>
                                          )}
                                      </td>
                                      
                                      {/* Right Side */}
                                      <td className={`text-right pr-3 select-none text-gray-400 border-r border-gray-100 ${rightRenderType === 'added' ? 'bg-green-50' : 'bg-white'}`}>
                                          {row.rightLineNumber}
                                      </td>
                                      <td className={`pl-2 pr-2 whitespace-pre-wrap break-all ${rightRenderType === 'added' ? 'bg-green-50 text-green-900' : 'text-gray-600'}`}>
                                          {rightRenderContent || ' '}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
}
