import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onBoardsClick: () => void;
  onTrelloImport?: () => void;
  onSettingsClick: () => void;
}

const Sidebar = ({ onBoardsClick, onTrelloImport, onSettingsClick }: SidebarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { logout } = useAuth();

  const shouldShowIcons = isHovered || isLocked;

  return (
    <div 
      className="w-12 bg-[#111111] py-3 flex flex-col border-r border-[#222222] items-center group/sidebar"
    >
      <h1 className="text-xs font-medium tracking-wide text-[#666666] gap-5 rotate-90 whitespace-nowrap mt-10">
        VOID DASHBORD
      </h1>
      
      <div className="flex-1 flex flex-col items-center justify-end gap-3 mb-3">
        {/* Boards Button */}
        <div className={`transform transition-all duration-200 ${
          shouldShowIcons ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
          <button 
            onClick={onBoardsClick}
            className="w-10 h-10 flex items-center justify-center group"
          >
            <svg className="w-4 h-4 text-[#999999] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm2 0v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z"/>
            </svg>
          </button>
        </div>

        {/* Import/New Button - Changed icon to plus */}
        <div className={`transform transition-all duration-200 ${
          shouldShowIcons ? 'translate-y-0 opacity-100 delay-75' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
          <button 
            onClick={onTrelloImport}
            className="w-10 h-10 flex items-center justify-center group"
          >
            <svg className="w-4 h-4 text-[#999999] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        {/* Settings */}
        <div className={`transform transition-all duration-200 ${
          shouldShowIcons ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
          <button 
            onClick={onSettingsClick}
            className="w-10 h-10 flex items-center justify-center group"
          >
            <svg className="w-4 h-4 text-[#999999] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
        </div>

        {/* Logout */}
        <div className={`transform transition-all duration-200 ${
          shouldShowIcons ? 'translate-y-0 opacity-100 delay-150' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
          <button 
            onClick={logout} 
            className="w-10 h-10 flex items-center justify-center group"
          >
            <svg className="w-4 h-4 text-[#999999] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Menu Toggle */}
      <div>
        <button 
          onClick={() => setIsLocked(!isLocked)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`w-10 h-10 flex items-center justify-center group transition-transform duration-300 ${
            isLocked ? 'rotate-180 text-white' : 'text-[#999999]'
          }`}
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
