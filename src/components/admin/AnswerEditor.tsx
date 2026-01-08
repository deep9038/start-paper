'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Mathematics from '@tiptap/extension-mathematics';
import { useCallback, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  ImageIcon,
  Undo,
  Redo,
  Calculator,
  X,
  Loader2,
} from 'lucide-react';
import 'katex/dist/katex.min.css';

interface AnswerEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  questionNumber?: string;
  onImageUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
  minHeight?: string;
}

/**
 * Rich text editor for answer input with LaTeX support
 * Uses Tiptap with Mathematics extension for KaTeX rendering
 */
export default function AnswerEditor({
  content,
  onChange,
  placeholder = 'Enter your answer here...',
  questionNumber,
  onImageUpload,
  disabled = false,
  minHeight = '200px',
}: AnswerEditorProps) {
  const [showLatexHelper, setShowLatexHelper] = useState(false);
  const [latexInput, setLatexInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mathematics.configure({
        regex: /\$([^$]+)\$/gi,
        katexOptions: {
          throwOnError: false,
          displayMode: false,
        },
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      if (onImageUpload) {
        setIsUploading(true);
        try {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Failed to upload image. Please try again.');
        } finally {
          setIsUploading(false);
        }
      } else {
        // Fallback: Use base64 encoding
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && typeof reader.result === 'string') {
            editor.chain().focus().setImage({ src: reader.result }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  // Insert LaTeX formula
  const insertLatex = useCallback(() => {
    if (!editor || !latexInput.trim()) return;

    // Insert inline LaTeX wrapped in $...$
    const latex = `$${latexInput.trim()}$`;
    editor.chain().focus().insertContent(latex).run();
    setLatexInput('');
    setShowLatexHelper(false);
  }, [editor, latexInput]);

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 animate-pulse" style={{ minHeight }}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            disabled={disabled}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            disabled={disabled}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            disabled={disabled}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            disabled={disabled}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            disabled={disabled}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            disabled={disabled}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Code */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            disabled={disabled}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Math/LaTeX */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => setShowLatexHelper(!showLatexHelper)}
            active={showLatexHelper}
            disabled={disabled}
            title="Insert LaTeX Formula"
          >
            <Calculator className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Image */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={handleImageUpload}
            disabled={disabled || isUploading}
            title="Insert Image"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Question number indicator */}
        {questionNumber && (
          <div className="ml-auto text-sm text-gray-500 flex items-center">
            Question {questionNumber}
          </div>
        )}
      </div>

      {/* LaTeX Helper Modal */}
      {showLatexHelper && (
        <div className="border-b bg-blue-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-800">Insert LaTeX Formula</span>
            <button
              onClick={() => setShowLatexHelper(false)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && insertLatex()}
              placeholder="e.g., x^2 + y^2 = r^2"
              className="flex-1 px-3 py-2 border rounded text-sm font-mono"
            />
            <button
              onClick={insertLatex}
              disabled={!latexInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Insert
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p className="mb-1">Common examples:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Fraction', value: '\\frac{a}{b}' },
                { label: 'Square root', value: '\\sqrt{x}' },
                { label: 'Power', value: 'x^{n}' },
                { label: 'Subscript', value: 'x_{i}' },
                { label: 'Sum', value: '\\sum_{i=1}^{n}' },
                { label: 'Integral', value: '\\int_{a}^{b}' },
                { label: 'Greek (alpha)', value: '\\alpha' },
                { label: 'Greek (beta)', value: '\\beta' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setLatexInput(value)}
                  className="px-2 py-1 bg-white border rounded text-xs hover:bg-gray-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bubble menu for quick formatting */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bg-gray-900 rounded-lg shadow-lg flex overflow-hidden">
            <BubbleButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
            >
              <Bold className="w-4 h-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
            >
              <Italic className="w-4 h-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
            >
              <UnderlineIcon className="w-4 h-4" />
            </BubbleButton>
          </div>
        </BubbleMenu>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 focus:outline-none"
        style={{ minHeight }}
      />

      {/* Word count */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between">
        <span>
          {editor.storage.characterCount?.characters?.() || editor.getText().length} characters
        </span>
        <span>Use $...$ for inline math</span>
      </div>
    </div>
  );
}

/**
 * Toolbar button component
 */
function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'hover:bg-gray-200 text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

/**
 * Bubble menu button component
 */
function BubbleButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-white transition-colors ${
        active ? 'bg-blue-600' : 'hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
