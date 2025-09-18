import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import UsersService from '../../services/users.service';

interface ChatMessage {
  _id: string;
  message: string;
  senderId: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  isRead: boolean;
}

interface StudentChatProps {
  courseId: string;
  studentId: string;
  enrollmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentChat({ courseId, studentId, enrollmentId, isOpen, onClose }: StudentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [studentName, setStudentName] = useState<string>('Student');

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get or create chat when component opens
  useEffect(() => {
    if (isOpen && !chatId) {
      getOrCreateChat();
    }
  }, [isOpen, chatId]);

  // Load student name when opened or student changes
  useEffect(() => {
    const loadStudentName = async () => {
      try {
        if (!studentId) return;
        const student = await UsersService.getInstance().getStudentById(studentId);
        if (student?.name) {
          setStudentName(student.name);
        }
      } catch (e) {
        // Keep default 'Student' on error
      }
    };
    if (isOpen) {
      loadStudentName();
    }
  }, [isOpen, studentId]);

  // Load messages when chat is available
  useEffect(() => {
    if (chatId) {
      loadMessages();
      // Set up polling for new messages (simple real-time)
      const interval = setInterval(loadMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [chatId]);

  const getOrCreateChat = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/chats/get-or-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          courseId,
          enrollmentId
        })
      });

      if (response.ok) {
        const chat = await response.json();
        setChatId(chat._id);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || loading) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Reload messages to get the new one
        loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-[80vh] sm:h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">{`Chat with ${studentName}`}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.senderId.role === 'teacher' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId.role === 'teacher'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-green-100 text-green-900'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.senderId.role === 'teacher' ? 'Teacher' : 'You'}
                  </div>
                  <div className="text-sm">{message.message}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 md:p-6 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
