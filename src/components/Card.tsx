import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';

// Add the CardType interface
interface CardType {
  id: string;
  title: string;
  description: string;
}

interface CardProps {
  title: string;
  description: string;
  index: number;
  id: string;
  onUpdate: (updates: Partial<CardType>) => void;
  onDelete: () => void;
}

const Card: React.FC<CardProps> = ({ title, description, index, id, onUpdate, onDelete }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDescription, setEditedDescription] = useState(description);

  // Uncollapse when editing starts
  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(false);
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate({ title: editedTitle, description: editedDescription });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setEditedDescription(description);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete();
    setIsDeleting(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      e.stopPropagation();
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[#1a1a1a] p-3 rounded-md group w-full ${
            provided.draggableProps.style?.transform 
              ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20' 
              : 'hover:bg-[#1d1d1d]'
          }`}
          style={{
            ...provided.draggableProps.style,
            transform: provided.draggableProps.style?.transform,
            transition: provided.draggableProps.style?.transform
              ? provided.draggableProps.style?.transition
              : 'background-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-[#111111] rounded px-2 py-1 text-sm font-medium focus:outline-none text-white w-full"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                    if (e.key === 'Escape') {
                      handleCancel();
                    }
                  }}
                />
              ) : (
                <h4 className="font-medium text-sm group-hover:text-white transition-colors truncate">
                  {title}
                </h4>
              )}
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {!isEditing && !isDeleting && (
                <div className="relative group/menu">
                  <button className="text-[#666666] hover:text-white w-6 h-6 flex items-center justify-center text-lg transition-all duration-200 transform group-hover/menu:rotate-90">
                    ≡
                  </button>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center">
                    <div className="flex items-center gap-2 translate-x-2 opacity-0 group-hover/menu:translate-x-0 group-hover/menu:opacity-100 transition-all duration-200">
                      <button
                        onClick={startEditing}
                        className="text-[#666666] hover:text-white w-6 h-6 flex items-center justify-center text-base"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDeleting(true);
                        }}
                        className="text-[#666666] hover:text-red-500 w-6 h-6 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M6 7H5M6 7H8M18 7H19M18 7H16M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7M8 7H16M10 11V16M14 11V16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    className="text-green-500 hover:text-green-400 w-5 h-5 flex items-center justify-center text-sm"
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    className="text-red-500 hover:text-red-400 w-5 h-5 flex items-center justify-center leading-none"
                  >
                    ×
                  </button>
                </div>
              )}

              {isDeleting && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#666666]">Delete?</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="text-green-500 hover:text-green-400 w-5 h-5 flex items-center justify-center text-sm"
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleting(false);
                      }}
                      className="text-red-500 hover:text-red-400 w-5 h-5 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M6 7H5M6 7H8M18 7H19M18 7H16M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7M8 7H16M10 11V16M14 11V16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="h-4 w-[1px] bg-[#222222] mx-1"></div>

              {!isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(!isCollapsed);
                  }}
                  className="text-[#666666] hover:text-white transition-colors w-5 h-5 flex items-center justify-center"
                >
                  {isCollapsed ? '▼' : '▲'}
                </button>
              )}
            </div>
          </div>

          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100 mt-2'
            }`}
          >
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="bg-[#111111] border border-[#333333] text-xs w-full p-2 mt-1 focus:outline-none text-[#999999] resize-none rounded-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-[#666666] text-xs group-hover:text-[#999999] transition-colors">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Card;