import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExerciseContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  title?: string;
  showHeader?: boolean;
  showTabs?: boolean;
  className?: string;
}

export default function ExerciseContentEditor({
  content,
  onChange,
  onSave,
  onCancel,
  title = "Edit Exercise Content",
  showHeader = true,
  showTabs = false,
  className = ""
}: ExerciseContentEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showCommands, setShowCommands] = useState(true);
  const [localContent, setLocalContent] = useState(content);

  // Funciones para manejar cookies
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  // Cargar preferencia de cookies al montar el componente
  useEffect(() => {
    const savedPreference = getCookie('exerciseEditor_showCommands');
    if (savedPreference !== null) {
      setShowCommands(savedPreference === 'true');
    }
  }, []);

  // Sincronizar contenido local cuando cambie el prop content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Guardar preferencia cuando cambie
  const toggleCommands = () => {
    const newValue = !showCommands;
    setShowCommands(newValue);
    setCookie('exerciseEditor_showCommands', newValue.toString());
  };

  const markdownCommands = [
    '# Heading 1',
    '## Heading 2',
    '### Heading 3',
    '**Bold text**',
    '*Italic text*',
    '`Inline code`',
    '- List item',
    '1. Numbered item',
    '- [ ] Task',
    '- [x] Done',
    '$Teacher text$',
    '{Student text}',
    '$$Professor correction$$',
    '[Link](URL)',
    '![Image](url)',
    '> Quote',
    '---',
    '```\nCode block\n```',
    '| Header | Header |\n|--------|--------|\n| Cell   | Cell   |'
  ];

  const insertCommand = (command: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = localContent.substring(start, end);
      const newText = localContent.substring(0, start) + command + localContent.substring(end);
      setLocalContent(newText);

      // Set cursor position after the inserted command
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + command.length, start + command.length);
      }, 0);
    }
  };

  const renderMarkdownComponents = () => ({
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 text-gray-900 border-b border-gray-100 pb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 text-gray-900">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-base font-bold mb-2 text-gray-900">{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-sm font-bold mb-2 text-gray-900">{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-xs font-bold mb-2 text-gray-900">{children}</h6>,
    p: ({ children }: any) => {
      // Handle special text formatting: $text$ for professor (red), &text& for teacher (orange), {text} for student (blue)
      if (typeof children === 'string') {
        // Process professor text: $text$ (red) and teacher text: &text& (orange)
        let processedText = children.replace(/\$([^$]+)\$/g, (match, text) => {
          return `<span class="text-red-600 font-medium">${text}</span>`;
        });
        processedText = processedText.replace(/\&([^&]+)\&/g, (match, text) => {
          return `<span class="text-orange-600 font-medium">${text}</span>`;
        });

        // Process student text: {text}
        processedText = processedText.replace(/\{([^}]+)\}/g, (match, text) => {
          return `<span class="text-blue-600 font-medium">${text}</span>`;
        });

        if (processedText !== children) {
          return (
            <p
              className="mb-3 text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processedText }}
            />
          );
        }
      }

      return <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>;
    },
    ul: ({ children }: any) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
    li: ({ children, ...props }: any) => {
      // Handle task list items (checkboxes)
      const childrenArray = React.Children.toArray(children);
      const hasCheckbox = childrenArray.some((child: any) =>
        child && typeof child === 'object' && child.props && child.props.type === 'checkbox'
      );

      if (hasCheckbox) {
        return (
          <li className="text-gray-700 flex items-start gap-2 mb-2">
            <span className="flex-shrink-0 mt-1">{children}</span>
          </li>
        );
      }

      return <li className="text-gray-700 mb-2">{children}</li>;
    },
    code: ({ children, className }: any) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
      ) : (
        <code className="block bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto text-gray-800">{children}</code>
      );
    },
    pre: ({ children }: any) => <pre className="bg-gray-100 p-3 rounded overflow-x-auto mb-3 text-sm">{children}</pre>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-300 pl-4 italic text-gray-600 mb-3 bg-blue-50 py-2">{children}</blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse border border-gray-300">{children}</table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left text-gray-900">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="border border-gray-300 px-3 py-2 text-gray-700">{children}</td>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-gray-900">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-gray-800">{children}</em>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    img: ({ src, alt }: any) => (
      <img src={src} alt={alt} className="max-w-full h-auto rounded mb-3" />
    ),
    hr: () => <hr className="border-gray-300 my-4" />,
    input: ({ type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mr-2 rounded border-gray-300"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    }
  });

  const renderEditor = (forceShowCommands = true, isSideBySide = false) => (
    <div className="flex-1 flex flex-col">
      {/* Markdown Commands - only show if not side-by-side or if forced */}
      {!isSideBySide && (forceShowCommands || showCommands) && (
        <div className="p-3 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-2">
            {markdownCommands.map((command, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertCommand(command)}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                title={command}
              >
                {command.length > 20 ? command.substring(0, 20) + '...' : command}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <textarea
        id="content-editor"
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        className="flex-1 p-4 border-0 resize-none focus:outline-none font-mono text-sm"
        placeholder="Write your exercise content here using Markdown..."
      />
    </div>
  );


  const renderPreviewContent = () => {
    if (!localContent) {
      return <p className="text-gray-400 italic">*No content to preview*</p>;
    }

    // Split content into lines to process checkboxes
    const lines = localContent.split('\n');
    const processedLines = lines
      .filter(line => {
        // Skip lines that only contain $$, && or {} markers (with optional whitespace)
        const trimmedLine = line.trim();
        const isOnlyMarker = /^\s*\$\$*\s*$/.test(trimmedLine) || /^\s*\&\&*\s*$/.test(trimmedLine) || /^\s*\{\}*\s*$/.test(trimmedLine);
        return !isOnlyMarker && trimmedLine !== '';
      })
      .map((line, index) => {
      // Check if line is a task list item
      const taskMatch = line.match(/^- \[([ x]?)\] (.+)$/);
      if (taskMatch) {
        const isChecked = taskMatch[1].trim() === 'x';
        const text = taskMatch[2];
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <input
              type="checkbox"
              checked={isChecked}
              readOnly
              className="mt-1 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">{text}</span>
          </div>
        );
      }

      // Check for standalone checkboxes
      const checkboxMatch = line.match(/\[([ x]?)\]/);
      if (checkboxMatch && !line.includes('- [') && !line.includes('* [')) {
        const isChecked = checkboxMatch[1].trim() === 'x';
        const beforeCheckbox = line.substring(0, checkboxMatch.index);
        const afterCheckbox = line.substring(checkboxMatch.index! + checkboxMatch[0].length);

        return (
          <p key={index} className="mb-3 text-gray-700 leading-relaxed">
            {beforeCheckbox}
            <input
              type="checkbox"
              checked={isChecked}
              readOnly
              className="mx-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {afterCheckbox}
          </p>
        );
      }

      // Process teacher and student text
      if (line.includes('$') || line.includes('{')) {
        let processedLine = line;
        processedLine = processedLine.replace(/\$([^$]+)\$/g, (match, text) => {
          return `<span class="text-orange-600 font-medium">${text}</span>`;
        });
        processedLine = processedLine.replace(/\{([^}]+)\}/g, (match, text) => {
          return `<span class="text-blue-600 font-medium">${text}</span>`;
        });

        // Check if the processed line has meaningful content
        const textContent = processedLine.replace(/<[^>]*>/g, '').trim();
        if (textContent) {
          return (
            <p
              key={index}
              className="mb-3 text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processedLine }}
            />
          );
        }
        // If no meaningful content after processing markers, skip this line
        return null;
      }

      // Regular markdown line
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          components={renderMarkdownComponents()}
          skipHtml={false}
        >
          {line}
        </ReactMarkdown>
      );
    });

    // Filter out null elements (lines that were skipped)
    const filteredLines = processedLines.filter(line => line !== null);

    return <div className="prose prose-sm max-w-none">{filteredLines}</div>;
  };

  const renderPreview = () => (
    <div className="flex-1 p-4 overflow-y-auto max-h-full">
      {renderPreviewContent()}
    </div>
  );

  const editorContent = (
    <div className={`bg-white rounded-lg w-full max-w-6xl h-[80vh] flex flex-col ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(localContent);
                onSave();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {showTabs && (
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'edit'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Preview
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {showTabs ? (
          activeTab === 'edit' ? renderEditor(true, false) : renderPreview()
        ) : (
          // Sin tabs - mostrar editor y preview lado a lado
          <>
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0 min-h-14">
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Editor</h4>
                    <button
                      type="button"
                      onClick={toggleCommands}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      title={showCommands ? "Hide commands" : "Show commands"}
                    >
                      <span>{showCommands ? "Hide" : "Show"} commands</span>
                      <span className={`transform transition-transform ${showCommands ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                  </div>
                  {showCommands && (
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {markdownCommands.map((command, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => insertCommand(command)}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 whitespace-nowrap"
                          title={command}
                        >
                          {command.length > 15 ? command.substring(0, 15) + '...' : command}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                {renderEditor(false, true)}
              </div>
            </div>
            <div className="w-1/2 flex flex-col h-full">
              <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0 min-h-14">
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-700">Preview</h4>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                {renderPreview()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Si showHeader es false, devolver solo el contenido del editor
  if (!showHeader) {
    return editorContent;
  }

  // Si showHeader es true, devolver con overlay modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      {editorContent}
    </div>
  );
}