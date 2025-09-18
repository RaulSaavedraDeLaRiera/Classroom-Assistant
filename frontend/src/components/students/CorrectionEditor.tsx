import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Custom components for ReactMarkdown
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-6">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-2xl font-bold text-gray-900 mb-5 mt-5">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-xl font-bold text-gray-900 mb-4 mt-4">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-lg font-bold text-gray-900 mb-3 mt-3">{children}</h4>,
  h5: ({ children }: any) => <h5 className="text-base font-bold text-gray-900 mb-2 mt-2">{children}</h5>,
  h6: ({ children }: any) => <h6 className="text-sm font-bold text-gray-900 mb-2 mt-2">{children}</h6>,
  p: ({ children, ...props }: any) => {
    return <p className="mb-4 text-gray-700 leading-relaxed text-base" {...props}>{children}</p>;
  },
  ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-gray-700 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="mb-2 leading-relaxed">{children}</li>,
  code: ({ children }: any) => (
    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-gray-100 text-gray-800 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4 py-2">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border border-gray-300">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-gray-300 bg-gray-100 px-4 py-3 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-gray-300 px-4 py-3">
      {children}
    </td>
  ),
  hr: ({ children }: any) => (
    <hr className="my-6 border-gray-300" />
  ),
  input: ({ type, checked, ...props }: any) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          className="mr-2"
          readOnly
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  }
};

