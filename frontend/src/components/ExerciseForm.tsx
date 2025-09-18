import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ExerciseContentEditor from './course/ExerciseContentEditor';

interface ExerciseFormProps {
  exercise?: any;
  isEditing: boolean;
  onSubmit: (exerciseData: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  availableModules?: any[];
  title?: string;
  submitText?: string;
  showModuleAssignment?: boolean;
}

export default function ExerciseForm({
  exercise,
  isEditing,
  onSubmit,
  onCancel,
  loading,
  availableModules = [],
  title = "Exercise Form",
  submitText = "Save Exercise",
  showModuleAssignment = false
}: ExerciseFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'quiz',
    difficulty: 'beginner',
    estimatedTime: 0,
    tags: [] as string[]
  });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{command: string, description: string, insert: string}>>([]);
  const [tagInput, setTagInput] = useState('');

  // Comandos de markdown disponibles
  const markdownCommands = [
    { command: '/h1', description: 'Main title', insert: '# ' },
    { command: '/h2', description: 'Subtitle', insert: '## ' },
    { command: '/h3', description: 'Section', insert: '### ' },
    { command: '/bold', description: 'Bold text', insert: '**text**' },
    { command: '/italic', description: 'Italic text', insert: '*text*' },
    { command: '/code', description: 'Inline code', insert: '`code`' },
    { command: '/list', description: 'Numbered list', insert: '1. ' },
    { command: '/bullet', description: 'Bullet list', insert: '- ' },
    { command: '/checkbox', description: 'Empty checkbox', insert: '- [ ] ' },
    { command: '/checked', description: 'Checked checkbox', insert: '- [x] ' },
    { command: '/quote', description: 'Blockquote', insert: '> ' },
    { command: '/table', description: 'Table', insert: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |' },
    { command: '/link', description: 'Link', insert: '[Link text](https://example.com)' },
    { command: '/image', description: 'Image', insert: '![Alt text](https://example.com/image.jpg)' },
    { command: '/codeblock', description: 'Code block', insert: '```\ncode here\n```' },
  ];

  useEffect(() => {
    if (exercise) {
      setFormData({
        title: exercise.title || '',
        description: exercise.description || exercise.body || '',
        content: exercise.content || exercise.body || '',
        type: exercise.type || 'quiz',
        difficulty: exercise.difficulty || 'beginner',
        estimatedTime: exercise.estimatedTime || 0,
        tags: exercise.tags || []
      });
      setCurrentExercise(exercise);
    }
  }, [exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const exerciseData = {
        ...formData,
        tags: formData.tags,
        estimatedTime: Number(formData.estimatedTime),
        content: formData.content,
        description: formData.description
      };

      await onSubmit(exerciseData);
    } catch (error) {
      console.error('Error submitting exercise:', error);
    }
  };

  const handleSaveContent = (updatedExercise: any) => {
    setCurrentExercise(updatedExercise);
    setFormData(prev => ({
      ...prev,
      content: updatedExercise.body || updatedExercise.content || prev.content,
      description: updatedExercise.body || updatedExercise.content || prev.description
    }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, content: value });
    
    // Detect if "/" was typed to show suggestions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastLine = textBeforeCursor.split('\n').pop() || '';
    
    if (lastLine.startsWith('/')) {
      const query = lastLine.substring(1).toLowerCase();
      const filtered = markdownCommands.filter(cmd => 
        cmd.command.substring(1).startsWith(query)
      );
      
      if (filtered.length > 0) {
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (command: any) => {
    const lines = formData.content.split('\n');
    const currentLineIndex = formData.content.split('\n').length - 1;
    const currentLine = lines[currentLineIndex];
    
    // Replace current line with command
    lines[currentLineIndex] = currentLine.replace(/^\/.*$/, command.insert);
    
    const newContent = lines.join('\n');
    setFormData({ ...formData, content: newContent });
    setShowSuggestions(false);
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exercise Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter exercise title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brief Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={2}
          placeholder="Short summary of the exercise (max 200 characters)"
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.description.length}/200 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exercise Type *
        </label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="quiz">Quiz</option>
          <option value="writing">Writing</option>
          <option value="reading">Reading</option>
          <option value="listening">Listening</option>
          <option value="speaking">Speaking</option>
          <option value="grammar">Grammar</option>
          <option value="vocabulary">Vocabulary</option>
          <option value="assignment">Assignment</option>
          <option value="project">Project</option>
          <option value="discussion">Discussion</option>
          <option value="presentation">Presentation</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Level *
        </label>
        <select
          required
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Time (minutes)
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={formData.estimatedTime}
          onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="15"
        />
      </div>



      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md">
          {formData.tags.map((tag, index) => (
            <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {tag}
              <button
                type="button"
                onClick={() => handleTagRemove(tag)}
                className="ml-1 text-blue-800 hover:text-blue-900 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd();
                }
              }}
              className="flex-1 px-1 py-0.5 bg-transparent focus:outline-none"
              placeholder="Add tags (press Enter to add)"
            />
            <button
              type="button"
              onClick={handleTagAdd}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exercise Content (Detailed Instructions)
        </label>
        <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {formData.content ? (
                  <span className="text-green-600">✓ Content added ({formData.content.length} characters)</span>
                ) : (
                  <span className="text-red-500">⚠ No content yet. Click "Edit Content" to add detailed exercise instructions.</span>
                )}
              </p>
              {formData.content && (
                <p className="text-xs text-gray-500">
                  Preview: {formData.content.substring(0, 100)}{formData.content.length > 100 ? '...' : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex-shrink-0"
            >
              {formData.content ? 'Edit Content' : 'Add Content'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded"
        >
          {loading ? (isEditing ? 'Updating...' : 'Creating...') : submitText}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>

      {/* Exercise Content Editor */}
      {isEditorOpen && (
        <ExerciseContentEditor
          content={formData.content}
          onChange={(content) => setFormData({ ...formData, content })}
          onSave={() => {
            // Ontent and update the editor
            setIsEditorOpen(false);
          }}
          onCancel={() => setIsEditorOpen(false)}
          title="Edit Exercise Content"
          showHeader={true}
          showTabs={false}
        />
      )}
    </form>
  );
}
