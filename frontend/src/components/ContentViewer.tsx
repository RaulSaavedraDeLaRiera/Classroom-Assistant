import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentViewerProps {
  content: string;
  title?: string;
  className?: string;
}

export default function ContentViewer({ content, title, className = "" }: ContentViewerProps) {
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
            className="mt-1 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    }
  });

  const renderPreviewContent = () => {
    if (!content) {
      return <p className="text-gray-400 italic">*No content to preview*</p>;
    }

    // Split content into lines to process checkboxes
    const lines = content.split('\n');
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
          return `<span class="text-red-600 font-medium">${text}</span>`;
        });
        processedLine = processedLine.replace(/\&([^&]+)\&/g, (match, text) => {
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

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {renderPreviewContent()}
      </div>
    </div>
  );
}
