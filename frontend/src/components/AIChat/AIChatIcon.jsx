import { Brain } from "lucide-react";

const AIChatIcon = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center transition-all duration-200 ${
        isOpen ? 'text-blue-600' : 'text-neutral hover:text-blue-600'
      }`}
      title="AI Assistant"
    >
      <div className="relative">
        <Brain size={20} />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      <span className="text-xs hidden md:block">AI Assistant</span>
    </button>
  );
};

export default AIChatIcon; 