import React, { useState, useEffect } from 'react';
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


  const handleAddCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd(id);
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-[#161616] rounded-md group 
            ${isHorizontal ? 'w-[300px] flex-shrink-0' : 'w-full max-w-[300px]'}
            flex flex-col px-4 pt-4`}
          style={{
            ...provided.draggableProps.style,
            height: 'fit-content',
            minHeight: isHorizontal ? 'auto' : '200px',
          }}
        >
          <div 
            {...provided.dragHandleProps}
            className="flex items-start justify-between mb-4 gap-2 list-header"
            onDoubleClick={() => setIsCollapsed(!isCollapsed)}
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
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this card?')) {
                            onDelete(id);
                          }
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
                onClick={handleAddCard}
                className="text-[#666666] hover:text-white transition-colors w-7 h-7 flex items-center justify-center text-lg"
              >
                +
              </button>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-[#666666] hover:text-white transition-colors w-6 h-6 flex items-center justify-center"
              >
                {isCollapsed ? '▼' : '▲'}
              </button>
            </div>
          </div>

          <Droppable 
            droppableId={id} 
            type="CARD"
            direction={isHorizontal ? 'horizontal' : 'vertical'}
          >
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-2 
                  ${isCollapsed ? 'h-0 overflow-hidden' : 'min-h-[50px] overflow-y-auto'} 
                  ${dropSnapshot.isDraggingOver ? 'bg-blue-500/5 ring-2 ring-blue-500/20' : ''}`}
                style={{
                  maxHeight: isHorizontal ? '100%' : 'calc(100vh - 300px)',
                }}
              >
                <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-2`}>
                  {cards?.map((card, cardIndex) => (
                    <Card
                      key={card.id}
                      id={card.id}
                      index={cardIndex}
                      title={card.title}
                      description={card.description}
                      onUpdate={(updates) => onUpdateCard(id, card.id, updates)}
                      onDelete={() => {
                        if (window.confirm('Are you sure you want to delete this card?')) {
                          onDeleteCard(id, card.id);
                        }
                      }}
                    />
                  ))}
                  {dropProvided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
};

export default List;
