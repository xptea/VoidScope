import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import { Draggable, Droppable } from 'react-beautiful-dnd';

interface CardType {
  id: string;
  title: string;
  description: string;
}

interface ListProps {
  title: string;
  index: number;
  id: string;
  cards: CardType[];
  onDelete: (listId: string) => void;
  onUpdate: (listId: string, newTitle: string) => void;
  onAdd: (listId: string, card?: { title: string; description: string }) => void;
  onUpdateCard: (listId: string, cardId: string, updates: Partial<CardType>) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  isHorizontal: boolean;
}

const List: React.FC<ListProps> = ({ 
  title, 
  index, 
  id, 
  cards, 
  onDelete, 
  onUpdate, 
  onAdd, 
  onUpdateCard, 
  onDeleteCard, 
  isHorizontal 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const isDraggingOverRef = useRef(false);
  const [isAutoExpanded, setIsAutoExpanded] = useState(false);

  useEffect(() => {
    return () => {
      if (isAutoExpanded) {
        setIsAutoExpanded(false);
        setIsCollapsed(true);
      }
    };
  }, [isAutoExpanded]);

  const handleSave = () => {
    onUpdate(id, editedTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only handle double-click if clicking the header area
    if ((e.target as HTMLElement).closest('.list-header')) {
      e.preventDefault();
      e.stopPropagation();
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleAddCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd(id);
  };

  return (
    <>
      <Draggable draggableId={id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            onDoubleClick={handleDoubleClick}
            className={`bg-[#161616] rounded-md group ${
              isHorizontal ? 'w-[300px] flex-shrink-0' : 'w-full max-w-[300px]'
            } flex flex-col ${
              !isCollapsed ? 'pb-1' : ''
            } px-4 pt-4 ${snapshot.isDragging ? 'shadow-xl' : 'shadow-lg hover:bg-[#171717]'}`}
            style={{
              ...provided.draggableProps.style,
              transform: provided.draggableProps.style?.transform,
              transition: snapshot.isDragging 
                ? provided.draggableProps.style?.transition 
                : 'background-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div 
              {...provided.dragHandleProps}
              className="flex items-start justify-between mb-4 gap-2 list-header"
            >
              <div className="flex-1 min-w-0 relative mr-2 flex">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-[#111111] rounded px-2 py-1 text-sm font-medium focus:outline-none text-white w-full"
                    style={{ maxWidth: '100%' }}
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
                  <h3 className={`text-[#999999] group-hover:text-white transition-colors font-medium px-1 min-w-0 flex-1
                    ${isCollapsed ? 'truncate' : 'break-words whitespace-normal'}`}>
                    {title}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isEditing && (
                  <div className="relative group/menu">
                    <button className="text-[#666666] hover:text-white w-6 h-6 flex items-center justify-center text-lg transition-all duration-200 transform group-hover/menu:rotate-90">
                      ≡
                    </button>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center z-20">
                      <div className="flex items-center gap-2 translate-x-2 opacity-0 group-hover/menu:translate-x-0 group-hover/menu:opacity-100 transition-all duration-200 bg-[#161616] shadow-md p-1 rounded-md">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-[#666666] hover:text-white w-6 h-6 flex items-center justify-center text-base"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onDelete(id)}
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
                      onClick={handleSave}
                      className="text-green-500 hover:text-green-400 w-6 h-6 flex items-center justify-center text-base"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-red-500 hover:text-red-400 w-6 h-6 flex items-center justify-center text-base"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="h-4 w-[1px] bg-[#222222] mx-1"></div>

                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-[#666666] hover:text-white transition-colors w-6 h-6 flex items-center justify-center"
                >
                  {isCollapsed ? '▼' : '▲'}
                </button>
              </div>
            </div>

            <Droppable droppableId={id} type="CARD">
              {(dropProvided, dropSnapshot) => {
                isDraggingOverRef.current = dropSnapshot.isDraggingOver;
                
                // Auto-expand when dragging over
                if (dropSnapshot.isDraggingOver && isCollapsed) {
                  setIsCollapsed(false);
                  setIsAutoExpanded(true);
                }

                // Return to collapsed state when drag leaves
                if (!dropSnapshot.isDraggingOver && isAutoExpanded) {
                  setTimeout(() => {
                    setIsCollapsed(true);
                    setIsAutoExpanded(false);
                  }, 200);
                }

                return (
                  <div
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    className={`flex flex-col gap-3 flex-1 min-h-[50px] 
                      overflow-y-auto overflow-x-hidden p-0.5 rounded-md transition-all duration-200 
                      no-scrollbar
                      ${isCollapsed ? 'max-h-0 p-0' : 'max-h-[calc(100vh-200px)]'} 
                      ${dropSnapshot.isDraggingOver ? 'bg-blue-500/5 ring-2 ring-blue-500/20' : ''}`}
                    style={{
                      opacity: isCollapsed ? 0 : 1,
                      transform: isCollapsed ? 'translateY(-8px)' : 'translateY(0)',
                      visibility: isCollapsed ? 'hidden' : 'visible',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {cards?.map((card, cardIndex) => (
                      <Card
                        key={card.id}
                        id={card.id}
                        index={cardIndex}
                        title={card.title}
                        description={card.description}
                        onUpdate={(updates) => onUpdateCard(id, card.id, updates)}
                        onDelete={() => onDeleteCard(id, card.id)}
                      />
                    ))}
                    {dropProvided.placeholder}
                  </div>
                );
              }}
            </Droppable>

            {!snapshot.isDragging && !isDraggingOverRef.current && (
              <div 
                className={`transition-all duration-200 ease-in-out overflow-hidden
                  ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[40px] opacity-100'}`}
                style={{
                  transform: isCollapsed ? 'translateY(-8px)' : 'translateY(0)',
                }}
              >
                <button
                  onClick={handleAddCard}
                  className="w-full py-1 text-[#666666] hover:text-white transition-all duration-200 
                    text-sm hover:bg-[#1a1a1a] rounded-md mt-2 opacity-0 group-hover:opacity-100"
                >
                  + Add Card
                </button>
              </div>
            )}
          </div>
        )}
      </Draggable>
    </>
  );
};

export default List;
