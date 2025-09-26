'use client';

import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageCircle, FiSend, FiX, FiLoader } from "react-icons/fi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const customRenderers = {
  p: (props) => <p className="mb-2 last:mb-0" {...props} />,
  strong: (props) => <strong className="font-bold text-white" {...props} />,
  ul: (props) => <ul className="list-disc list-inside space-y-1 my-2 pl-2" {...props} />,
  ol: (props) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2" {...props} />,
  li: (props) => <li className="text-gray-300" {...props} />,
  a: (props) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  code: (props) => <code className="bg-gray-900 text-red-400 px-1 py-0.5 rounded-md text-xs" {...props} />,
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = process.env.NEXT_PUBLIC_GENAI_API_KEY;
  if (!apiKey) {
    console.error("API Key for Google GenAI is not set.");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

  const sendPrompt = async () => {
    if (!prompt.trim() || loading) return;

    const newMessages = [...messages, { from: "user", text: prompt }];
    setMessages(newMessages);
    setLoading(true);
    setPrompt("");

    try {
      const result = await model.generateContentStream(prompt);

      let botResponse = "";
      setMessages((prev) => [...prev, { from: "bot", text: "" }]);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        botResponse += chunkText;
        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1].text = botResponse;
          return updatedMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [ ...prev, { from: "bot", text: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center z-50 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-4 w-80 md:w-96 h-[60vh] bg-gray-800 text-white rounded-xl shadow-xl flex flex-col z-50 border border-gray-700"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.from === "user" ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`p-3 rounded-lg max-w-[85%] text-sm ${
                    msg.from === "user"
                      ? "bg-blue-600 self-end"
                      : "bg-gray-700 self-start"
                  }`}
                >
                  {msg.from === "user" ? (
                    <span className='whitespace-pre-wrap'>{msg.text}</span>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={customRenderers}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </motion.div>
              ))}
               {loading && messages[messages.length - 1]?.from === 'user' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg max-w-[85%] bg-gray-700 self-start flex items-center"
                >
                    <span className="animate-pulse">...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-700 flex items-center space-x-2">
              <textarea
                className="flex-1 border rounded-md px-3 py-2.5 resize-none h-12 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tulis pesan…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendPrompt();
                  }
                }}
              />
              <button
                onClick={sendPrompt}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={loading}
                aria-label="Send message"
              >
                {loading ? <FiLoader className="animate-spin" size={20} /> : <FiSend size={20} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}