// New CorrectionPreview component for the new evaluation view
export function CorrectionPreview({
  content,
  onSave,
  onCancel,
  isOpen,
  maxScore = 10,
  currentScore,
  isExtra = false,
  onMaxScoreChange,
  isReviewed = false,
  currentStatus = 'ready'
}: {
  content: string;
  onSave: (correctedContent: string, score?: number | null) => void;
  onCancel: () => void;
  isOpen: boolean;
  maxScore?: number;
  currentScore?: number;
  isExtra?: boolean;
  onMaxScoreChange?: (newMaxScore: number) => void;
  isReviewed?: boolean;
  currentStatus?: string;
}) {
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [editableParts, setEditableParts] = useState<any[]>([]);
  const [selectedText, setSelectedText] = useState<{ text: string; range: Range } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState<string>('');
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [markAsReviewed, setMarkAsReviewed] = useState(false);
  const [editingMaxScore, setEditingMaxScore] = useState(false);
  const [tempMaxScore, setTempMaxScore] = useState(maxScore.toString());
  const [localStatus, setLocalStatus] = useState(currentStatus);

  type EditablePartType = 'text' | 'teacher' | 'student' | 'professor' | 'checkbox';

  // Function to get status color and text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'in_progress':
        return { text: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'reviewed':
        return { text: 'Reviewed', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'ready':
        return { text: 'Ready', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      case 'blocked':
        return { text: 'Blocked', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'pending':
        return { text: 'Pending', color: 'bg-gray-200 text-gray-800 border-gray-300' };
      default:
        return { text: 'Ready', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  useEffect(() => {
    setEditedContent(content);
    parseEditableParts(content);
    
    // Initialize with current score if available
    if (currentScore !== undefined && currentScore > 0) {
      setScore(currentScore.toString());
    } else {
      setScore('');
    }
    
    // Initialize with reviewed status (separate from completed)
    // This will be true if the exercise is already reviewed
    setMarkAsReviewed(isReviewed);
    
    // Initialize local status
    setLocalStatus(currentStatus);
  }, [content, currentScore, isReviewed, currentStatus]);

  // Update tempMaxScore when maxScore prop changes
  useEffect(() => {
    setTempMaxScore(maxScore.toString());
    console.log('CorrectionEditor: maxScore prop changed to:', maxScore);
  }, [maxScore]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuPosition) {
        const target = event.target as Element;
        if (!target.closest('.context-menu')) {
          setSelectedText(null);
          setContextMenuPosition(null);
        }
      }
    };

    if (contextMenuPosition) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenuPosition]);

  const parseEditableParts = (text: string) => {
    console.log('Parsing content:', text);
    const parts: Array<{
      id: string;
      type: EditablePartType;
      content: string;
      original: string;
      bracket: string;
      isEditing?: boolean;
    }> = [];

    let currentIndex = 0;
    let partId = 0;

    // Process text step by step to handle markers correctly
    while (currentIndex < text.length) {
      let nextMarkerIndex = text.length;
      let nextMarkerType: EditablePartType | null = null;
      let nextMarkerLength = 0;

      // Find all possible markers from current position
      const markers = [
        { type: 'professor' as const, start: text.indexOf('$', currentIndex) },
        { type: 'teacher' as const, start: text.indexOf('&', currentIndex) },
        { type: 'student' as const, start: text.indexOf('{', currentIndex) },
        { type: 'checkbox' as const, start: text.indexOf('[', currentIndex) }
      ];

      // Find the closest marker
      let closestMarker = null;
      let closestIndex = text.length;

      for (const marker of markers) {
        if (marker.start !== -1 && marker.start < closestIndex) {
          closestMarker = marker;
          closestIndex = marker.start;
        }
      }

      if (closestMarker) {
        nextMarkerIndex = closestIndex;

        if (closestMarker.type === 'professor') {
          // Find the closing $
          const endMarker = text.indexOf('$', closestIndex + 1);
          if (endMarker !== -1) {
            nextMarkerType = 'professor';
            nextMarkerLength = endMarker - closestIndex + 1;
          }
        } else if (closestMarker.type === 'teacher') {
          // Find the closing &
          const endMarker = text.indexOf('&', closestIndex + 1);
          if (endMarker !== -1) {
            nextMarkerType = 'teacher';
            nextMarkerLength = endMarker - closestIndex + 1;
          }
        } else if (closestMarker.type === 'student') {
          // Find the closing }
          const endMarker = text.indexOf('}', closestIndex + 1);
          if (endMarker !== -1) {
            nextMarkerType = 'student';
            nextMarkerLength = endMarker - closestIndex + 1;
          }
        } else if (closestMarker.type === 'checkbox') {
          // Check if it's a valid checkbox
          const potentialCheckbox = text.substr(closestIndex, 3);
          if (potentialCheckbox.match(/^\[[ x]\]$/)) {
            nextMarkerType = 'checkbox';
            nextMarkerLength = 3;
          }
        }
      }

      // If no marker found from current position, push remaining text ONCE and break
      if (!nextMarkerType) {
        if (currentIndex < text.length) {
          parts.push({
            id: `text-${partId++}`,
            type: 'text',
            content: text.slice(currentIndex),
            original: text.slice(currentIndex),
            bracket: ''
          });
        }
        break;
      }

      // Add text before the found marker
      if (nextMarkerIndex > currentIndex) {
        parts.push({
          id: `text-${partId++}`,
          type: 'text',
          content: text.slice(currentIndex, nextMarkerIndex),
          original: text.slice(currentIndex, nextMarkerIndex),
          bracket: ''
        });
      }

      // Process the marker
      if (nextMarkerType) {
        const markerText = text.slice(nextMarkerIndex, nextMarkerIndex + nextMarkerLength);

        if (nextMarkerType === 'checkbox') {
          parts.push({
            id: `checkbox-${partId++}`,
            type: 'checkbox',
            content: markerText,
            original: markerText,
            bracket: markerText,
            isEditing: false
          });
        } else if (nextMarkerType === 'professor') {
          // Professor area with content between $ markers
          const cleanContent = markerText.slice(1, -1); // Remove the $ from both ends
          console.log('Professor area found:', { markerText, cleanContent });
          parts.push({
            id: `professor-${partId++}`,
            type: 'professor',
            content: cleanContent,
            original: cleanContent,
            bracket: markerText,
            isEditing: false
          });
        } else {
          const cleanContent = markerText.slice(1, -1);
          parts.push({
            id: `${nextMarkerType}-${partId++}`,
            type: nextMarkerType,
            content: cleanContent,
            original: cleanContent,
            bracket: markerText,
            isEditing: false // Only professor areas are editable by default
          });
        }

        currentIndex = nextMarkerIndex + nextMarkerLength;
      }
    }

    setEditableParts(parts);
  };

  // Rebuild content from editable parts to keep textarea and inline edits in sync
  const buildContentFromParts = (parts: any[]) => {
    let result = '';
    parts.forEach(part => {
      if (part.type === 'text') {
        result += part.content;
      } else if (part.type === 'professor') {
        result += `$${part.content}$`;
      } else if (part.type === 'teacher') {
        result += `&${part.content}&`;
      } else if (part.type === 'student') {
        result += `{${part.content}}`;
      } else if (part.type === 'checkbox') {
        result += part.content;
      }
    });
    return result;
  };

  const handlePartEdit = (partId: string, newContent: string) => {
    setEditableParts(prev => {
      const updated = prev.map(part =>
        part.id === partId
          ? { ...part, content: newContent, isEditing: true }
          : part
      );
      setEditedContent(buildContentFromParts(updated));
      return updated;
    });
  };

  const getTextareaRows = (content: string) => {
    return Math.max(1, content.split('\n').length);
  };

  const togglePartEditing = (partId: string) => {
    setEditableParts(prev => prev.map(part =>
      part.id === partId
        ? { ...part, isEditing: !part.isEditing }
        : part
    ));
  };

  const handleCheckboxToggle = (partId: string) => {
    setEditableParts(prev => {
      const updated = prev.map(part => {
        if (part.id === partId && part.type === 'checkbox') {
          const isChecked = part.content.includes('x');
          const newContent = isChecked ? part.content.replace('x', ' ') : part.content.replace(' ', 'x');
          return { ...part, content: newContent };
        }
        return part;
      });
      setEditedContent(buildContentFromParts(updated));
      return updated;
    });
  };

  // Compose content at save time from current parts
  const getContentForSave = () => buildContentFromParts(editableParts);

  // Handle text selection
  const handleTextSelection = (event: React.MouseEvent, partId: string) => {
    console.log('[handleTextSelection] Called for partId:', partId);
    const selection = window.getSelection();
    console.log('[handleTextSelection] Selection:', selection);
    
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      console.log('[handleTextSelection] Selected text:', selectedText);
      
      if (selectedText) {
        const range = selection.getRangeAt(0);
        console.log('[handleTextSelection] Setting selected text and context menu');
        setSelectedText({ text: selectedText, range });
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
      } else {
        console.log('[handleTextSelection] No text selected or empty selection');
      }
    } else {
      console.log('[handleTextSelection] No selection or range count is 0');
    }
  };

  // Apply formatting to selected text
  const applyFormatting = (format: 'strikethrough' | 'italic' | 'remove') => {
    console.log('[applyFormatting] Called with format:', format);
    console.log('[applyFormatting] Selected text:', selectedText);
    
    if (!selectedText) {
      console.log('[applyFormatting] No selected text, returning');
      return;
    }

    // Find the part that contains the selected text (more flexible matching)
    const part = editableParts.find(part => {
      if (part.type !== 'student') return false;
      
      // Clean both the part content and selected text for comparison
      const cleanPartContent = part.content.replace(/~~/g, '').replace(/\*/g, '');
      const cleanSelectedText = selectedText.text.replace(/~~/g, '').replace(/\*/g, '');
      
      return cleanPartContent.includes(cleanSelectedText);
    });

    console.log('[applyFormatting] Found part:', part ? { id: part.id, content: part.content } : 'No part found');

    if (part) {
      const selectedTextStr = selectedText.text;
      
      console.log('[applyFormatting] Original content:', part.content);
      console.log('[applyFormatting] Selected text string:', selectedTextStr);
      
      // Find complete words that contain the selected text
      const cleanContent = part.content.replace(/~~/g, '').replace(/\*/g, '');
      const words = cleanContent.split(/(\s+)/); // Split by whitespace but keep separators
      
      // Find which words are affected by the selection
      const affectedWords = [];
      let currentPos = 0;
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.trim() && !/^\s+$/.test(word)) { // Only process non-whitespace words
          const wordStart = currentPos;
          const wordEnd = currentPos + word.length;
          const selectionStart = cleanContent.indexOf(selectedTextStr);
          const selectionEnd = selectionStart + selectedTextStr.length;
          
          // Check if selection overlaps with this word
          if (selectionStart < wordEnd && selectionEnd > wordStart) {
            affectedWords.push({
              word: word,
              index: i,
              originalWord: part.content.split(/(\s+)/)[i] // Get original word with formatting
            });
          }
        }
        currentPos += word.length;
      }
      
      console.log('[applyFormatting] Affected words:', affectedWords);
      
      // Apply formatting to each affected word
      let newContent = part.content;
      
      for (const affectedWord of affectedWords) {
        const originalWord = affectedWord.originalWord;
        const cleanWord = affectedWord.word;
        
        // Remove existing formatting from the word
        const cleanWordText = cleanWord.replace(/~~/g, '').replace(/\*/g, '');
        
        let formattedWord = cleanWordText;
        if (format === 'strikethrough') {
          formattedWord = `~~${cleanWordText}~~`;
        } else if (format === 'italic') {
          formattedWord = `*${cleanWordText}*`;
        } else if (format === 'remove') {
          formattedWord = cleanWordText; // Just the clean text without any formatting
        }
        
        // Replace the original word (with any existing formatting) with the new formatted word
        const escapedOriginalWord = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOriginalWord, 'g');
        newContent = newContent.replace(regex, formattedWord);
        
        console.log('[applyFormatting] Replaced word:', originalWord, '->', formattedWord);
      }
      
      console.log('[applyFormatting] New content after replacement:', newContent);
      
      handlePartEdit(part.id, newContent);
    }

    setSelectedText(null);
    setContextMenuPosition(null);
  };

  const renderEditablePart = (part: any) => {
    if (part.type === 'text') {
      // Process markdown for text parts
      return (
        <span key={part.id} className="text-gray-600 inline">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ...markdownComponents,
              p: ({ children }: any) => <span>{children}</span>
            }}
          >
            {part.content}
          </ReactMarkdown>
        </span>
      );
    }

    if (part.type === 'checkbox') {
      return (
        <span key={part.id} className="inline-flex items-center mx-1">
          <input
            type="checkbox"
            checked={part.content.includes('x')}
            onChange={() => handleCheckboxToggle(part.id)}
            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
          />
        </span>
      );
    }

    if (part.type === 'student') {
      return (
        <span key={part.id} className="inline mx-2 my-2">
          <span
            className="bg-gray-800 border-2 border-gray-600 rounded px-4 py-3 text-white font-semibold cursor-text select-text inline-block shadow-md min-h-[2rem]"
            onMouseUp={(e) => handleTextSelection(e, part.id)}
            title="Student editable area - student can write here"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                ...markdownComponents,
                p: ({ children }: any) => <span className="leading-relaxed">{children}</span>
              }}
            >
              {part.content || 'Student response'}
            </ReactMarkdown>
          </span>
        </span>
      );
    }

    if (part.type === 'professor') {
      return (
        <span key={part.id} className="inline mx-2 my-2">
          {part.isEditing ? (
            <textarea
              value={part.content}
              onChange={(e) => handlePartEdit(part.id, e.target.value)}
              onBlur={() => togglePartEditing(part.id)}
              rows={getTextareaRows(part.content)}
              className="inline-block min-w-[200px] px-4 py-3 bg-red-50 border-2 border-red-400 rounded text-red-800 font-medium focus:outline-none focus:border-red-500 focus:bg-red-100 resize-none leading-relaxed"
              placeholder="Write your feedback here..."
              autoFocus
            />
          ) : (
            <span
              onClick={() => togglePartEditing(part.id)}
              className="inline-block px-4 py-3 bg-red-100 border-2 border-red-300 rounded text-gray-800 font-bold cursor-pointer hover:bg-red-200 transition-colors min-h-[2rem] leading-relaxed"
              title="Click to edit feedback"
            >
              {part.content || 'teacher feedback'}
            </span>
          )}
        </span>
      );
    }

    if (part.type === 'teacher') {
      return (
        <span key={part.id} className="inline mx-2 my-2">
          {part.isEditing ? (
            <textarea
              value={part.content}
              onChange={(e) => handlePartEdit(part.id, e.target.value)}
              onBlur={() => togglePartEditing(part.id)}
              className="inline-block min-w-[200px] px-4 py-3 bg-orange-50 border-2 border-orange-400 rounded text-orange-800 font-medium focus:outline-none focus:border-orange-500 focus:bg-orange-100 resize-none leading-relaxed"
              placeholder="Write your correction here..."
              autoFocus
            />
          ) : (
            <span
              onClick={() => togglePartEditing(part.id)}
              className="inline-block px-4 py-3 bg-orange-100 border-2 border-orange-300 rounded text-gray-800 font-bold cursor-pointer hover:bg-orange-200 transition-colors min-h-[2rem] leading-relaxed"
              title="Click to edit correction"
            >
              {part.content || 'correction'}
            </span>
          )}
        </span>
      );
    }

    return null;
  };

  const renderPreviewContent = () => {
    return (
      <div className="bg-gray-100 p-8 rounded-lg min-h-[60vh]">
        <div className="prose prose-lg max-w-none">
          <div className="inline">
            {editableParts.map(part => renderEditablePart(part))}
          </div>
        </div>

        {/* Context Menu for Text Formatting */}
        {contextMenuPosition && selectedText && (
          <div
            className="context-menu fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2"
            style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          >
            <div className="text-xs text-gray-600 mb-2 px-2 py-1 bg-gray-50 rounded">
              Format selected text:
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => applyFormatting('strikethrough')}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300"
                title="Mark as incorrect"
              >
                ❌ Strikethrough
              </button>
              <button
                onClick={() => applyFormatting('italic')}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border border-blue-300"
                title="Emphasize text"
              >
                ✏️ Italic
              </button>
              <button
                onClick={() => applyFormatting('remove')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300"
                title="Remove all formatting"
              >
                🧹 Remove Format
              </button>
              <button
                onClick={() => {
                  setSelectedText(null);
                  setContextMenuPosition(null);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Exercise Evaluation</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Review student work and provide corrections
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Score Input */}
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Score:</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                min="0"
                max={maxScore}
                step="0.1"
                className="w-16 sm:w-20 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <span className="text-xs sm:text-sm text-gray-500">/</span>
              {/* Editable max score for extra exercises */}
              {isExtra && onMaxScoreChange ? (
                <div className="relative">
                  <input
                    type="number"
                    value={tempMaxScore}
                    onChange={(e) => {
                      setTempMaxScore(e.target.value);
                      // Auto-save when value changes
                      const newMaxScore = parseInt(e.target.value);
                      if (newMaxScore >= 1 && newMaxScore <= 100) {
                        onMaxScoreChange(newMaxScore);
                      }
                    }}
                    onBlur={() => {
                      // Also save on blur
                      const newMaxScore = parseInt(tempMaxScore);
                      if (newMaxScore >= 1 && newMaxScore <= 100) {
                        onMaxScoreChange(newMaxScore);
                      }
                    }}
                    min="1"
                    max="100"
                    className="w-12 sm:w-16 px-2 py-1 text-xs sm:text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
                    title="Edit max score (only for extra exercises)"
                  />
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500 font-medium">{maxScore}</span>
              )}
            </div>
            
            {/* Status Display Button - Shows current status */}
            <button
              className={`px-2 py-1 text-xs font-medium rounded transition-colors border ${getStatusDisplay(localStatus).color}`}
              title="Current status"
            >
              <span className="hidden sm:inline">{getStatusDisplay(localStatus).text}</span>
              <span className="sm:hidden">{getStatusDisplay(localStatus).text.charAt(0)}</span>
            </button>
            
            {/* Dynamic Review Button - Toggle review status */}
            <button
              onClick={() => {
                if (markAsReviewed) {
                  // Remove review - goes back to ready
                  setMarkAsReviewed(false);
                  setScore('');
                  setLocalStatus('ready');
                } else {
                  // Mark as reviewed
                  setMarkAsReviewed(true);
                  setLocalStatus('reviewed');
                }
              }}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                markAsReviewed 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
              title={markAsReviewed ? 'Remove review (goes to ready)' : 'Mark as reviewed'}
            >
              <span className="hidden sm:inline">{markAsReviewed ? 'Remove Reviewed' : 'Mark as Reviewed'}</span>
              <span className="sm:hidden">{markAsReviewed ? 'Remove' : 'Review'}</span>
            </button>
            
            <button
              onClick={onCancel}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button
            onClick={() => {
              if (isSaving) return;
              setIsSaving(true);
              try {
                const correctedContent = getContentForSave();
                let numericScore: number | null | undefined = undefined;
                
                if (markAsReviewed && score.trim() !== '') {
                  numericScore = parseFloat(score);
                } else if (!markAsReviewed) {
                  // If unchecked, remove evaluation
                  numericScore = null;
                }
                
                onSave(correctedContent, numericScore);
              } finally {
                // Allow next save attempt after a tick; parent will close modal on success
                setTimeout(() => setIsSaving(false), 300);
              }
            }}
              className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Save
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {renderPreviewContent()}
        </div>

        {/* Footer with instructions - Hidden on mobile */}
        <div className="hidden sm:block p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded mt-0.5"></div>
              <div>
                <div className="font-medium text-gray-900">Background</div>
                <div className="text-gray-600">Exercise content area</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-gray-800 rounded mt-0.5"></div>
              <div>
                <div className="font-medium text-gray-900">Student Content</div>
                <div className="text-gray-600">Student answers and responses</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded mt-0.5"></div>
              <div>
                <div className="font-medium text-gray-900">Professor Corrections</div>
                <div className="text-gray-600">Click to add corrections</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-red-500 rounded mt-0.5"></div>
              <div>
                <div className="font-medium text-gray-900">Teacher Feedback</div>
                <div className="text-gray-600">Click to add feedback</div>
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Select text in student areas to apply formatting (strikethrough for corrections, italic for emphasis)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CorrectionEditorProps {
  content: string;
  onSave: (correctedContent: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function CorrectionEditor({
  content,
  onSave,
  onCancel,
  isOpen
}: CorrectionEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  // Parse content to identify editable parts (teacher & and student {})
  const parseEditableParts = (text: string) => {
    const parts: Array<{ type: 'text' | 'teacher' | 'student', content: string, original: string, bracket: string }> = [];
    let currentIndex = 0;

    // Regex to find editable parts: &content& (teacher) or {content} (student)
    const editableRegex = /(&[^&]*&|\{[^}]*\})/g;
    let match;

    while ((match = editableRegex.exec(text)) !== null) {
      // Add text before the editable part
      if (match.index > currentIndex) {
        parts.push({
          type: 'text',
          content: text.slice(currentIndex, match.index),
          original: text.slice(currentIndex, match.index),
          bracket: ''
        });
      }

      // Determine if it's teacher & or student {} part
      const isTeacherPart = match[0].startsWith('&');
      const bracketContent = match[1];

      // For teacher parts, remove the & from the content
      const cleanContent = isTeacherPart ? bracketContent : match[1];

      parts.push({
        type: isTeacherPart ? 'teacher' : 'student',
        content: cleanContent,
        original: cleanContent,
        bracket: isTeacherPart ? '&&' : '{}'
      });

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(currentIndex),
        original: text.slice(currentIndex),
        bracket: ''
      });
    }

    return parts;
  };

  // Render content with editable parts highlighted (teacher & and student {})
  const renderEditableContent = (text: string) => {
    const parts = parseEditableParts(text);

    return parts.map((part, index) => {
      if (part.type === 'teacher') {
        return (
          <span
            key={index}
            className="bg-orange-100 border border-orange-300 rounded px-2 py-1 text-orange-800 font-medium inline-block mx-1"
            title="Teacher correction area - you can write corrections and feedback here"
          >
            <span className="text-xs text-orange-600 font-bold mr-1">🖊️</span>
            {part.content}
          </span>
        );
      }
      if (part.type === 'student') {
        return (
          <span
            key={index}
            className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-blue-800 font-medium inline-block mx-1"
            title="Student editable area - student can write here"
          >
            <span className="text-xs text-blue-600 font-bold mr-1">✏️</span>
            {part.content}
          </span>
        );
      }
      return <span key={index}>{part.content}</span>;
    });
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Exercise Correction Editor</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Correct student work and provide feedback in designated areas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
              <span className="sm:hidden">{showPreview ? 'Hide' : 'Show'}</span>
            </button>
            <button
              onClick={onCancel}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedContent)}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <span className="hidden sm:inline">Save Corrections</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
            <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">Editor</h3>
              <p className="text-xs text-gray-500 mt-1">
              </p>
            </div>
            <div className="flex-1 p-2 sm:p-4">
              <textarea
                value={editedContent}
                onChange={(e) => {
                  setEditedContent(e.target.value);
                  parseEditableParts(e.target.value);
                }}
                className="w-full h-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm resize-none"
                placeholder="Edit the exercise content..."
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">Live Preview</h3>
              <p className="text-xs text-gray-500 mt-1">
                See how your corrections will look
              </p>
            </div>
            <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
              <div className="bg-gray-100 p-2 sm:p-4 rounded-lg min-h-full">
                <div className="prose prose-xs sm:prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {editedContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="flex-1 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700">Preview</h3>
                <p className="text-xs text-gray-500 mt-1">
                  🖊️ Orange areas (& & ) for teacher corrections, ✏️ Blue areas ({ } ) for student responses.
                </p>
              </div>
              <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
                <div className="prose prose-xs sm:prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {editedContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with instructions - Hidden on mobile */}
        <div className="hidden p-3 sm:p-4 bg-blue-50 border-t border-blue-200">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 flex items-center gap-1">
                  <span>✏️</span> Student Areas (Curly Braces {})
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Areas marked with curly braces are where students can write their answers and responses.
                  These areas are highlighted in blue.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 flex items-center gap-1">
                  <span>🖊️</span> Teacher Correction Areas (& &)
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Areas marked with ampersands are for teacher corrections, feedback, and grading comments.
                  You can write here to provide corrections and messages to students. These areas are highlighted in orange.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Tip:</strong> Start writing &your correction here& directly - no need for empty brackets first!
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Use ampersands && for your corrections and curly braces {} for student responses.
                You can write corrections alongside student work to provide detailed feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

